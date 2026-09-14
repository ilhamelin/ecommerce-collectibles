import { NextRequest, NextResponse } from "next/server";
import { BASE_PRODUCTS } from "@/lib/constants/catalog";
import { getProductsFromFirestore, getAllOrdersFromFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { alertService } from "@/lib/services/alertService";
import { productRequestService } from "@/lib/services/productRequestService";
import { ConfirmedOrderEntity, ProductDomainEntity } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export interface SkuPredictiveMetric {
  sku: string;
  id: string;
  name: string;
  slug: string;
  images: string[];
  type: string;
  platform?: string | null;
  price: number;
  stockAvailable: number;
  totalValueClp: number;
  unitsSold30d: number;
  unitsSold90d: number;
  burnRateDaily: number;
  daysOfInventoryRemaining: number;
  alertSubscribers: number;
  requestsCount: number;
  demandPressureRatio: number;
  statusCategory: "CRITICAL_OUT_OF_STOCK" | "HIGH_RISK" | "DEMAND_SURGE" | "STAGNANT_OVERSTOCK" | "HEALTHY";
  suggestedReorderUnits: number;
  estimatedReorderCostClp: number;
}

// Compute the metrics for all catalog products
async function computeInventoryMetrics() {
  // 1. Fetch products
  const firestoreProducts = await getProductsFromFirestore(false);
  const allProducts = (
    firestoreProducts && firestoreProducts.length > 0 ? firestoreProducts : BASE_PRODUCTS
  ) as ProductDomainEntity[];

  // 2. Fetch orders
  let orders: ConfirmedOrderEntity[] = await getAllOrdersFromFirestore();
  if (orders.length === 0) {
    const memoryStore = MemoryTransactionalStore.getInstance();
    orders = Array.from(memoryStore.orders.values());
  }

  // 3. Fetch alerts and visual search requests
  const [allAlerts, allRequests] = await Promise.all([
    alertService.getAllAlerts().catch(() => []),
    productRequestService.getAllRequests().catch(() => []),
  ]);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // Calculate sales per SKU
  const sales30dMap = new Map<string, number>();
  const sales90dMap = new Map<string, number>();

  for (const order of orders) {
    const orderTime = new Date(order.createdAt || 0).getTime();
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const skuKey = (item.sku || "").toLowerCase();
        const qty = item.quantity || 1;
        if (orderTime >= thirtyDaysAgo) {
          sales30dMap.set(skuKey, (sales30dMap.get(skuKey) || 0) + qty);
        }
        if (orderTime >= ninetyDaysAgo) {
          sales90dMap.set(skuKey, (sales90dMap.get(skuKey) || 0) + qty);
        }
      }
    }
  }

  // Calculate alerts per SKU
  const alertsMap = new Map<string, number>();
  for (const alert of allAlerts) {
    const skuKey = (alert.productSku || "").toLowerCase();
    alertsMap.set(skuKey, (alertsMap.get(skuKey) || 0) + 1);
  }

  // Calculate requests per SKU or title
  const requestsMap = new Map<string, number>();
  for (const req of allRequests) {
    const titleKey = (req.title || req.franchise || "").toLowerCase().trim();
    if (titleKey) {
      requestsMap.set(titleKey, (requestsMap.get(titleKey) || 0) + 1);
    }
  }

  // Compute metrics for each product
  const metrics: SkuPredictiveMetric[] = allProducts.map((prod) => {
    const skuLower = (prod.sku || "").toLowerCase();
    const nameLower = (prod.name || "").toLowerCase();

    const stock = Number(prod.stockAvailable ?? 0);
    const price = Number(prod.price ?? 0);
    const totalValueClp = stock * price;

    const unitsSold30d = sales30dMap.get(skuLower) || 0;
    const unitsSold90d = sales90dMap.get(skuLower) || 0;

    // Daily burn rate: prioritize 30-day velocity, fallback to 90-day
    const burnRateDaily =
      unitsSold30d > 0
        ? Number((unitsSold30d / 30).toFixed(2))
        : unitsSold90d > 0
        ? Number((unitsSold90d / 90).toFixed(2))
        : 0;

    // Days of inventory remaining
    let daysOfInventoryRemaining = 999;
    if (stock <= 0) {
      daysOfInventoryRemaining = 0;
    } else if (burnRateDaily > 0) {
      daysOfInventoryRemaining = Math.round(stock / burnRateDaily);
    }

    const alertSubscribers = alertsMap.get(skuLower) || 0;

    // Matching requests
    let requestsCount = 0;
    for (const [key, count] of requestsMap.entries()) {
      if (key.length >= 4 && (nameLower.includes(key) || key.includes(nameLower))) {
        requestsCount += count;
      }
    }

    const demandPressureRatio = Number(
      (alertSubscribers / Math.max(stock, 1)).toFixed(2)
    );

    // Determine status category
    let statusCategory: SkuPredictiveMetric["statusCategory"] = "HEALTHY";
    let suggestedReorderUnits = 0;

    if (stock <= 0) {
      statusCategory = "CRITICAL_OUT_OF_STOCK";
      suggestedReorderUnits = Math.max(alertSubscribers + (unitsSold30d || 5), 8);
    } else if (daysOfInventoryRemaining <= 14 || demandPressureRatio >= 1.2) {
      statusCategory = "HIGH_RISK";
      suggestedReorderUnits = Math.max(
        Math.round(burnRateDaily * 45) - stock + alertSubscribers,
        6
      );
    } else if (alertSubscribers >= 3 || requestsCount >= 2) {
      statusCategory = "DEMAND_SURGE";
      suggestedReorderUnits = Math.max(alertSubscribers * 2 - stock, 5);
    } else if (stock >= 6 && unitsSold30d === 0) {
      statusCategory = "STAGNANT_OVERSTOCK";
      suggestedReorderUnits = 0;
    }

    // Cost estimate (assuming ~60% wholesale cost of retail CLP)
    const estimatedWholesaleUnitCost = Math.round(price * 0.6);
    const estimatedReorderCostClp = suggestedReorderUnits * estimatedWholesaleUnitCost;

    return {
      sku: prod.sku,
      id: prod.id,
      name: prod.name,
      slug: (prod as any).slug || prod.id,
      images:
        prod.images && prod.images.length > 0
          ? prod.images
          : (prod as any).imageUrl
          ? [(prod as any).imageUrl]
          : [],
      type: prod.type,
      platform: (prod as any).gameMetadata?.platform || null,
      price,
      stockAvailable: stock,
      totalValueClp,
      unitsSold30d,
      unitsSold90d,
      burnRateDaily,
      daysOfInventoryRemaining,
      alertSubscribers,
      requestsCount,
      demandPressureRatio,
      statusCategory,
      suggestedReorderUnits,
      estimatedReorderCostClp,
    };
  });

  // Calculate summary KPIs
  const totalInventoryValueClp = metrics.reduce((acc, m) => acc + m.totalValueClp, 0);
  const totalStockUnits = metrics.reduce((acc, m) => acc + m.stockAvailable, 0);
  const criticalCount = metrics.filter(
    (m) => m.statusCategory === "CRITICAL_OUT_OF_STOCK" || m.statusCategory === "HIGH_RISK"
  ).length;
  const stagnantValueClp = metrics
    .filter((m) => m.statusCategory === "STAGNANT_OVERSTOCK")
    .reduce((acc, m) => acc + m.totalValueClp, 0);
  const totalWaitingCustomers = metrics.reduce((acc, m) => acc + m.alertSubscribers, 0);
  const totalEstimatedReorderCost = metrics.reduce(
    (acc, m) => acc + m.estimatedReorderCostClp,
    0
  );

  return {
    metrics,
    summary: {
      totalProductsCount: metrics.length,
      totalStockUnits,
      totalInventoryValueClp,
      criticalCount,
      stagnantValueClp,
      totalWaitingCustomers,
      totalEstimatedReorderCost,
      lastUpdated: new Date().toISOString(),
    },
  };
}

