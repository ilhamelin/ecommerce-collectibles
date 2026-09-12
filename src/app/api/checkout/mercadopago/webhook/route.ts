import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/payments/mercadopago";
import { getOrderByIdFromFirestore, createOrderInFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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

      // Update in memory DB
      const store = MemoryTransactionalStore.getInstance();
      const memOrder = store.orders.get(orderId);
      if (memOrder) {
        memOrder.status = "CONFIRMED";
        (memOrder as any).paymentStatus = "PAID";
        (memOrder as any).paymentDetails = paymentDetails;
        store.orders.set(orderId, memOrder);
      }

      // Update in Cloud Firestore
      const firestoreOrder = await getOrderByIdFromFirestore(orderId);
      if (firestoreOrder) {
        const updated = {
          ...firestoreOrder,
          status: "CONFIRMED" as const,
          paymentStatus: "PAID",
          paymentDetails,
          updatedAt: new Date().toISOString(),
        };
        await createOrderInFirestore(updated);
      }

      return NextResponse.json({
        success: true,
        message: "Pago simulado acreditado con éxito en Cloud Firestore.",
      });
    }

    // 2. Handle Real Mercado Pago IPN Webhook
    // Mercado Pago can send either query params (topic=payment&id=123) or json body (type=payment, data.id=123)
    const topic = body.type || body.topic || searchParams.get("topic") || searchParams.get("type");
    const paymentId = body.data?.id || body.id || searchParams.get("id") || searchParams.get("data.id");

    if (topic === "payment" && paymentId) {
      const payment = await getMercadoPagoPayment(paymentId);
      if (!payment) {
        return NextResponse.json({ error: "No se pudo consultar el pago" }, { status: 404 });
      }

      const orderId = payment.external_reference;
      const status = payment.status;

      if (orderId && status === "approved") {
        const paymentDetails = {
          paymentId: String(payment.id),
          status: payment.status,
          statusDetail: payment.status_detail,
          paymentMethodId: payment.payment_method_id,
          paymentTypeId: payment.payment_type_id,
          installments: payment.installments,
          transactionAmount: payment.transaction_amount,
          cardLast4: payment.card?.last_four_digits,
          dateApproved: payment.date_approved,
        };

        // Update in Memory DB
        const store = MemoryTransactionalStore.getInstance();
        const memOrder = store.orders.get(orderId);
        if (memOrder) {
          memOrder.status = "CONFIRMED";
          (memOrder as any).paymentStatus = "PAID";
          (memOrder as any).paymentDetails = paymentDetails;
          store.orders.set(orderId, memOrder);
        }

        // Update in Cloud Firestore
        const firestoreOrder = await getOrderByIdFromFirestore(orderId);
        if (firestoreOrder) {
          const updated = {
            ...firestoreOrder,
            status: "CONFIRMED" as const,
            paymentStatus: "PAID",
            paymentDetails,
            updatedAt: new Date().toISOString(),
          };
          await createOrderInFirestore(updated);
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
