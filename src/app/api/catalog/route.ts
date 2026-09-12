import { NextResponse } from "next/server";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { BundleService } from "@/lib/services/BundleService";

export async function GET() {
  const store = MemoryTransactionalStore.getInstance();
  store.sweepExpiredReservations();

  const products = Array.from(store.products.values());
  const bundleService = new BundleService(store);

  const enriched = products.map((prod) => {
    if (prod.type === "BUNDLE") {
      try {
        const bundleInfo = bundleService.getBundleAvailability(prod.id);
        return {
          ...prod,
          calculatedAvailableStock: bundleInfo.calculatedAvailableStock,
          aggregateMarginPercent: bundleInfo.aggregateMarginPercent,
          nominalSumOfItems: bundleInfo.nominalSumOfItems,
          componentsBreakdown: bundleInfo.components,
        };
      } catch {
        return prod;
      }
    }
    return prod;
  });

  return NextResponse.json({
    success: true,
    data: {
      products: enriched,
      activeReservationsCount: Array.from(store.reservations.values()).filter((r) => r.status === "PENDING").length,
      preOrderDepositsCount: store.preOrderDeposits.size,
    },
  });
}