// GET: Returns computed inventory metrics and summary
export async function GET() {
  try {
    const data = await computeInventoryMetrics();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[Predictive Stock API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al calcular rotación predictiva." },
      { status: 500 }
    );
  }
}

// POST: Calls Gemini AI to generate strategic diagnostic insights
export async function POST() {
  try {
    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    if (!geminiApiKey || geminiApiKey.includes("YOUR_") || geminiApiKey.length < 15) {
      return NextResponse.json(
        { success: false, error: "API Key de Gemini no configurada en el servidor." },
        { status: 500 }
      );
    }

    const { metrics, summary } = await computeInventoryMetrics();

    // Select critical, stagnant and high demand products for Gemini analysis
    const criticalItems = metrics
      .filter((m) => m.statusCategory === "CRITICAL_OUT_OF_STOCK" || m.statusCategory === "HIGH_RISK")
      .map((m) => `- SKU: "${m.sku}" | "${m.name}" | Stock: ${m.stockAvailable} | Ventas 30d: ${m.unitsSold30d} | Alertas clientes: ${m.alertSubscribers} | Runway: ${m.daysOfInventoryRemaining} días`);

    const stagnantItems = metrics
      .filter((m) => m.statusCategory === "STAGNANT_OVERSTOCK")
      .map((m) => `- SKU: "${m.sku}" | "${m.name}" | Stock: ${m.stockAvailable} | Valor estancado: $${m.totalValueClp.toLocaleString("es-CL")} CLP`);

    const prompt = `Eres el Director de Estrategia de Inventario y Cadena de Suministro de OmniCollector Chile (tienda especialista en videojuegos, consolas, figuras japonesas y merchandising).

Analiza estos datos reales de rotación y demanda de nuestra bodega:

RESUMEN GENERAL:
- Total Productos en Catálogo: ${summary.totalProductsCount}
- Unidades Totales en Bodega: ${summary.totalStockUnits}
- Valor Total del Inventario: $${summary.totalInventoryValueClp.toLocaleString("es-CL")} CLP
- Artículos en Riesgo Crítico o Quiebre: ${summary.criticalCount}
- Capital Inmovilizado en Sobre-stock / Lento: $${summary.stagnantValueClp.toLocaleString("es-CL")} CLP
- Clientes Activos Esperando Alertas de Stock: ${summary.totalWaitingCustomers}

PRODUCTOS EN RIESGO CRÍTICO O QUIEBRE INMINENTE:
${criticalItems.length > 0 ? criticalItems.join("\n") : "Ninguno en riesgo crítico actual."}

PRODUCTOS CON CAPITAL ESTANCADO (SOBRESTOCK SIN ROTACIÓN 30 DÍAS):
${stagnantItems.length > 0 ? stagnantItems.join("\n") : "Sin inventario estancado significativo."}

INSTRUCCIONES:
Genera un diagnóstico estratégico ejecutivo en formato JSON estricto con:
1. "executiveSummary": Diagnóstico claro, con tono profesional de consultor gamer y de negocios en Chile. Explica el balance de salud del inventario.
2. "urgentRestock": Lista de 2 a 4 recomendaciones prioritarias de reabastecimiento (sku, title, suggestedUnits, estimatedBudgetClp, rationale).
3. "stagnantLiquidationTactics": 2 o 3 tácticas accionables para liberar el capital dormido (ideas de bundles con juegos populares, flash sale o promociones de preventa).
4. "marketTrendSignals": 2 oportunidades de tendencia para el mercado chileno de coleccionistas.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura:
{
  "executiveSummary": "...",
  "urgentRestock": [
    {
      "sku": "VG-...",
      "title": "Nombre",
      "suggestedUnits": 10,
      "estimatedBudgetClp": 350000,
      "rationale": "Por qué es prioritario reabastecer"
    }
  ],
  "stagnantLiquidationTactics": [
    {
      "title": "Estrategia",
      "description": "Detalle táctico",
      "impact": "Liberar $... CLP de capital inmovilizado"
    }
  ],
  "marketTrendSignals": [
    {
      "trend": "Tendencia",
      "action": "Acción recomendada"
    }
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
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200,
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
        }
      } catch (err: any) {
        lastErrorText = err.message || String(err);
      }
    }

    if (!geminiRes) {
      return NextResponse.json(
        { success: false, error: `Error con Gemini AI: ${lastErrorText || "Servicio no disponible"}` },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const aiReport = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        summary,
        aiReport,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Predictive Stock POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al generar informe predictivo con IA." },
      { status: 500 }
    );
  }
}
