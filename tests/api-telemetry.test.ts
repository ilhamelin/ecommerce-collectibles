import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGeminiCostUsd,
  recordApiUsage,
  getTelemetrySummary,
  clearTelemetryData,
  writeTelemetryToDisk,
  readTelemetryFromDisk,
  USD_TO_CLP_RATE,
} from "../src/lib/services/apiTelemetryService";
import { GET as telemetryGet, POST as telemetryPost } from "../src/app/api/admin/telemetry/route";
import { NextRequest } from "next/server";

describe("API Telemetry & AI Token Usage Suite", () => {
  beforeEach(async () => {
    // Start with a clean empty state (zero fake data)
    await clearTelemetryData();
  });

  describe("Clean State & No Fake Data Injection", () => {
    it("should return empty telemetry when no calls have occurred", async () => {
      const summary = await getTelemetrySummary("all");
      expect(summary.totalCalls).toBe(0);
      expect(summary.gemini.totalTokens).toBe(0);
      expect(summary.gemini.estimatedCostUsd).toBe(0);
      expect(summary.recentLogs).toHaveLength(0);
      expect(Object.keys(summary.gemini.byFeature)).toHaveLength(0);
      expect(Object.keys(summary.gemini.byModel)).toHaveLength(0);
    });
  });

  describe("Gemini Cost & Token Accounting", () => {
    it("should accurately compute USD cost for Gemini 1.5 Flash", () => {
      // 1,000,000 prompt tokens = $0.075 USD
      // 1,000,000 candidate tokens = $0.30 USD
      const cost = calculateGeminiCostUsd("gemini-1.5-flash", 1_000_000, 1_000_000);
      expect(cost).toBeCloseTo(0.375, 4);

      // Typical auto-fill: 500 prompt tokens, 200 candidates tokens
      const typicalCost = calculateGeminiCostUsd("gemini-1.5-flash", 500, 200);
      expect(typicalCost).toBeGreaterThan(0);
      expect(typicalCost).toBeLessThan(0.0002);
    });

    it("should compute higher USD cost for Gemini 1.5 Pro", () => {
      // Gemini 1.5 Pro: $1.25 prompt, $5.00 candidate per 1M
      const costPro = calculateGeminiCostUsd("gemini-1.5-pro", 10_000, 5_000);
      const costFlash = calculateGeminiCostUsd("gemini-1.5-flash", 10_000, 5_000);

      expect(costPro).toBeGreaterThan(costFlash);
      expect(costPro).toBeCloseTo(0.0375, 4);
    });

    it("should calculate cost using totalTokens fallback when prompt/candidate are split-less", () => {
      const fallbackCost = calculateGeminiCostUsd("gemini-1.5-flash", undefined, undefined, 10_000);
      expect(fallbackCost).toBeGreaterThan(0);
    });

    it("should safely return 0 for zero or undefined tokens", () => {
      expect(calculateGeminiCostUsd("gemini-1.5-flash", 0, 0)).toBe(0);
      expect(calculateGeminiCostUsd(undefined, undefined, undefined)).toBe(0);
    });
  });

  describe("Real Telemetry Event Recording & Strict Aggregation", () => {
    it("should record a new Gemini telemetry event with calculated cost and latency", async () => {
      const record = await recordApiUsage({
        provider: "GEMINI",
        feature: "AUTO_FILL_PRODUCT",
        endpoint: "/api/admin/auto-fill-product",
        model: "gemini-1.5-flash",
        promptTokens: 450,
        candidatesTokens: 180,
        latencyMs: 950,
        statusCode: 200,
        success: true,
      });

      expect(record.id).toBeDefined();
      expect(record.provider).toBe("GEMINI");
      expect(record.feature).toBe("AUTO_FILL_PRODUCT");
      expect(record.totalTokens).toBe(630);
      expect(record.estimatedCostUsd).toBeGreaterThan(0);
      expect(record.latencyMs).toBe(950);
      expect(record.success).toBe(true);

      const summary = await getTelemetrySummary("all");
      expect(summary.totalCalls).toBe(1);
      expect(summary.gemini.totalTokens).toBe(630);
      expect(summary.gemini.byFeature["AUTO_FILL_PRODUCT"]).toBeDefined();
      expect(summary.gemini.byFeature["AUTO_FILL_PRODUCT"].tokens).toBe(630);
    });

    it("should record payment gateway events without tokens", async () => {
      const mpRecord = await recordApiUsage({
        provider: "MERCADOPAGO",
        feature: "CHECKOUT",
        endpoint: "/api/checkout/mercadopago",
        latencyMs: 380,
        statusCode: 200,
      });

      expect(mpRecord.provider).toBe("MERCADOPAGO");
      expect(mpRecord.estimatedCostUsd).toBe(0);
      expect(mpRecord.success).toBe(true);
    });

    it("should handle failed calls gracefully with error messages", async () => {
      const failedRecord = await recordApiUsage({
        provider: "GEMINI",
        feature: "SOMMELIER_CHAT",
        endpoint: "/api/sommelier/chat",
        latencyMs: 1500,
        statusCode: 429,
        success: false,
        errorMessage: "Quota limit exceeded: Resource exhausted",
      });

      expect(failedRecord.success).toBe(false);
      expect(failedRecord.statusCode).toBe(429);
      expect(failedRecord.errorMessage).toContain("Resource exhausted");
    });

    it("should correctly sort records by Tokens, Cost and Latency", async () => {
      await recordApiUsage({
        provider: "GEMINI",
        feature: "SOMMELIER_CHAT",
        endpoint: "/api/sommelier/chat",
        model: "gemini-1.5-flash",
        promptTokens: 100,
        candidatesTokens: 50,
        latencyMs: 500,
        statusCode: 200,
      });

      await recordApiUsage({
        provider: "GEMINI",
        feature: "AUTO_FILL_PRODUCT",
        endpoint: "/api/admin/auto-fill-product",
        model: "gemini-1.5-pro",
        promptTokens: 2000,
        candidatesTokens: 1000,
        latencyMs: 2500,
        statusCode: 200,
      });

      const records = readTelemetryFromDisk();
      expect(records).toHaveLength(2);

      // Sort by tokens descending
      const byTokensDesc = [...records].sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0));
      expect(byTokensDesc[0].totalTokens).toBe(3000);
      expect(byTokensDesc[1].totalTokens).toBe(150);

      // Sort by latency descending
      const byLatencyDesc = [...records].sort((a, b) => b.latencyMs - a.latencyMs);
      expect(byLatencyDesc[0].latencyMs).toBe(2500);
      expect(byLatencyDesc[1].latencyMs).toBe(500);

      // Sort by cost descending
      const byCostDesc = [...records].sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);
      expect(byCostDesc[0].estimatedCostUsd).toBeGreaterThan(byCostDesc[1].estimatedCostUsd);
    });
  });

  describe("Admin Telemetry Route Handlers", () => {
    it("GET /api/admin/telemetry should return 200 and data payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/telemetry?timeframe=30d");
      const res = await telemetryGet(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.gemini).toBeDefined();
    });

    it("POST /api/admin/telemetry action RESET should clear records completely", async () => {
      await recordApiUsage({
        provider: "GEMINI",
        feature: "AUTO_FILL_PRODUCT",
        endpoint: "/api/admin/auto-fill-product",
        promptTokens: 500,
        candidatesTokens: 200,
        latencyMs: 800,
        statusCode: 200,
      });

      const req = new NextRequest("http://localhost:3000/api/admin/telemetry", {
        method: "POST",
        body: JSON.stringify({ action: "RESET" }),
      });

      const res = await telemetryPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.totalCalls).toBe(0);
      expect(readTelemetryFromDisk()).toHaveLength(0);
    });
  });
});
