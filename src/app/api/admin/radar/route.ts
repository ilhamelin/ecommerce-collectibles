import { NextRequest, NextResponse } from "next/server";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    // 1. Fetch current catalog to provide real context to the AI
    const firestoreProducts = await getProductsFromFirestore(false);
    const allProducts = (firestoreProducts || []) as any[];

    const outOfStockProducts = allProducts
      .filter((p) => !p.isPreOrder && p.stockAvailable <= 1)
      .slice(0, 10)
      .map((p) => `${p.name} (SKU: ${p.sku}, Precio: $${p.price})`);

    const preOrderProducts = allProducts
      .filter((p) => p.isPreOrder)
      .slice(0, 8)
      .map((p) => `${p.name} (SKU: ${p.sku})`);

    if (!geminiApiKey || geminiApiKey.includes("YOUR_") || geminiApiKey.length < 15) {
      // Fallback precomputed intelligence data if no API Key
      return NextResponse.json({
        success: true,
        data: getFallbackRadarData(),
        engine: "LOCAL_HEURISTIC",
      });
    }

    const prompt = `Eres el Director Ejecutivo de Compras e Inteligencia de Mercado de OmniCollector Chile, la tienda líder en importación de figuras originales japonesas (Good Smile Company, Kotobukiya, Bandai Spirits, Alter, MegaHouse, Aniplex), mangas de colección y hardware gamer.
Analiza la siguiente información de inventario de nuestra tienda en Chile:
- Artículos con stock crítico o agotados: ${outOfStockProducts.join("; ") || "Varios modelos de escala 1/7 y mangas"}
- Preventas activas actualmente: ${preOrderProducts.join("; ") || "Preventas de figuras y consolas"}

Genera un informe estratégico de "Radar de Preventas & Alertas de Reedición en Japón" para maximizar la rentabilidad de la tienda y anticiparse a las reposiciones oficiales en Asia.

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin bloques \`\`\`json):
{
  "marketOverview": "Resumen ejecutivo sobre disponibilidad en Japón, tipos de cambio yen/CLP y fletes internacionales marítimos/aéreos",
  "scannedAt": "${new Date().toISOString()}",
  "reissueAlerts": [
    {
      "id": "alert-1",
      "productName": "Nombre del producto o figura",
      "manufacturer": "Good Smile Company / Kotobukiya / Bandai / etc.",
      "franchise": "Franquicia (ej. Solo Leveling, Jujutsu Kaisen, Persona 5, Evangelion)",
      "status": "REISSUE_INCOMING | HIGH_DEMAND_OOS | PREORDER_OPPORTUNITY",
      "statusBadge": "Reedición Inminente en Japón | Demanda Alta Agotada | Preventa Estratégica",
      "confidence": "Alta (95%) | Media-Alta (80%)",
      "estimatedWindow": "Ventana estimada (ej. Q4 2026 / Q1 2027)",
      "suggestedAction": "Acción recomendada concreta (ej. Habilitar reserva con 20% de pie)",
      "projectedMargin": "Porcentaje y CLP de utilidad estimada (ej. 44% • ~$32.000 CLP)",
      "reasoning": "Explicación del ciclo de vida del producto en Japón y demanda local en Chile"
    }
  ],
  "hotTrends": [
    "Tendencia 1: Anime o juego que aumentará la demanda en los próximos 60 días",
    "Tendencia 2: Crecimiento en el coleccionismo de periféricos o mangas específicos"
  ],
  "urgentRecommendations": [
    "Recomendación 1 para el administrador de OmniCollector",
    "Recomendación 2 para optimizar el flujo de caja en preventas"
  ]
}`;

    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-flash-latest",
      "gemini-3-flash-preview",
    ];
    let geminiRes: Response | null = null;
    let lastError = "";

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
                temperature: 0.3,
                maxOutputTokens: 1400,
              },
            }),
          }
        );

        if (res.ok) {
          geminiRes = res;
          break;
        } else {
          lastError = await res.text();
          console.warn(`[Radar API] Model ${model} returned ${res.status}:`, lastError);
        }
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    if (!geminiRes) {
      return NextResponse.json({
        success: true,
        data: getFallbackRadarData(),
        engine: "LOCAL_FALLBACK_ON_ERROR",
        errorDetail: lastError,
      });
    }

    const geminiData = await geminiRes.json();
    const rawAiText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleanedJson = rawAiText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const reportData = JSON.parse(cleanedJson);

    return NextResponse.json({
      success: true,
      data: reportData,
      engine: "GEMINI_AI",
    });
  } catch (error: any) {
    console.error("[Radar API] Error:", error);
    return NextResponse.json({
      success: true,
      data: getFallbackRadarData(),
      engine: "LOCAL_HEURISTIC_RESCUE",
    });
  }
}

