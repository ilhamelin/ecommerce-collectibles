import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { BundleService } from "@/lib/services/BundleService";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = MemoryTransactionalStore.getInstance();
  const persisted = await getProductsFromFirestore(true);
  if (persisted === null && (isFirebaseConfigured() || isFirebaseAdminConfigured())) return NextResponse.json({ success: false, error: "Catálogo temporalmente no disponible" }, { status: 503 });
  if (persisted !== null) CatalogRepository.getInstance().syncWithFirestore(persisted);
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
