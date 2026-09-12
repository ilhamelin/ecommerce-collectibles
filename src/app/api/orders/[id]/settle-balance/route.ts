import { NextRequest, NextResponse } from "next/server";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import {
  getOrderByIdFromFirestore,
  updateOrderInFirestore,
} from "@/lib/firebase/firestore";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));
    const { paymentMethod = "Webpay Plus", paymentId } = body;

    // 1. Locate existing order in Firestore or Memory
    let order: ConfirmedOrderEntity | null = await getOrderByIdFromFirestore(orderId);
    const store = MemoryTransactionalStore.getInstance();

    if (!order) {
      order = store.orders.get(orderId) || null;
      if (!order) {
        for (const ord of store.orders.values()) {
          if (ord.orderNumber === orderId) {
            order = ord;
            break;
          }
        }
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "NotFound", message: `Pedido '${orderId}' no encontrado.` },
        { status: 404 }
      );
    }

    // 2. Check if already settled
    if (order.balancePaid && order.remainingBalanceLater === 0) {
      return NextResponse.json({
        success: true,
        message: "El saldo de este pedido ya ha sido liquidado en su totalidad.",
        data: order,
      });
    }

    const settledAmount = order.remainingBalanceLater;
    const transactionId = paymentId || `SIM-BAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    // 3. Prepare updates
    const updates: Partial<ConfirmedOrderEntity> = {
      remainingBalanceLater: 0,
      balancePaid: true,
      balancePaidAt: now,
      balancePaymentTransactionId: transactionId,
      status: order.status === "CONFIRMED" || order.status === "PENDING" ? "PREPARING" : order.status,
      updatedAt: now,
    };

    // 4. Update Firestore if configured
    const docId = order.id || order.orderNumber;
    await updateOrderInFirestore(docId, updates);

    // 5. Update Memory Store
    const updatedOrder: ConfirmedOrderEntity = {
      ...order,
      ...updates,
    };
    store.orders.set(order.id, updatedOrder);
    if (order.orderNumber && order.orderNumber !== order.id) {
      store.orders.set(order.orderNumber, updatedOrder);
    }

    return NextResponse.json({
      success: true,
      message: `¡Saldo de pre-venta ($${settledAmount.toLocaleString("es-CL")} CLP) liquidado exitosamente! El pedido ahora está completamente pagado.`,
      data: updatedOrder,
      settledAmount,
      transactionId,
    });
  } catch (error) {
    console.error("[SettleBalance API] Error:", error);
    return NextResponse.json(
      { error: "InternalError", message: "Error al procesar la liquidación del saldo." },
      { status: 500 }
    );
  }
}
