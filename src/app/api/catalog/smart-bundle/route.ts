import { NextRequest, NextResponse } from "next/server";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    const body = await req.json();
    const { productId, sku } = body;

    // 1. Fetch live catalog
    const firestoreProducts = await getProductsFromFirestore(false);
    const allProducts = (
      firestoreProducts && firestoreProducts.length > 0 ? firestoreProducts : BASE_PRODUCTS
    ) as any[];

    // 2. Identify current product
    const currentProduct = allProducts.find(
      (p) =>
        (sku && p.sku?.toLowerCase() === String(sku).toLowerCase()) ||
        (productId && (p.id === productId || p.slug === productId))
    );

    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: "Producto actual no encontrado." },
        { status: 404 }
      );
    }

    // 3. Filter other in-stock products
    const otherInStock = allProducts.filter(
      (p) =>
        p.id !== currentProduct.id &&
        p.sku !== currentProduct.sku &&
        (p.stockAvailable ?? 10) > 0
    );

    if (otherInStock.length === 0) {
      return NextResponse.json({
        success: true,
        bundle: null,
      });
    }

    // Build list of candidate products for Gemini
    const candidatesText = otherInStock
      .slice(0, 20)
      .map((p) => {
        const platform = p.gameMetadata?.platform ? ` (${p.gameMetadata.platform})` : "";
        return `- SKU: "${p.sku}" | Nombre: "${p.name}"${platform} | Precio: $${Number(p.price || 0).toLocaleString("es-CL")} CLP | Tipo: ${p.type}`;
      })
      .join("\n");

    const currentPlatform = currentProduct.gameMetadata?.platform ? ` (${currentProduct.gameMetadata.platform})` : "";
    const currentPriceFormatted = Number(currentProduct.price || 0).toLocaleString("es-CL");

    let bundleData: any = null;

    // 4. Try Gemini AI generation if API key is present
    if (geminiApiKey && !geminiApiKey.includes("YOUR_") && geminiApiKey.length >= 15) {
      const prompt = `Eres el especialista en combos y venta cruzada de OmniCollector Chile.
Diseña un "Bundle Inteligente / Pack Combo" atractivo y con alta sinergia para este producto principal:

PRODUCTO PRINCIPAL:
- SKU: "${currentProduct.sku}"
- Nombre: "${currentProduct.name}"${currentPlatform}
- Precio: $${currentPriceFormatted} CLP
- Categoría: ${currentProduct.type}

PRODUCTOS DISPONIBLES EN STOCK PARA COMBINAR (Elige 1 o 2 que tengan la mejor compatibilidad, fanatismo o sinergia):
${candidatesText}

REGLAS:
1. Si el producto es consola: combínalo con un juego compatible o mando/accesorio.
2. Si es videojuego: combínalo con un mando, accesorio de audio o juego de la misma consola/franquicia.
3. Si es figura: combínalo con otra figura compañera, artbook o coleccionable afín.
4. Elige 1 o 2 SKUs que existan exactamente en la lista de arriba.
5. El porcentaje de descuento del bundle debe ser entre 7 y 10% (ejemplo: 8).

Devuelve EXCLUSIVAMENTE un objeto JSON con esta estructura:
{
  "bundleName": "Nombre épico del pack (ej. Pack Definitivo PS5 + Mando)",
  "synergyPitch": "Explicación breve de 1 frase en tono gamer chileno entusiasta de por qué conviene llevarlos juntos.",
  "complementarySkus": ["SKU-1", "SKU-2"],
  "discountPercent": 8
}`;

      const candidateModels = [
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-3-flash-preview",
      ];

      for (const model of candidateModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": geminiApiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 600,
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            bundleData = JSON.parse(cleaned);
            break;
          }
        } catch {
          // try next model
        }
      }
    }

    // 5. Fallback heuristic if AI was unavailable or couldn't parse
    if (!bundleData || !Array.isArray(bundleData.complementarySkus) || bundleData.complementarySkus.length === 0) {
      // Find items matching same platform or type
      let fallbackMatches = otherInStock.filter((p) => {
        if (currentProduct.gameMetadata?.platform && p.gameMetadata?.platform) {
          return p.gameMetadata.platform === currentProduct.gameMetadata.platform;
        }
        return p.type === currentProduct.type || p.type === "GAMING_ACCESSORY";
      });

      if (fallbackMatches.length === 0) {
        fallbackMatches = otherInStock.slice(0, 2);
      }

      const selectedFallback = fallbackMatches.slice(0, 2);

      bundleData = {
        bundleName: `Pack Coleccionista: ${currentProduct.name}`,
        synergyPitch: "¡Combina este producto con los mejores accesorios y juegos compatibles para una experiencia completa!",
        complementarySkus: selectedFallback.map((p) => p.sku),
        discountPercent: 8,
      };
    }

    // 6. Resolve complementary product objects
    const resolvedComplementary: any[] = [];
    for (const skuCode of bundleData.complementarySkus) {
      const found = otherInStock.find(
        (p) => p.sku?.toLowerCase() === String(skuCode).toLowerCase() || p.id === skuCode
      );
      if (found && !resolvedComplementary.some((p) => p.sku === found.sku)) {
        resolvedComplementary.push({
          id: found.id,
          sku: found.sku,
          name: found.name,
          slug: found.slug || found.id,
          price: Number(found.price || 0),
          images: found.images || [],
          type: found.type,
          platform: found.gameMetadata?.platform || null,
          stockAvailable: found.stockAvailable ?? 10,
        });
      }
    }

    // Build the bundle payload
    const mainProductItem = {
      id: currentProduct.id,
      sku: currentProduct.sku,
      name: currentProduct.name,
      slug: currentProduct.slug || currentProduct.id,
      price: Number(currentProduct.price || 0),
      images: currentProduct.images || [],
      type: currentProduct.type,
      platform: currentProduct.gameMetadata?.platform || null,
      stockAvailable: currentProduct.stockAvailable ?? 10,
      isMain: true,
    };

    const bundleItems = [mainProductItem, ...resolvedComplementary];
    const originalTotalPrice = bundleItems.reduce((acc, item) => acc + item.price, 0);
    const discountPercent = bundleData.discountPercent || 8;
    const discountAmountClp = Math.round(originalTotalPrice * (discountPercent / 100));
    const bundleTotalPrice = originalTotalPrice - discountAmountClp;

    return NextResponse.json({
      success: true,
      bundle: {
        name: bundleData.bundleName || `Pack Especial ${currentProduct.name}`,
        pitch: bundleData.synergyPitch || "Llévate este combo con descuento exclusivo en OmniCollector.",
        discountPercent,
        originalTotalPrice,
        discountAmountClp,
        bundleTotalPrice,
        items: bundleItems,
      },
    });
  } catch (error: any) {
    console.error("[Smart Bundle API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al generar bundle inteligente." },
      { status: 500 }
    );
  }
}
