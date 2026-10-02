import { NextRequest, NextResponse } from "next/server";
import { getFlowPaymentStatus } from "@/lib/payments/flow";
import {
  getOrderByIdFromFirestore,
  createOrderInFirestore,
  deductProductStockAtomic,
} from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { sendOrderConfirmationEmail } from "@/lib/services/emailService";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

/**
 * Webhook receiver for Flow.cl (Transbank Webpay Plus)
 * Flow notifies this endpoint via POST with token in the form body
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 400 });
    }

    const flowPayment = await getFlowPaymentStatus(token);
    if (!flowPayment) {
      return NextResponse.json({ error: "Could not fetch Flow status" }, { status: 400 });
    }

    const orderId = flowPayment.commerceOrder;
    // Flow status: 1 = Pending, 2 = Paid, 3 = Rejected, 4 = Cancelled
    const isPaid = flowPayment.status === 2;

    if (isPaid && orderId) {
      const store = MemoryTransactionalStore.getInstance();
      const memOrder = store.orders.get(orderId);
      const firestoreOrder = await getOrderByIdFromFirestore(orderId);

      // IDEMPOTENCY GUARD: Do not process duplicate fulfillment
      const isAlreadyProcessed =
        (firestoreOrder && (firestoreOrder.paymentStatus === "PAID" || firestoreOrder.status === "CANCELLED")) ||
        (memOrder && (memOrder.paymentStatus === "PAID" || memOrder.status === "CANCELLED"));

      if (isAlreadyProcessed) {
        console.info(`[FLOW_WEBHOOK_IDEMPOTENT] Order ${orderId} already fulfilled. Skipping duplicate processing.`);
        return NextResponse.json({
          received: true,
          idempotent: true,
          status: flowPayment.status,
          message: "Orden Flow ya procesada previamente.",
        });
      }

      // 1. In-memory update
      if (memOrder) {
        memOrder.status = "CONFIRMED";
        memOrder.paymentStatus = "PAID";
        memOrder.paymentId = String(flowPayment.flowOrder);
        memOrder.updatedAt = new Date().toISOString();
        store.orders.set(orderId, memOrder);
      }

      // 2. Firestore update
      if (firestoreOrder) {
        const updated: ConfirmedOrderEntity = {
          ...firestoreOrder,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentId: String(flowPayment.flowOrder),
          updatedAt: new Date().toISOString(),
        };
        await createOrderInFirestore(updated);

        // Atomic stock deduction
        try {
          if (!firestoreOrder.stockDeducted) await deductProductStockAtomic(
            (firestoreOrder.items || []).map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
            }))
          );
        } catch (stkErr) {
          console.warn("[Flow Webhook] Stock deduction warning:", stkErr);
        }

        // Transactional email
        try {
          await sendOrderConfirmationEmail(updated);
        } catch (mailErr) {
          console.warn("[Flow Webhook] Failed to dispatch email receipt:", mailErr);
        }
      }
    }

    return NextResponse.json({ received: true, status: flowPayment.status });
  } catch (error) {
    console.error("[Flow Webhook Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
