import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdFromFirestore, createOrderInFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const status = searchParams.get("status") || searchParams.get("collection_status");
  const orderId = searchParams.get("external_reference") || searchParams.get("orderId");

  const baseUrl = req.nextUrl.origin;

  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/checkout`);
  }

  // If payment is approved, mark as PAID
  if (status === "approved" && paymentId) {
    const paymentDetails = {
      paymentId,
      status: "approved",
      paymentMethodId: searchParams.get("payment_type") || "credit_card",
      merchantOrderId: searchParams.get("merchant_order_id"),
      dateApproved: new Date().toISOString(),
    };

    // In-memory update
    const store = MemoryTransactionalStore.getInstance();
    const memOrder = store.orders.get(orderId);
    if (memOrder) {
      memOrder.status = "CONFIRMED";
      (memOrder as any).paymentStatus = "PAID";
      (memOrder as any).paymentDetails = paymentDetails;
      store.orders.set(orderId, memOrder);
    }

    // Firestore update
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

    return NextResponse.redirect(
      `${baseUrl}/order-confirmation/${orderId}?status=approved&payment_id=${paymentId}`
    );
  }

  // If pending or other
  if (status === "pending") {
    return NextResponse.redirect(
      `${baseUrl}/order-confirmation/${orderId}?status=pending&payment_id=${paymentId}`
    );
  }

  // If rejected or cancelled
  return NextResponse.redirect(
    `${baseUrl}/checkout?status=failure&orderId=${orderId}`
  );
}
