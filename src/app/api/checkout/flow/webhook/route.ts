import { NextRequest, NextResponse } from "next/server";
import { getFlowPaymentStatus } from "@/lib/payments/flow";
import { getOrderByIdFromFirestore, createOrderInFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";

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
      const paymentDetails = {
        paymentId: String(flowPayment.flowOrder),
        status: "approved",
        paymentMethodId: flowPayment.paymentData?.media || "Webpay Plus",
        merchantOrderId: flowPayment.commerceOrder,
        dateApproved: flowPayment.paymentData?.date || new Date().toISOString(),
      };

      // 1. In-memory update
      const store = MemoryTransactionalStore.getInstance();
      const memOrder = store.orders.get(orderId);
      if (memOrder) {
        memOrder.status = "CONFIRMED";
        (memOrder as any).paymentStatus = "PAID";
        (memOrder as any).paymentDetails = paymentDetails;
        store.orders.set(orderId, memOrder);
      }

      // 2. Firestore update
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

    return NextResponse.json({ received: true, status: flowPayment.status });
  } catch (error) {
    console.error("[Flow Webhook Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
