import { NextRequest, NextResponse } from "next/server";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

async function logChatInquiry(userQuery: string, recommendedSkus: string[], reply: string) {
  try {
    const entry = {
      userQuery: (userQuery || "").slice(0, 300),
      recommendedSkus: recommendedSkus || [],
      replySnippet: (reply || "").slice(0, 200),
      createdAt: new Date().toISOString(),
    };
    if (adminDb) {
      await adminDb.collection("chat_inquiries").add(entry);
      return;
    }
    if (db && isFirebaseConfigured()) {
      await addDoc(collection(db, "chat_inquiries"), entry);
    }
  } catch (err) {
    console.warn("[Sommelier] Non-blocking chat inquiry log warning:", err);
  }
}

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
    const { messages = [], currentContext = {} } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se proporcionaron mensajes en la conversación." },
        { status: 400 }
      );
    }

    // Retrieve active catalog products from Firestore and base catalog
    const firestoreProducts = await getProductsFromFirestore(false);
    const allProducts = (
      firestoreProducts && firestoreProducts.length > 0 ? firestoreProducts : BASE_PRODUCTS
    ) as any[];

    // Build structured inventory index with SKU, name, price CLP, category, platform, and stock
    const inventoryListText = allProducts
      .map((p, idx) => {
        const platform = p.gameMetadata?.platform ? ` (${p.gameMetadata.platform})` : "";
        const price = (p.price ?? 0).toLocaleString("es-CL");
        const stockInfo = (p.stockAvailable ?? 10) > 0 ? `[Stock: ${p.stockAvailable ?? 10} un.]` : "[Sin Stock / Agotado]";
        return `${idx + 1}. SKU: "${p.sku}" | "${p.name}"${platform} | Precio: $${price} CLP | Tipo: ${p.type} | ${stockInfo}`;
      })
      .join("\n");

    // Context format
    const contextDescription = currentContext.currentPath
      ? `Ruta actual del usuario en la web: ${currentContext.currentPath}`
      : "Ruta: Tienda general";

    // System prompt defining the Sommelier Coleccionista persona
    const systemInstruction = `Eres el "Sommelier Coleccionista", el asesor virtual de alta gama y experto en cultura gamer, figuras y coleccionismo de la tienda OmniCollector Chile (www.omnicollector.cl).

TU PERSONALIDAD Y TONO:
- Eres entusiasta, culto en anime/videojuegos, respetuoso, empático y con tono chileno natural, amigable y acogedor (puedes usar palabras cordiales como "¡Hola coleccionista!", "juegazo", "joya de colección", "piezón").
- Siempre piensas en el presupuesto del cliente en Pesos Chilenos (CLP).
- Si el cliente busca un regalo, pregúntale discretamente por sus gustos (PlayStation, Nintendo, anime específico, figuras de escala) o preséntale opciones balanceadas.

CONOCIMIENTO OFICIAL DE OMNICOLLECTOR CHILE:
1. Despacho y Logística: Envíos rápidos y asegurados a todo Chile vía Starken y Chilexpress con embalaje reforzado especial para coleccionistas.
2. Formas de Pago: Hasta 12 cuotas sin interés mediante Webpay / Mercado Pago, y transferencia bancaria.
3. Preventas Japonesas: Se reservan con solo un 20% de pie inicial. El saldo restante (80%) se cancela cuando el producto llega a bodega en Santiago antes del despacho.
4. Autenticidad: Todos los productos son 100% nuevos, sellados y originales de fabricantes oficiales (Good Smile Company, Bandai, Kotobukiya, Capcom, Atlus, Sony, Nintendo). Cero réplicas piratas (anti-bootleg garantizado).
5. Soporte Humano Oficial: WhatsApp directo (+56 9 5824 3917).

INVENTARIO EN VIVO DE PRODUCTOS DISPONIBLES:
--------------------------------------------------------------------------------
${inventoryListText}
--------------------------------------------------------------------------------
${contextDescription}

REGLAS DE RECOMENDACIÓN:
- Recomienda ÚNICAMENTE productos que existan en el INVENTARIO EN VIVO listado arriba. Menciona siempre el SKU exacto en tu lista de recomendados.
- Si el usuario te pide un juego o producto que NO está en el inventario (ej. un juego antiguo o que aún no tienes), indícaselo con amabilidad y sugiere una alternativa cercana que sí tengas o sugiérele utilizar la opción "Encuentra este Coleccionable" o contactar por WhatsApp.
- Si el usuario tiene dudas complejas de importación o quiere coordinar un pedido especial, ofrécele continuar por WhatsApp.

FORMATO DE RESPUESTA REQUERIDO:
Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura (sin texto adicional fuera del JSON, sin bloques de código con markdown):
{
  "reply": "Tu respuesta conversacional en texto enriquecido. Puedes usar negritas y saltos de línea normales.",
  "recommendedSkus": ["SKU-1", "SKU-2"],
  "whatsappFollowupText": "Texto sugerido para enviar a WhatsApp si el usuario desea atención humana"
}`;

    // Format conversation history for Gemini API
    const formattedHistory = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Cascade of modern, active models
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
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              contents: formattedHistory,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 900,
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
          console.warn(`[Sommelier Chat] Model ${model} returned ${res.status}:`, lastErrorText);
        }
      } catch (err: any) {
        lastErrorText = err.message || String(err);
      }
    }

    if (!geminiRes) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al consultar con el Sommelier IA: ${lastErrorText || "Servicio no disponible"}`,
        },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawAiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawAiText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      const match = cleanedJson.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = {
          reply: rawAiText || "¡Hola coleccionista! ¿En qué joya gamer o figura de colección te puedo orientar hoy?",
          recommendedSkus: [],
          whatsappFollowupText: "Hola OmniCollector, estuve conversando con el Sommelier IA y tengo una duda sobre un producto.",
        };
      }
    }

    // Resolve recommended SKUs to complete product cards
    const recommendedProducts: any[] = [];
    if (Array.isArray(parsed.recommendedSkus) && parsed.recommendedSkus.length > 0) {
      for (const sku of parsed.recommendedSkus) {
        const found = allProducts.find(
          (p) =>
            p.sku?.toLowerCase() === String(sku).toLowerCase() ||
            p.id === sku
        );
        if (found && !recommendedProducts.some((p) => p.sku === found.sku)) {
          recommendedProducts.push({
            id: found.id,
            sku: found.sku,
            name: found.name,
            slug: found.slug || found.id,
            price: found.price,
            images: found.images || [],
            type: found.type,
            stockAvailable: found.stockAvailable ?? 10,
            platform: found.gameMetadata?.platform || null,
          });
        }
      }
    }

    // Persist chat inquiry to Cloud Firestore so store admin captures user demand & interest
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    logChatInquiry(lastUserMsg, parsed.recommendedSkus || [], parsed.reply || "");

    return NextResponse.json({
      success: true,
      reply: parsed.reply || "¡Hola coleccionista! ¿En qué producto o regalo te puedo orientar hoy?",
      recommendedProducts,
      whatsappFollowupText:
        parsed.whatsappFollowupText ||
        "Hola OmniCollector, me gustaría recibir más información sobre sus productos.",
    });
  } catch (error: any) {
    console.error("[Sommelier API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno al procesar la conversación del Sommelier.",
      },
      { status: 500 }
    );
  }
}
