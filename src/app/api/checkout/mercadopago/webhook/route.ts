import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/payments/mercadopago";
import {
  getOrderByIdFromFirestore,
  createOrderInFirestore,
  deductProductStockAtomic,
} from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { sendOrderConfirmationEmail } from "@/lib/services/emailService";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

interface MercadoPagoWebhookBody {
  action?: string;
  type?: string;
  topic?: string;
  id?: string;
  data?: { id?: string };
  resource?: string;
  simulated?: boolean;
  orderId?: string;
  paymentDetails?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as MercadoPagoWebhookBody;
    const { searchParams } = new URL(req.url);

    // 1. Handle Sandbox Simulation
    if (body.simulated && body.orderId) {
      // SECURITY: Disallow arbitrary unauthenticated simulated payments in non-local environments
      const host = req.headers.get("host") || "";
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      const simulationSecret = req.headers.get("x-simulation-key");
      const expectedSecret = process.env.SANDBOX_SIMULATION_KEY || "omnicollector-sandbox-key";

      if (!isLocal && simulationSecret !== expectedSecret) {
        return NextResponse.json(
          { error: "Forbidden", message: "Simulación de pagos restringida en este entorno." },
          { status: 403 }
        );
      }

      const orderId = body.orderId;
      const paymentDetails = body.paymentDetails || {};

      // Check Cloud Firestore for idempotency
      const firestoreOrder = await getOrderByIdFromFirestore(orderId);
      if (firestoreOrder) {
        // IDEMPOTENCY GUARD: Do not deduct stock or re-send emails if already paid/confirmed
        if (firestoreOrder.paymentStatus === "PAID" || firestoreOrder.status === "CANCELLED") {
          console.info(`[MP_SIMULATED_IDEMPOTENT] Order ${orderId} already processed.`);
          return NextResponse.json({
            success: true,
            message: "Orden simulada ya acreditada previamente (Idempotencia verificada).",
            idempotent: true,
            orderId,
          });
        }

        const updated: ConfirmedOrderEntity = {
          ...firestoreOrder,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentId: String(paymentDetails.paymentId || `sim-${Date.now()}`),
          updatedAt: new Date().toISOString(),
        };
        await createOrderInFirestore(updated);

        // Deduct stock in Firestore atomically
        try {
          if (!firestoreOrder.stockDeducted) await deductProductStockAtomic(
            (firestoreOrder.items || []).map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
            }))
          );
        } catch (stkErr) {
          console.warn("[Simulated Payment] Stock deduction warning:", stkErr);
        }

        // Dispatch confirmation email
        try {
          await sendOrderConfirmationEmail(updated);
        } catch (emailErr) {
          console.warn("[Simulated Payment] Failed to send email receipt:", emailErr);
        }
      }

      // Update in memory DB
      const store = MemoryTransactionalStore.getInstance();
      const memOrder = store.orders.get(orderId);
      if (memOrder) {
        memOrder.status = "CONFIRMED";
        memOrder.paymentStatus = "PAID";
        memOrder.updatedAt = new Date().toISOString();
        store.orders.set(orderId, memOrder);
      }

      return NextResponse.json({
        success: true,
        message: "Pago simulado acreditado con éxito en Cloud Firestore.",
        orderId,
      });
    }

    // 2. Handle Real Mercado Pago IPN Webhook
    // Mercado Pago can send query params (topic=payment&id=123), json body (type=payment, data.id=123), or action (payment.created)
    const action = body.action;
    const topic = body.type || body.topic || searchParams.get("topic") || searchParams.get("type") || (action?.startsWith("payment") ? "payment" : undefined);
    let paymentId = body.data?.id || body.id || searchParams.get("id") || searchParams.get("data.id");

    if (!paymentId && body.resource && typeof body.resource === "string") {
      const match = body.resource.match(/payments\/(\d+)/);
      if (match) {
        paymentId = match[1];
      }
    }

    if ((topic === "payment" || action?.startsWith("payment")) && paymentId) {
      const payment = await getMercadoPagoPayment(paymentId);
      if (!payment) {
        return NextResponse.json({ error: "No se pudo consultar el pago" }, { status: 404 });
      }

      const orderId = payment.external_reference;
      const status = payment.status;

      if (orderId && status === "approved") {
        const firestoreOrder = await getOrderByIdFromFirestore(orderId);
        const store = MemoryTransactionalStore.getInstance();
        const memOrder = store.orders.get(orderId);

        // IDEMPOTENCY GUARD: Check if order was already confirmed/paid
        const isAlreadyProcessed =
          (firestoreOrder && (firestoreOrder.paymentStatus === "PAID" || firestoreOrder.status === "CANCELLED")) ||
          (memOrder && (memOrder.paymentStatus === "PAID" || memOrder.status === "CANCELLED"));

        if (isAlreadyProcessed) {
          console.info(
            `[MP_WEBHOOK_IDEMPOTENT] Payment for order ${orderId} already fulfilled. Skipping duplicate stock deduction.`
          );
          return NextResponse.json(
            {
              received: true,
              idempotent: true,
              orderId,
              message: "Notificación de pago previamente procesada con éxito.",
            },
            { status: 200 }
          );
        }

        // Process first-time approved payment
        if (firestoreOrder) {
          const updated: ConfirmedOrderEntity = {
            ...firestoreOrder,
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paymentId: String(payment.id),
            updatedAt: new Date().toISOString(),
          };
          await createOrderInFirestore(updated);

          // Deduct stock in Firestore atomically
          try {
            if (!firestoreOrder.stockDeducted) await deductProductStockAtomic(
              (firestoreOrder.items || []).map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
              }))
            );
          } catch (stkErr) {
            console.warn("[MP Webhook] Stock deduction warning:", stkErr);
          }

          // Dispatch transactional order receipt email to customer
          try {
            await sendOrderConfirmationEmail(updated);
          } catch (mailErr) {
            console.warn("[Webhook] Failed to dispatch order confirmation email:", mailErr);
          }
        }

        // Update in Memory DB
        if (memOrder) {
          memOrder.status = "CONFIRMED";
          memOrder.paymentStatus = "PAID";
          memOrder.paymentId = String(payment.id);
          memOrder.updatedAt = new Date().toISOString();
          store.orders.set(orderId, memOrder);
        }
      }
    }

    // Mercado Pago requires a 200/201 status code response to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Mercado Pago Webhook Error]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
