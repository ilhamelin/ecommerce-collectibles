export type TelemetryProvider = "GEMINI" | "MERCADOPAGO" | "FLOW" | "AFTERSHIP" | "INTERNAL_AI" | "OTHER";

export type TelemetryFeature =
  | "AUTO_FILL_PRODUCT"
  | "SOMMELIER_CHAT"
  | "MARKET_RADAR"
  | "VISUAL_SEARCH"
  | "BRANDING_ICON"
  | "PREDICTIVE_STOCK"
  | "CHECKOUT"
  | "WEBHOOK"
  | "TRACKING"
  | "TEST_SIMULATION"
  | "OTHER";

export interface ApiTelemetryRecord {
  id: string;
  provider: TelemetryProvider;
  feature: TelemetryFeature;
  endpoint: string;
  model?: string;
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
  estimatedCostUsd: number;
  latencyMs: number;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string; // ISO-8601
}

export interface ApiUsageSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgLatencyMs: number;
  timeframe: "today" | "7d" | "30d" | "all";
  gemini: {
    totalCalls: number;
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    estimatedCostClp: number;
    byFeature: Record<string, { calls: number; tokens: number; costUsd: number }>;
    byModel: Record<string, { calls: number; tokens: number; costUsd: number }>;
  };
  mercadopago: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgLatencyMs: number;
  };
  flow: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgLatencyMs: number;
  };
  aftership: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgLatencyMs: number;
  };
  quota: {
    dailyTokenLimit: number;
    dailyTokensUsed: number;
    dailyTokenUsagePct: number;
    monthlyCostBudgetUsd: number;
    monthlyCostUsedUsd: number;
    monthlyCostUsagePct: number;
    rpmLimit: number;
    currentRpm: number;
  };
  recentLogs: ApiTelemetryRecord[];
}

export const USD_TO_CLP_RATE = 950;