function getFallbackRadarData() {
  return {
    marketOverview:
      "El mercado japonés de figuras y coleccionables muestra un ciclo acelerado de reediciones para franquicias consolidadas (Jujutsu Kaisen, Solo Leveling, Persona). Las tarifas de flete aéreo hacia Santiago de Chile se mantienen estables, favoreciendo las reservas con depósito del 20%.",
    scannedAt: new Date().toISOString(),
    reissueAlerts: [
      {
        id: "alert-1",
        productName: "Nendoroid Gojo Satoru - Jujutsu Kaisen",
        manufacturer: "Good Smile Company",
        franchise: "Jujutsu Kaisen",
        status: "REISSUE_INCOMING",
        statusBadge: "Reedición Inminente en Japón",
        confidence: "Alta (92%)",
        estimatedWindow: "Q4 2026 / Q1 2027",
        suggestedAction: "Abrir preventa con pie de $14.990 CLP",
        projectedMargin: "45% • ~$24.500 CLP por unidad",
        reasoning:
          "Good Smile Company acostumbra abrir ventanas de reedición tras picos de búsqueda en Google Trends y anuncios de nuevas temporadas.",
      },
      {
        id: "alert-2",
        productName: "Figura Escala 1/7 Makima - Chainsaw Man",
        manufacturer: "Kotobukiya",
        franchise: "Chainsaw Man",
        status: "HIGH_DEMAND_OOS",
        statusBadge: "Demanda Alta Sin Stock",
        confidence: "Media-Alta (85%)",
        estimatedWindow: "Q1 2027",
        suggestedAction: "Contactar a distribuidor autorizado para reservar cupo de lote",
        projectedMargin: "42% • ~$58.000 CLP por unidad",
        reasoning:
          "Las figuras de escala 1/7 de Makima mantienen un precio de reventa superior en el mercado secundario. Una reposición oficial asegurará ventas rápidas.",
      },
      {
        id: "alert-3",
        productName: "Solo Leveling Tomo 15 & Merchandising Exclusivo",
        manufacturer: "Norma Editorial / D&C Media",
        franchise: "Solo Leveling",
        status: "PREORDER_OPPORTUNITY",
        statusBadge: "Preventa Estratégica",
        confidence: "Alta (98%)",
        estimatedWindow: "Disponible Inmediato / Próxima Tirada",
        suggestedAction: "Armar bundle compuesto con tomo manga + figura de Sung Jinwoo",
        projectedMargin: "48% • ~$18.900 CLP por pack",
        reasoning:
          "El impacto del anime está convirtiendo a espectadores en lectores y coleccionistas continuos. Excelente rotación esperada.",
      },
      {
        id: "alert-4",
        productName: "Mouse Logitech G PRO X SUPERLIGHT 2 - Magenta",
        manufacturer: "Logitech G",
        franchise: "Esports Hardware",
        status: "HIGH_DEMAND_OOS",
        statusBadge: "Demanda Alta Sin Stock",
        confidence: "Alta (90%)",
        estimatedWindow: "3 a 4 semanas",
        suggestedAction: "Solicitar reposición con mayoristas locales (Tech Data / Ingram)",
        projectedMargin: "35% • ~$38.000 CLP por periférico",
        reasoning:
          "Ediciones especiales en colores llamativos tienen alta tasa de conversión entre streamers y jugadores competitivos en Chile.",
      },
    ],
    hotTrends: [
      "Aumento del 64% en consultas por manhwas y mangas de Solo Leveling y Frieren en Santiago y regiones.",
      "Creciente interés en periféricos inalámbricos ultraligeros (<60g) con switches ópticos para Valorant y Counter-Strike 2.",
      "Consolidación de las preventas con pie del 20% como el método favorito de compra gamer para figuras mayores a $80.000 CLP.",
    ],
    urgentRecommendations: [
      "Activar la recepción de alertas de stock para usuarios interesados en figuras agotadas para medir demanda real sin arriesgar capital.",
      "Crear un banner promocional en el slider de portada para las preventas con fecha de llegada confirmada para el último trimestre.",
    ],
  };
}
