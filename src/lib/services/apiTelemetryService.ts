import fs from "fs";
import path from "path";
import {
  TelemetryProvider,
  TelemetryFeature,
  ApiTelemetryRecord,
  ApiUsageSummary,
  USD_TO_CLP_RATE,
} from "@/lib/types/telemetry";

export type {
  TelemetryProvider,
  TelemetryFeature,
  ApiTelemetryRecord,
  ApiUsageSummary,
};
export { USD_TO_CLP_RATE };

const DATA_DIR = path.join(process.cwd(), "src", "data");
const TELEMETRY_DISK_PATH = path.join(DATA_DIR, "api_telemetry.json");

// Gemini Pricing Reference (USD per 1,000,000 tokens)
const GEMINI_PRICING: Record<string, { promptPerMillion: number; candidatePerMillion: number }> = {
  "gemini-1.5-flash": { promptPerMillion: 0.075, candidatePerMillion: 0.30 },
  "gemini-1.5-flash-latest": { promptPerMillion: 0.075, candidatePerMillion: 0.30 },
  "gemini-2.0-flash": { promptPerMillion: 0.10, candidatePerMillion: 0.40 },
  "gemini-1.5-pro": { promptPerMillion: 1.25, candidatePerMillion: 5.00 },
  "gemini-pro": { promptPerMillion: 0.50, candidatePerMillion: 1.50 },
  default: { promptPerMillion: 0.10, candidatePerMillion: 0.35 },
};

declare global {
  // eslint-disable-next-line no-var
  var __apiTelemetryGlobalStore: ApiTelemetryRecord[] | undefined;
}

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[ApiTelemetryService] Could not ensure data directory:", err);
  }
}

/**
 * Calculates estimated USD cost for a Gemini API invocation based on token counts and model.
 *
 * @param model - Gemini model identifier (e.g. 'gemini-1.5-flash')
 * @param promptTokens - Number of input prompt tokens
 * @param candidatesTokens - Number of generated output tokens
 * @param totalTokens - Fallback total tokens if prompt/candidates are not separately provided
 * @returns Estimated cost in USD
 */
export function calculateGeminiCostUsd(
  model?: string,
  promptTokens?: number,
  candidatesTokens?: number,
  totalTokens?: number
): number {
  const normModel = (model || "").toLowerCase();
  const pricing = Object.entries(GEMINI_PRICING).find(([k]) => normModel.includes(k))?.[1] || GEMINI_PRICING.default;

  const prompt = promptTokens ?? 0;
  const candidates = candidatesTokens ?? 0;

  if (prompt > 0 || candidates > 0) {
    const promptCost = (prompt / 1_000_000) * pricing.promptPerMillion;
    const candidateCost = (candidates / 1_000_000) * pricing.candidatePerMillion;
    return Number((promptCost + candidateCost).toFixed(7));
  }

  if (totalTokens && totalTokens > 0) {
    // Balanced approximation: 60% prompt, 40% candidate
    const approxPrompt = totalTokens * 0.6;
    const approxCandidate = totalTokens * 0.4;
    const cost = (approxPrompt / 1_000_000) * pricing.promptPerMillion + (approxCandidate / 1_000_000) * pricing.candidatePerMillion;
    return Number(cost.toFixed(7));
  }

  return 0;
}

/**
 * Reads telemetry records from memory cache or disk.
 */
