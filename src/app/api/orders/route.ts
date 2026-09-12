import { NextRequest, NextResponse } from "next/server";
import { getAllOrdersFromFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const emailFilter = (searchParams.get("email") || "").toLowerCase().trim();
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    // 1. Fetch from Firestore
    let orders: ConfirmedOrderEntity[] = await getAllOrdersFromFirestore();

    // 2. Fallback to memory store if Firestore is empty or mock
    if (orders.length === 0) {
      const memoryStore = MemoryTransactionalStore.getInstance();
      orders = Array.from(memoryStore.orders.values());
    }

    // 3. Deduplicate by order id or orderNumber
    const orderMap = new Map<string, ConfirmedOrderEntity>();
    for (const ord of orders) {
      const key = ord.id || ord.orderNumber;
      if (!orderMap.has(key)) {
        orderMap.set(key, ord);
      }
    }
    let allOrders = Array.from(orderMap.values());

    // 4. Sort by date descending
    allOrders.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // 5. Apply Email filter (for account orders view)
    if (emailFilter) {
      allOrders = allOrders.filter(
        (ord) => (ord.customer?.email || "").toLowerCase().trim() === emailFilter
      );
    }

    // 6. Apply Status filter
    if (statusFilter && statusFilter !== "ALL") {
      allOrders = allOrders.filter(
        (ord) => ord.status?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // 6. Apply Search query filter (Order number, customer name, email, rut)
    if (query) {
      allOrders = allOrders.filter((ord) => {
        const num = (ord.orderNumber || "").toLowerCase();
        const id = (ord.id || "").toLowerCase();
        const name = (ord.customer?.fullName || "").toLowerCase();
        const email = (ord.customer?.email || "").toLowerCase();
        const rut = (ord.customer?.rut || "").toLowerCase();
        const tracking = (ord.shippingMethod?.trackingNumber || "").toLowerCase();

        return (
          num.includes(query) ||
          id.includes(query) ||
          name.includes(query) ||
          email.includes(query) ||
          rut.includes(query) ||
          tracking.includes(query)
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: allOrders,
        totalCount: allOrders.length,
      },
    });
  } catch (error) {
    console.error("[Orders API] Error fetching orders:", error);
    return NextResponse.json(
      { error: "InternalError", message: "Error al consultar los pedidos." },
      { status: 500 }
    );
  }
}
