import { NextRequest, NextResponse } from "next/server";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import {
  getOrderByIdFromFirestore,
  updateOrderInFirestore,
  deleteOrderFromFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { sanitizeText } from "@/lib/utils/sanitizer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Try Firestore first
  const firestoreOrder = await getOrderByIdFromFirestore(params.id);
  if (firestoreOrder) {
    return NextResponse.json({ success: true, data: firestoreOrder });
  }

  // 2. Fallback to memory store
  const store = MemoryTransactionalStore.getInstance();
  const order = store.orders.get(params.id);

  if (!order) {
    // Also search by orderNumber just in case
    for (const ord of store.orders.values()) {
      if (ord.orderNumber === params.id) {
        return NextResponse.json({ success: true, data: ord });
      }
    }

    return NextResponse.json(
      { error: "NotFound", message: `Pedido '${params.id}' no encontrado.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, trackingNumber, adminNotes, shippingCourier, preOrderWarehouseArrivalNotified, deliveredAt, clientTrackingUpdate } = body;

    // Admin check: required for admin notes, manual edits, or non-tracking modifications
    const authCheck = verifyAdminAuthorization(req);
    const isAllowedTrackingTransition =
      clientTrackingUpdate === true &&
      (status === "DISPATCHED" || status === "DELIVERED" || status === "PREPARING" || status === "CONFIRMED");

    if (!authCheck.authorized && !isAllowedTrackingTransition) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Acceso denegado: Se requieren permisos de administrador para modificar pedidos.",
        },
        { status: 403 }
      );
    }

    // Find existing order
    let order = await getOrderByIdFromFirestore(params.id);
    const store = MemoryTransactionalStore.getInstance();

    if (!order) {
      order = store.orders.get(params.id) || null;
      if (!order) {
        for (const ord of store.orders.values()) {
          if (ord.orderNumber === params.id) {
            order = ord;
            break;
          }
        }
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "NotFound", message: `Pedido '${params.id}' no encontrado.` },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = sanitizeText(adminNotes);
    }

    if (trackingNumber !== undefined || shippingCourier !== undefined) {
      const cleanTracking = trackingNumber !== undefined ? sanitizeText(trackingNumber) : order.shippingMethod.trackingNumber;
      const cleanCourier = shippingCourier ? sanitizeText(shippingCourier) : "";
      updates.shippingMethod = {
        ...order.shippingMethod,
        trackingNumber: cleanTracking,
        name: cleanCourier ? `${cleanCourier} - Despacho Asegurado` : order.shippingMethod.name,
      };
    }

    if (preOrderWarehouseArrivalNotified !== undefined) {
      updates.preOrderWarehouseArrivalNotified = Boolean(preOrderWarehouseArrivalNotified);
      if (preOrderWarehouseArrivalNotified) {
        updates.preOrderWarehouseNotifiedAt = new Date().toISOString();
      }
    }

    if (status === "DELIVERED" || deliveredAt) {
      updates.deliveredAt = deliveredAt || new Date().toISOString();
    }

    // Update in Firestore and sync with user document
    const docId = order.id || order.orderNumber;
    await updateOrderInFirestore(docId, updates, order.customer?.email);

    // Update in memory store
    const merged = {
      ...order,
      ...updates,
    };
    store.orders.set(order.id, merged);

    return NextResponse.json({
      success: true,
      message: "Pedido actualizado exitosamente.",
      data: merged,
    });
  } catch (error) {
    console.error("[Orders API] Error updating order:", error);
    return NextResponse.json(
      { error: "InternalError", message: "Error al actualizar el pedido." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Acceso denegado: Se requieren permisos de administrador para cancelar o eliminar pedidos.",
        },
        { status: 403 }
      );
    }

    const store = MemoryTransactionalStore.getInstance();
    let order = await getOrderByIdFromFirestore(params.id);

    if (!order) {
      order = store.orders.get(params.id) || null;
      if (!order) {
        for (const ord of store.orders.values()) {
          if (ord.orderNumber === params.id) {
            order = ord;
            break;
          }
        }
      }
    }

    const docId = order?.id || order?.orderNumber || params.id;

    // Delete from Firestore
    await deleteOrderFromFirestore(docId);

    // Delete from memory store
    if (order?.id) {
      store.orders.delete(order.id);
    }
    store.orders.delete(params.id);

    return NextResponse.json({
      success: true,
      message: `El pedido '${docId}' ha sido cancelado y eliminado del sistema correctamente.`,
    });
  } catch (error) {
    console.error("[Orders API] Error deleting order:", error);
    return NextResponse.json(
      { error: "InternalError", message: "Error al eliminar el pedido." },
      { status: 500 }
    );
  }
}