export function readTelemetryFromDisk(): ApiTelemetryRecord[] {
  if (globalThis.__apiTelemetryGlobalStore && globalThis.__apiTelemetryGlobalStore.length > 0) {
    return globalThis.__apiTelemetryGlobalStore;
  }

  try {
    if (fs.existsSync(TELEMETRY_DISK_PATH)) {
      const raw = fs.readFileSync(TELEMETRY_DISK_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalThis.__apiTelemetryGlobalStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[ApiTelemetryService] Could not read telemetry from disk:", err);
  }

  // Generate initial seed if empty
  const initialData = generateSeedTelemetryData();
  writeTelemetryToDisk(initialData);
  return initialData;
}

/**
 * Writes telemetry records to disk and updates in-memory singleton.
 */
export function writeTelemetryToDisk(records: ApiTelemetryRecord[]): void {
  try {
    ensureDataDir();
    // Keep max 2,000 records to prevent memory/disk bloat
    const trimmed = records.slice(0, 2000);
    fs.writeFileSync(TELEMETRY_DISK_PATH, JSON.stringify(trimmed, null, 2), "utf-8");
    globalThis.__apiTelemetryGlobalStore = trimmed;
  } catch (err) {
    console.warn("[ApiTelemetryService] Could not write telemetry to disk:", err);
  }
}

/**
 * Records a new API execution telemetry event. Non-blocking and failsafe.
 */
export async function recordApiUsage(
  data: {
    provider: TelemetryProvider;
    feature: TelemetryFeature;
    endpoint: string;
    model?: string;
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
    latencyMs: number;
    statusCode: number;
    success?: boolean;
    errorMessage?: string;
  }
): Promise<ApiTelemetryRecord> {
  try {
    const records = readTelemetryFromDisk();

    const isSuccess = data.success !== undefined ? data.success : data.statusCode >= 200 && data.statusCode < 300;

    let computedCost = data.estimatedCostUsd;
    if (computedCost === undefined && data.provider === "GEMINI") {
      computedCost = calculateGeminiCostUsd(
        data.model,
        data.promptTokens,
        data.candidatesTokens,
        data.totalTokens
      );
    }

    const newRecord: ApiTelemetryRecord = {
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      provider: data.provider,
      feature: data.feature,
      endpoint: data.endpoint,
      model: data.model,
      promptTokens: data.promptTokens,
      candidatesTokens: data.candidatesTokens,
      totalTokens: data.totalTokens ?? ((data.promptTokens ?? 0) + (data.candidatesTokens ?? 0) || undefined),
      estimatedCostUsd: computedCost ?? 0,
      latencyMs: Math.max(0, Math.round(data.latencyMs)),
      statusCode: data.statusCode,
      success: isSuccess,
      errorMessage: data.errorMessage,
      timestamp: new Date().toISOString(),
    };

    // Prepend to show latest first
    const updated = [newRecord, ...records];
    writeTelemetryToDisk(updated);

    return newRecord;
  } catch (err) {
    console.warn("[ApiTelemetryService] Error in recordApiUsage:", err);
    // Return dummy record to never break caller
    return {
      id: `err_${Date.now()}`,
      provider: data.provider,
      feature: data.feature,
      endpoint: data.endpoint,
      estimatedCostUsd: 0,
      latencyMs: data.latencyMs,
      statusCode: data.statusCode,
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Aggregates telemetry records into a rich operational summary for admin dashboarding.
 */
export async function getTelemetrySummary(
  timeframe: "today" | "7d" | "30d" | "all" = "30d"
): Promise<ApiUsageSummary> {
  const allRecords = readTelemetryFromDisk();

  const now = new Date();
  let cutoffDate: Date | null = null;

  if (timeframe === "today") {
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeframe === "7d") {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === "30d") {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const filtered = cutoffDate
    ? allRecords.filter((r) => new Date(r.timestamp) >= cutoffDate)
    : allRecords;

  let totalLatency = 0;
  let successfulCalls = 0;
  let failedCalls = 0;

  // Gemini specific stats
  let geminiCalls = 0;
  let geminiPromptTokens = 0;
  let geminiCandidatesTokens = 0;
  let geminiTotalTokens = 0;
  let geminiCostUsd = 0;
  const geminiByFeature: Record<string, { calls: number; tokens: number; costUsd: number }> = {};
  const geminiByModel: Record<string, { calls: number; tokens: number; costUsd: number }> = {};

  // Mercado Pago
  let mpCalls = 0;
  let mpSuccess = 0;
  let mpLatency = 0;

  // Flow
  let flowCalls = 0;
  let flowSuccess = 0;
  let flowLatency = 0;

  // AfterShip
  let aftershipCalls = 0;
  let aftershipSuccess = 0;
  let aftershipLatency = 0;

  for (const record of filtered) {
    totalLatency += record.latencyMs;
    if (record.success) {
      successfulCalls++;
    } else {
      failedCalls++;
    }

    if (record.provider === "GEMINI") {
      geminiCalls++;
      const pTokens = record.promptTokens ?? 0;
      const cTokens = record.candidatesTokens ?? 0;
      const tTokens = record.totalTokens ?? (pTokens + cTokens);

      geminiPromptTokens += pTokens;
      geminiCandidatesTokens += cTokens;
      geminiTotalTokens += tTokens;
      geminiCostUsd += record.estimatedCostUsd;

      // By Feature
      const feat = record.feature;
      if (!geminiByFeature[feat]) {
        geminiByFeature[feat] = { calls: 0, tokens: 0, costUsd: 0 };
      }
      geminiByFeature[feat].calls++;
      geminiByFeature[feat].tokens += tTokens;
      geminiByFeature[feat].costUsd += record.estimatedCostUsd;

      // By Model
      const model = record.model || "gemini-1.5-flash";
      if (!geminiByModel[model]) {
        geminiByModel[model] = { calls: 0, tokens: 0, costUsd: 0 };
      }
      geminiByModel[model].calls++;
      geminiByModel[model].tokens += tTokens;
      geminiByModel[model].costUsd += record.estimatedCostUsd;
    } else if (record.provider === "MERCADOPAGO") {
      mpCalls++;
      if (record.success) mpSuccess++;
      mpLatency += record.latencyMs;
    } else if (record.provider === "FLOW") {
      flowCalls++;
      if (record.success) flowSuccess++;
      flowLatency += record.latencyMs;
    } else if (record.provider === "AFTERSHIP") {
      aftershipCalls++;
      if (record.success) aftershipSuccess++;
      aftershipLatency += record.latencyMs;
    }
  }

  const totalCalls = filtered.length;
  const avgLatencyMs = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;

  // Calculate daily token usage (past 24h)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dailyGeminiRecords = allRecords.filter(
    (r) => r.provider === "GEMINI" && new Date(r.timestamp) >= oneDayAgo
  );
  const dailyTokensUsed = dailyGeminiRecords.reduce((sum, r) => sum + (r.totalTokens ?? 0), 0);
  const dailyTokenLimit = 1_000_000; // 1M TPM or standard Google AI Studio daily free tier reference
  const dailyTokenUsagePct = Math.min(100, Math.round((dailyTokensUsed / dailyTokenLimit) * 100));

  // Calculate monthly cost budget
  const monthlyBudgetUsd = 25.0; // 25 USD reference monthly cap
  const monthlyCostUsedUsd = Number(geminiCostUsd.toFixed(4));
  const monthlyCostUsagePct = Math.min(100, Math.round((monthlyCostUsedUsd / monthlyBudgetUsd) * 100));

  // Current RPM (last 60 seconds)
  const oneMinAgo = new Date(now.getTime() - 60 * 1000);
  const currentRpm = allRecords.filter((r) => new Date(r.timestamp) >= oneMinAgo).length;

  return {
    totalCalls,
    successfulCalls,
    failedCalls,
    avgLatencyMs,
    timeframe,
    gemini: {
      totalCalls: geminiCalls,
      promptTokens: geminiPromptTokens,
      candidatesTokens: geminiCandidatesTokens,
      totalTokens: geminiTotalTokens,
      estimatedCostUsd: Number(geminiCostUsd.toFixed(4)),
      estimatedCostClp: Math.round(geminiCostUsd * USD_TO_CLP_RATE),
      byFeature: geminiByFeature,
      byModel: geminiByModel,
    },
    mercadopago: {
      totalCalls: mpCalls,
      successfulCalls: mpSuccess,
      failedCalls: mpCalls - mpSuccess,
      avgLatencyMs: mpCalls > 0 ? Math.round(mpLatency / mpCalls) : 0,
    },
    flow: {
      totalCalls: flowCalls,
      successfulCalls: flowSuccess,
      failedCalls: flowCalls - flowSuccess,
      avgLatencyMs: flowCalls > 0 ? Math.round(flowLatency / flowCalls) : 0,
    },
    aftership: {
      totalCalls: aftershipCalls,
      successfulCalls: aftershipSuccess,
      failedCalls: aftershipCalls - aftershipSuccess,
      avgLatencyMs: aftershipCalls > 0 ? Math.round(aftershipLatency / aftershipCalls) : 0,
    },
    quota: {
      dailyTokenLimit,
      dailyTokensUsed,
      dailyTokenUsagePct,
      monthlyCostBudgetUsd: monthlyBudgetUsd,
      monthlyCostUsedUsd,
      monthlyCostUsagePct,
      rpmLimit: 15, // Google AI Studio free tier RPM
      currentRpm,
    },
    recentLogs: filtered.slice(0, 50),
  };
}

/**
 * Resets telemetry data to empty state.
 */
export async function clearTelemetryData(): Promise<void> {
  writeTelemetryToDisk([]);
}

/**
 * Generates an initial seed of realistic telemetry data so the dashboard displays
 * representative operational trends immediately upon opening.
 */
export function generateSeedTelemetryData(): ApiTelemetryRecord[] {
  const seed: ApiTelemetryRecord[] = [];
  const now = Date.now();

  const sampleEvents = [
    {
      provider: "GEMINI" as TelemetryProvider,
      feature: "AUTO_FILL_PRODUCT" as TelemetryFeature,
      endpoint: "/api/admin/auto-fill-product",
      model: "gemini-1.5-flash",
      pTokens: 480,
      cTokens: 240,
      latency: 1150,
      status: 200,
      success: true,
    },
    {
      provider: "GEMINI" as TelemetryProvider,
      feature: "SOMMELIER_CHAT" as TelemetryFeature,
      endpoint: "/api/sommelier/chat",
      model: "gemini-1.5-flash",
      pTokens: 820,
      cTokens: 310,
      latency: 1420,
      status: 200,
      success: true,
    },
    {
      provider: "GEMINI" as TelemetryProvider,
      feature: "MARKET_RADAR" as TelemetryFeature,
      endpoint: "/api/admin/radar",
      model: "gemini-1.5-pro",
      pTokens: 1450,
      cTokens: 680,
      latency: 2840,
      status: 200,
      success: true,
    },
    {
      provider: "MERCADOPAGO" as TelemetryProvider,
      feature: "CHECKOUT" as TelemetryFeature,
      endpoint: "/api/checkout/mercadopago",
      latency: 420,
      status: 200,
      success: true,
    },
    {
      provider: "FLOW" as TelemetryProvider,
      feature: "CHECKOUT" as TelemetryFeature,
      endpoint: "/api/checkout/flow",
      latency: 380,
      status: 200,
      success: true,
    },
    {
      provider: "AFTERSHIP" as TelemetryProvider,
      feature: "TRACKING" as TelemetryFeature,
      endpoint: "/api/tracking",
      latency: 290,
      status: 200,
      success: true,
    },
    {
      provider: "GEMINI" as TelemetryProvider,
      feature: "BRANDING_ICON" as TelemetryFeature,
      endpoint: "/api/admin/branding/generate-icon",
      model: "gemini-1.5-flash",
      pTokens: 620,
      cTokens: 190,
      latency: 980,
      status: 200,
      success: true,
    },
    {
      provider: "GEMINI" as TelemetryProvider,
      feature: "PREDICTIVE_STOCK" as TelemetryFeature,
      endpoint: "/api/admin/predictive-stock",
      model: "gemini-1.5-flash",
      pTokens: 940,
      cTokens: 410,
      latency: 1650,
      status: 200,
      success: true,
    },
  ];

  // Distribute 45 entries over the past 7 days
  for (let i = 0; i < 45; i++) {
    const sample = sampleEvents[i % sampleEvents.length];
    const timeOffsetMs = Math.round((i / 45) * 6 * 24 * 60 * 60 * 1000 + Math.random() * 3600000);
    const timestamp = new Date(now - timeOffsetMs).toISOString();

    const pTokens = sample.pTokens ? Math.round(sample.pTokens * (0.85 + Math.random() * 0.3)) : undefined;
    const cTokens = sample.cTokens ? Math.round(sample.cTokens * (0.85 + Math.random() * 0.3)) : undefined;
    const totalTokens = pTokens && cTokens ? pTokens + cTokens : undefined;

    const costUsd =
      sample.provider === "GEMINI"
        ? calculateGeminiCostUsd(sample.model, pTokens, cTokens, totalTokens)
        : 0;

    seed.push({
      id: `seed_${i}_${Date.now()}`,
      provider: sample.provider,
      feature: sample.feature,
      endpoint: sample.endpoint,
      model: sample.model,
      promptTokens: pTokens,
      candidatesTokens: cTokens,
      totalTokens,
      estimatedCostUsd: costUsd,
      latencyMs: Math.round(sample.latency * (0.85 + Math.random() * 0.3)),
      statusCode: sample.status,
      success: sample.success,
      timestamp,
    });
  }

  // Sort descending by timestamp
  seed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return seed;
}
