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

    const prompt = `Eres el sommelier y tasador experto en coleccionismo, figuras originales, anime, mangas, hardware gamer y videojuegos de la tienda OmniCollector Chile.
Analiza detenidamente esta imagen fotográfica o captura de pantalla.
Identifica con exactitud:
1. La franquicia, anime, videojuego o marca (ej: Solo Leveling, Persona 5, Evangelion, Dragon Ball, Razer, Logitech, Nintendo, PlayStation, etc.).
2. El personaje, artículo o modelo específico (ej: Sung Jinwoo, Makima, Nendoroid Gojo, Mouse Superlight, DualSense Edge, Tomo Manga, etc.).
3. La categoría de producto más probable entre:
   - "FIGURE" (Figuras de escala, Nendoroids, estatuas)
   - "VIDEO_GAME" (Videojuegos, cartuchos, discos)
   - "CONSOLE" (Consolas y hardware de juego)
   - "GAMING_ACCESSORY" (Periféricos, mouse, teclados, audífonos, mandos)
   - "BOOK" (Mangas, artbooks, novelas ligeras)
   - "APPAREL" (Ropa, polerones, poleras, gorros)
   - "COLLECTIBLE" (Cartas TCG, PSA, rarezas)
   - "MERCH" (Peluches, llaveros, acrílicos, decoración)
   - "AUDIO" (OSTs, vinilos, bandas sonoras)
4. Palabras clave de búsqueda optimizadas (keywords en español e inglés, sin signos de puntuación) para encontrar este producto o similares en el inventario.
5. Un resumen breve y entusiasta en español chileno (máximo 2 líneas) explicando qué reconociste en la imagen.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura estricta (sin markdown, sin bloques de código tipo \`\`\`json):
{
  "franchise": "Nombre de la Franquicia o Marca",
  "itemOrCharacter": "Nombre del personaje o modelo",
  "suggestedCategory": "FIGURE | VIDEO_GAME | CONSOLE | GAMING_ACCESSORY | BOOK | APPAREL | COLLECTIBLE | MERCH | AUDIO",
  "searchKeywords": "palabras clave para buscar en tienda",
  "confidenceScore": 0.95,
  "summary": "Resumen de lo identificado para mostrar al cliente"
}`;

    // Request to Google Gemini Vision via gemini-flash-latest with header auth
    const candidateModels = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-1.5-flash"];
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
                temperature: 0.2,
                maxOutputTokens: 800,
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
      // Fallback regex extraction if raw json was slightly malformed
      const match = cleanedJson.match(/\{[\s\S]*\}/);
      if (match) {
        analysis = JSON.parse(match[0]);
      } else {
        analysis = {
          franchise: "Coleccionable",
          itemOrCharacter: "Artículo detectado",
          suggestedCategory: "FIGURE",
          searchKeywords: "figura coleccionable",
          summary: "Hemos analizado tu imagen para encontrar los coleccionables más cercanos.",
        };
      }
    }

    // Retrieve active catalog products to find matches
    const firestoreProducts = await getProductsFromFirestore(false);
    const allProducts = (firestoreProducts && firestoreProducts.length > 0 ? firestoreProducts : BASE_PRODUCTS) as any[];

    // Match products based on AI keywords and category
    const searchTerms = (analysis.searchKeywords || `${analysis.franchise} ${analysis.itemOrCharacter}`)
      .toLowerCase()
      .split(/\s+/)
      .filter((t: string) => t.length > 2);

    const scoredProducts = (allProducts || []).map((prod) => {
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

    // Sort by relevance score
    const matchedProducts = scoredProducts
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.product);

    return NextResponse.json({
      success: true,
      data: {
        analysis,
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
