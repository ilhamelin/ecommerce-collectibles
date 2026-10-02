import { z } from "zod";
import { visualSearchAnalysisSchema, type VisualSearchEvent, type VisualSearchResult } from "@/lib/services/visualSearch";
import { NextRequest, NextResponse } from "next/server";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { recordApiUsage } from "@/lib/services/apiTelemetryService";
import { getGeminiApiKey, getSupportedGeminiModels } from "@/lib/services/geminiClient";

export const dynamic = "force-dynamic";

class VisualSearchError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

const inputSchema = z.object({
  imageBase64: z.string().min(1).max(12 * 1024 * 1024),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
});

/** Runs one image identification and emits only observed server milestones. */
async function searchVisual(input: z.infer<typeof inputSchema>, geminiApiKey: string, emit: (event: VisualSearchEvent) => void, signal: AbortSignal): Promise<VisualSearchResult> {
  signal.throwIfAborted();
  const { imageBase64, mimeType } = input;
  const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const header = imageBase64.includes(",") ? imageBase64.split(",")[0] : null;
  if (!cleanBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64) || cleanBase64.length % 4 !== 0 || (header && header !== `data:${mimeType};base64`)) {
    throw new VisualSearchError("La imagen no tiene un formato válido. Usa JPG, PNG o WEBP.", 400);
  }
  if (Buffer.from(cleanBase64, "base64").length > 8 * 1024 * 1024) {
    throw new VisualSearchError("La imagen no debe superar los 8 MB.", 400);
  }
  emit({ kind: "progress", stage: "received", message: `Imagen recibida y validada (${mimeType}).` });
  const firestoreProducts = await getProductsFromFirestore(false);
  signal.throwIfAborted();
  if (!firestoreProducts) throw new VisualSearchError("No se pudo consultar el catálogo. Reintenta en unos momentos.", 503);
  const allProducts = firestoreProducts;
  emit({ kind: "progress", stage: "catalog", message: `Catálogo consultado: ${allProducts.length} productos para comparar.` });

  // Build a clean, structured inventory index to ground Gemini Vision with real store products
  const inventoryListText = allProducts
    .map((p, idx) => {
      const platform = p.gameMetadata?.platform ? ` (${p.gameMetadata.platform})` : "";
      const stockInfo = (p.stockAvailable ?? 0) > 0 ? `[Stock: ${p.stockAvailable ?? 0} un.]` : "[Sin Stock]";
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
 - "FIGURE" | "VIDEO_GAME" | "CONSOLE" | "HARDWARE" | "GAMING_ACCESSORY" | "BOOK" | "APPAREL" | "COLLECTIBLE" | "MERCH" | "AUDIO"
4. Palabras clave de búsqueda optimizadas (searchKeywords).

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura estricta (sin markdown, sin bloques \`\`\`json):
{
"franchise": "Nombre de la Franquicia o Marca",
"itemOrCharacter": "Nombre del artículo o personaje",
"suggestedCategory": "FIGURE | VIDEO_GAME | CONSOLE | HARDWARE | GAMING_ACCESSORY | BOOK | APPAREL | COLLECTIBLE | MERCH | AUDIO",
"searchKeywords": "palabras clave para buscar",
"confidenceScore": 0.98,
"inStoreInventory": true,
"exactMatchSku": "SKU_DEL_INVENTARIO_O_NULL",
"matchedProductName": "NOMBRE_EN_INVENTARIO_O_NULL",
"summary": "Resumen amigable para el cliente"
}`;

  // Dynamically retrieve models authorized for generateContent on this API key
  const candidateModels = await getSupportedGeminiModels(geminiApiKey);

  const callStartTime = Date.now();
  let geminiRes: Response | null = null;
  let lastErrorText = "";
  let usedModel = candidateModels[0] || "gemini-2.5-flash";

  for (const model of candidateModels) {
    try {
      signal.throwIfAborted();
      usedModel = model;
      emit({ kind: "progress", stage: "model", message: `Consultando ${model}: identificación visual con Gemini.` });
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          signal,
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
        console.warn(`[Visual Search] Model ${model} returned ${res.status}`);
        emit({ kind: "progress", stage: "model", message: `El modelo ${model} respondió HTTP ${res.status}; comprobando alternativas.` });
      }
    } catch (err: unknown) {
      signal.throwIfAborted();
      lastErrorText = err instanceof Error ? err.message : String(err);
    }
  }

  const latencyMs = Date.now() - callStartTime;

  if (!geminiRes) {
    await recordApiUsage({
      provider: "GEMINI",
      feature: "VISUAL_SEARCH",
      endpoint: "/api/catalog/visual-search",
      model: usedModel,
      latencyMs,
      statusCode: 502,
      success: false,
      errorMessage: lastErrorText,
    }).catch(() => {});

    throw new VisualSearchError("Gemini no pudo analizar la imagen. Reintenta en unos momentos.");
  }

  const geminiData = z.object({
    candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }).optional() })).optional(),
    usageMetadata: z.object({ promptTokenCount: z.number().optional(), candidatesTokenCount: z.number().optional(), totalTokenCount: z.number().optional() }).optional(),
  }).parse(await geminiRes.json());
  const promptTokens = geminiData?.usageMetadata?.promptTokenCount;
  const candidatesTokens = geminiData?.usageMetadata?.candidatesTokenCount;
  const totalTokens = geminiData?.usageMetadata?.totalTokenCount;

  const rawAiText =
    geminiData.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";

  const cleanedJson = rawAiText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsedAnalysis: z.infer<typeof visualSearchAnalysisSchema> | null = null;
  try {
    const match = cleanedJson.match(/\{[\s\S]*\}/);
    parsedAnalysis = visualSearchAnalysisSchema.parse(JSON.parse(match?.[0] || cleanedJson));
  } catch {
    console.warn("[Visual Search] Model returned an invalid identification.");
  }
  await recordApiUsage({
    provider: "GEMINI",
    feature: "VISUAL_SEARCH",
    endpoint: "/api/catalog/visual-search",
    model: usedModel,
    promptTokens,
    candidatesTokens,
    totalTokens,
    latencyMs,
    statusCode: parsedAnalysis ? 200 : 502,
    success: Boolean(parsedAnalysis),
  }).catch(() => {});
  if (!parsedAnalysis) throw new VisualSearchError("La IA no devolvió una identificación válida. Prueba con una foto más clara.");

  const analysis = parsedAnalysis;

  signal.throwIfAborted();
  emit({ kind: "progress", stage: "analysis", message: `Respuesta validada: ${analysis.itemOrCharacter} · ${analysis.franchise || "sin franquicia identificada"}.` });
  emit({ kind: "progress", stage: "matching", message: "Comparando nombre, SKU y palabras clave con el catálogo." });

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

    exactProduct = allProducts.find((p) => {
      const pName = (p.name || "").toLowerCase().trim();
      const pSku = (p.sku || "").toLowerCase().trim();
      return (
        pName === searchItem ||
        (searchItem.length >= 4 && pName.includes(searchItem)) ||
        (pName.length >= 4 && searchItem.includes(pName)) ||
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

  const inStoreInventory = Boolean(exactProduct);

  emit({ kind: "progress", stage: "complete", message: `${matchedProducts.length} productos relacionados encontrados. ${inStoreInventory ? "Coincidencia confirmada en catálogo." : "Sin coincidencia exacta en catálogo."}` });
  return {
      analysis: {
        ...analysis,
        inStoreInventory,
        exactMatchSku: exactProduct?.sku || null,
        matchedProductName: exactProduct?.name || null,
      },
      inStoreInventory,
      exactProduct: exactProduct || null,
      matchedProducts,
      totalMatches: matchedProducts.length,
  };
}

/** Keeps JSON compatibility; the photo console opts into newline-delimited progress events. */
export async function POST(req: NextRequest) {
  try {
    const input = inputSchema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ success: false, error: "Selecciona una imagen JPG, PNG o WEBP de hasta 8 MB." }, { status: 400 });
    const geminiApiKey = getGeminiApiKey();
    if (!geminiApiKey || geminiApiKey.includes("YOUR_") || geminiApiKey.length < 15) {
      return NextResponse.json({ success: false, error: "El servicio de búsqueda por foto no está configurado en el servidor." }, { status: 503 });
    }
    if (!req.headers.get("accept")?.includes("application/x-ndjson")) {
      const data = await searchVisual(input.data, geminiApiKey, () => {}, req.signal);
      return NextResponse.json({ success: true, data });
    }
    const abort = new AbortController();
    const onAbort = () => abort.abort();
    req.signal.addEventListener("abort", onAbort, { once: true });
    if (req.signal.aborted) abort.abort();
    let closed = false;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const emit = (event: VisualSearchEvent) => {
          if (!closed && !abort.signal.aborted) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        };
        void (async () => {
          try {
            const data = await searchVisual(input.data, geminiApiKey, emit, abort.signal);
            emit({ kind: "result", data });
          } catch (error: unknown) {
            if (!abort.signal.aborted) {
              console.error("[Visual Search API] Identification failed:", error instanceof VisualSearchError ? error.message : "Unexpected processing error");
              emit({ kind: "error", message: error instanceof VisualSearchError ? error.message : "No se pudo completar la búsqueda por foto. Puedes reintentar." });
            }
          } finally {
            req.signal.removeEventListener("abort", onAbort);
            if (!closed) { closed = true; controller.close(); }
          }
        })();
      },
      cancel() { closed = true; abort.abort(); req.signal.removeEventListener("abort", onAbort); },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, error: "La solicitud no contiene un JSON válido." }, { status: 400 });
    console.error("[Visual Search API] Request failed:", error instanceof VisualSearchError ? error.message : "Unexpected processing error");
    return NextResponse.json({ success: false, error: error instanceof VisualSearchError ? error.message : "No se pudo completar la búsqueda por foto." }, { status: error instanceof VisualSearchError ? error.status : 500 });
  }
}
