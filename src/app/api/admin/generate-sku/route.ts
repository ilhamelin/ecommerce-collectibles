import { NextRequest, NextResponse } from "next/server";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { generateBaseSku, resolveSkuCollision } from "@/lib/utils/sku-generator";
import { ProductType } from "@/lib/types/domain";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, type = "FIGURE", checkSku } = body;

    // 1. Gather all existing SKUs from Firestore DB and Memory fallback
    const firestoreProducts = await getProductsFromFirestore();
    const repoProducts = CatalogRepository.getInstance().getAll();

    const allProducts = (firestoreProducts && firestoreProducts.length > 0)
      ? firestoreProducts
      : repoProducts;

    const existingSkus = new Set<string>();
    for (const p of allProducts) {
      if (p.sku) existingSkus.add(p.sku.toUpperCase().trim());
    }
    for (const p of repoProducts) {
      if (p.sku) existingSkus.add(p.sku.toUpperCase().trim());
    }

    // 2. Direct SKU Check Mode
    if (checkSku) {
      const target = String(checkSku).toUpperCase().trim();
      const isTaken = existingSkus.has(target);
      return NextResponse.json({
        success: true,
        checkedSku: target,
        isAvailable: !isTaken,
        exists: isTaken,
        message: isTaken
          ? `El SKU '${target}' ya está registrado en la base de datos.`
          : `El SKU '${target}' está libre y disponible.`,
      });
    }

    // 3. Generation Mode
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar el nombre del producto para generar el SKU." },
        { status: 400 }
      );
    }

    const baseSku = generateBaseSku(name.trim(), type as ProductType);
    const { sku, hadCollision, collisionCount } = resolveSkuCollision(baseSku, existingSkus);

    return NextResponse.json({
      success: true,
      sku,
      baseSku,
      hadCollision,
      collisionCount,
      databaseCount: existingSkus.size,
      message: hadCollision
        ? `Se detectó colisión con SKU existente en BD. Se generó variante secuencial única '${sku}'.`
        : `SKU '${sku}' generado con éxito y verificado 100% único en la base de datos.`,
    });
  } catch (err: any) {
    console.error("[GENERATE_SKU_ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Error al generar SKU y analizar base de datos: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku");
  const name = searchParams.get("name");
  const type = (searchParams.get("type") || "FIGURE") as ProductType;

  // Forward to POST logic
  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify({ checkSku: sku, name, type }),
    })
  );
}
