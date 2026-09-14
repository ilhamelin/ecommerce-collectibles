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

    if (!geminiApiKey || geminiApiKey.includes("YOUR_") || geminiApiKey.length < 15) {
      return NextResponse.json(
        {
          success: false,
          error: "API Key de Gemini no configurada en el servidor.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó imagen para analizar." },
        { status: 400 }
      );
    }

    // Clean base64 header if present (e.g. data:image/png;base64,...)
    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // Retrieve active catalog products from Firestore and base catalog
    const firestoreProducts = await getProductsFromFirestore(false);
    const allProducts = (firestoreProducts && firestoreProducts.length > 0 ? firestoreProducts : BASE_PRODUCTS) as any[];

    // Build a clean, structured inventory index to ground Gemini Vision with real store products
    const inventoryListText = allProducts
      .map((p, idx) => {
        const platform = p.gameMetadata?.platform ? ` (${p.gameMetadata.platform})` : "";
        const stockInfo = (p.stockAvailable ?? 10) > 0 ? `[Stock: ${p.stockAvailable ?? 10} un.]` : "[Sin Stock]";
        return `${idx + 1}. SKU: "${p.sku}" | Nombre: "${p.name}"${platform} | Categoría: ${p.type} | ${stockInfo}`;
      })
      .join("\n");

    const prompt = `Eres el sommelier, tasador y clasificador oficial de la tienda OmniCollector Chile.
Analiza detenidamente esta imagen fotográfica o captura de pantalla.

CONOCIMIENTO DIRECTO DE LA BASE DE DATOS Y CATÁLOGO DE OMNICOLLECTOR CHILE:
A continuación tienes la lista completa y actualizada de los productos que OmniCollector tiene en su inventario:
--------------------------------------------------------------------------------
${inventoryListText}
--------------------------------------------------------------------------------

INSTRUCCIONES CLAVE DE RECONOCIMIENTO Y VINCULACIÓN:
1. Analiza la imagen y determina con precisión qué videojuego, figura, consola o artículo es (franquicia, título o personaje exacto).
2. Compara cuidadosamente el artículo de la imagen contra la LISTA DE PRODUCTOS DE OMNICOLLECTOR:
   - Si el artículo de la foto corresponde a uno de los productos de nuestro inventario (por ejemplo, si la foto es la portada de Pragmata para PS5 y en la lista existe 'Pragmata' con SKU 'VG-PRAGMATA-PS5' o 'VG-PRAGMATA', o Persona 3 Reload, Elden Ring, The Last of Us, Metroid Prime, etc.):
     - "inStoreInventory": true
     - "exactMatchSku": "<el SKU exacto que aparece en la lista de inventario>"
     - "matchedProductName": "<el nombre exacto del producto en la lista>"
     - "summary": "¡Excelente noticia! Reconocí el producto y SÍ está disponible en nuestro catálogo de OmniCollector." (con tu estilo chileno, entusiasta y gamer).
   - Si el artículo NO se encuentra en la lista de nuestro catálogo (por ejemplo: God of War Ragnarök, Bloodborne, etc.):
     - "inStoreInventory": false
     - "exactMatchSku": null
     - "matchedProductName": null
     - "summary": "Reconocí este juegazo/artículo, pero actualmente no está en nuestro inventario. ¡Puedes notificar tu deseo de compra para que lo agreguemos pronto a la tienda!"

3. Determina la categoría más probable entre:
   - "FIGURE" | "VIDEO_GAME" | "CONSOLE" | "GAMING_ACCESSORY" | "BOOK" | "APPAREL" | "COLLECTIBLE" | "MERCH" | "AUDIO"
4. Palabras clave de búsqueda optimizadas (searchKeywords).

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura estricta (sin markdown, sin bloques \`\`\`json):
{
  "franchise": "Nombre de la Franquicia o Marca",
  "itemOrCharacter": "Nombre del artículo o personaje",
  "suggestedCategory": "FIGURE | VIDEO_GAME | CONSOLE | GAMING_ACCESSORY | BOOK | APPAREL | COLLECTIBLE | MERCH | AUDIO",
  "searchKeywords": "palabras clave para buscar",
  "confidenceScore": 0.98,
  "inStoreInventory": true,
  "exactMatchSku": "SKU_DEL_INVENTARIO_O_NULL",
  "matchedProductName": "NOMBRE_EN_INVENTARIO_O_NULL",
  "summary": "Resumen amigable para el cliente"
}`;

    // Request to Google Gemini Vision with active, high-availability models
    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-flash-latest",
      "gemini-3-flash-preview",
    ];
    let geminiRes: Response | null = null;
    let lastErrorText = "";

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
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 800,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          lastErrorText = await res.text();
          console.warn(`[Visual Search] Model ${model} returned ${res.status}:`, lastErrorText);
        }
      } catch (err: any) {
        lastErrorText = err.message || String(err);
      }
    }

    if (!geminiRes) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al analizar imagen con Gemini Vision: ${lastErrorText || "Servicio no disponible"}`,
        },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawAiText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawAiText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let analysis: any = {};
    try {
      analysis = JSON.parse(cleanedJson);
    } catch {
      const match = cleanedJson.match(/\{[\s\S]*\}/);
      if (match) {
        analysis = JSON.parse(match[0]);
      } else {
        analysis = {
          franchise: "Coleccionable",
          itemOrCharacter: "Artículo detectado",
          suggestedCategory: "FIGURE",
          searchKeywords: "figura coleccionable",
          confidenceScore: 0.9,
          inStoreInventory: false,
          exactMatchSku: null,
          matchedProductName: null,
          summary: "Hemos analizado tu imagen para buscar coincidencias en la tienda.",
        };
      }
    }

    // Resolve exact matching product from store inventory
    let exactProduct = null;
    if (analysis.exactMatchSku) {
      exactProduct = allProducts.find(
        (p) =>
          p.sku.toLowerCase() === String(analysis.exactMatchSku).toLowerCase() ||
          p.id === analysis.exactMatchSku
      );
    }

    // Fallback detection: match by exact or substring title
    if (!exactProduct && analysis.itemOrCharacter) {
      const searchItem = String(analysis.itemOrCharacter).toLowerCase().trim();
      const franchise = String(analysis.franchise || "").toLowerCase().trim();

      exactProduct = allProducts.find((p) => {
        const pName = (p.name || "").toLowerCase().trim();
        const pSku = (p.sku || "").toLowerCase().trim();
        return (
          pName === searchItem ||
          (searchItem.length >= 4 && pName.includes(searchItem)) ||
          (pName.length >= 4 && searchItem.includes(pName)) ||
          (franchise.length >= 4 && pName.includes(franchise)) ||
          (searchItem.length >= 4 && pSku.includes(searchItem.replace(/\s+/g, "-")))
        );
      });
    }

    // When an exact product match exists in inventory, strictly enforce inStoreInventory
    if (exactProduct) {
      analysis.inStoreInventory = true;
      analysis.exactMatchSku = exactProduct.sku;
      analysis.matchedProductName = exactProduct.name;
    }

    // Calculate relevance score for catalog products
    const searchTerms = (analysis.searchKeywords || `${analysis.franchise} ${analysis.itemOrCharacter}`)
      .toLowerCase()
      .split(/\s+/)
      .filter((t: string) => t.length > 2);

    const scoredProducts = (allProducts || []).map((prod) => {
      if (exactProduct && prod.sku === exactProduct.sku) {
        return { product: prod, score: 999 };
      }

      const pText = [
        prod.name,
        prod.sku,
        prod.description,
        ...(prod.genres || []),
        prod.type,
        prod.customCategoryLabel || "",
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const term of searchTerms) {
        if (pText.includes(term)) score += 3;
      }
      if (analysis.franchise && pText.includes(analysis.franchise.toLowerCase())) {
        score += 5;
      }
      if (analysis.itemOrCharacter && pText.includes(analysis.itemOrCharacter.toLowerCase())) {
        score += 5;
      }
      if (analysis.suggestedCategory && prod.type === analysis.suggestedCategory) {
        score += 2;
      }

      return { product: prod, score };
    });

    // Sort by relevance score, putting the exact match first
    const matchedProducts = scoredProducts
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.product);

    const inStoreInventory = Boolean(exactProduct || analysis.inStoreInventory);

    return NextResponse.json({
      success: true,
      data: {
        analysis: {
          ...analysis,
          inStoreInventory,
          exactMatchSku: exactProduct?.sku || analysis.exactMatchSku || null,
          matchedProductName: exactProduct?.name || analysis.matchedProductName || null,
        },
        inStoreInventory,
        exactProduct: exactProduct || null,
        matchedProducts,
        totalMatches: matchedProducts.length,
      },
    });
  } catch (error: any) {
    console.error("[Visual Search API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno al procesar búsqueda visual" },
      { status: 500 }
    );
  }
}
