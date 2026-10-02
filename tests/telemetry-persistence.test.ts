import { beforeEach, describe, expect, it, vi } from "vitest";
const cloud = vi.hoisted(() => ({ events: new Map<string, Record<string, unknown>>(), legacy: [] as Record<string, unknown>[], fail: false }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: {
  collection: () => ({ doc: () => ({
    get: async () => ({ data: () => ({ records: cloud.legacy }) }),
    set: async (data: { records: Record<string, unknown>[] }) => { cloud.legacy = data.records; },
    collection: () => ({
      doc: (id: string) => ({ set: async (data: Record<string, unknown>) => {
        if (cloud.fail) throw new Error("Firestore unavailable");
        expect(Object.values(data)).not.toContain(undefined);
        cloud.events.set(id, data);
      } }),
      get: async () => {
        if (cloud.fail) throw new Error("Firestore unavailable");
        return { docs: [...cloud.events.values()].map(data => ({ data: () => data })) };
      },
      limit: () => ({ get: async () => ({ empty: cloud.events.size === 0,
        docs: [...cloud.events.keys()].map(id => ({ ref: id })) }) }),
    }),
  }) }),
  batch: () => { const ids: string[] = []; return {
    delete: (id: string) => { ids.push(id); },
    commit: async () => { ids.forEach(id => cloud.events.delete(id)); },
  }; },
} }));
import { recordApiUsage, getTelemetrySummary, clearTelemetryData } from "../src/lib/services/apiTelemetryService";
const call = { provider: "GEMINI" as const, feature: "SOMMELIER_CHAT" as const,
  endpoint: "/api/chat", promptTokens: 10, candidatesTokens: 5, latencyMs: 20, statusCode: 200 };
beforeEach(() => { cloud.events.clear(); cloud.legacy = []; cloud.fail = false;
  globalThis.__apiTelemetryGlobalStore = []; });
describe("Durable API telemetry", () => {
  it("survives a cold instance and repeated refreshes", async () => {
    await recordApiUsage(call);
    globalThis.__apiTelemetryGlobalStore = undefined;
    expect((await getTelemetrySummary("all")).gemini.totalTokens).toBe(15);
    globalThis.__apiTelemetryGlobalStore = [];
    expect((await getTelemetrySummary("all")).totalCalls).toBe(1);
  });
  it("preserves concurrent calls and legacy history without duplicate IDs", async () => {
    const first = await recordApiUsage(call);
    cloud.legacy = [JSON.parse(JSON.stringify(first))];
    await Promise.all(Array.from({ length: 12 }, () => recordApiUsage(call)));
    expect((await getTelemetrySummary("all")).totalCalls).toBe(13);
  });
  it("persists an explicit reset across instance restarts", async () => {
    await recordApiUsage(call);
    await clearTelemetryData();
    globalThis.__apiTelemetryGlobalStore = undefined;
    expect((await getTelemetrySummary("all")).totalCalls).toBe(0);
  });
  it("surfaces database outages rather than showing false zero metrics", async () => {
    cloud.fail = true;
    await expect(getTelemetrySummary("all")).rejects.toThrow("Firestore unavailable");
  });
  it("keeps calendar monthly budget independent from selected timeframe", async () => {
    const current = await recordApiUsage({ ...call, estimatedCostUsd: 2 });
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.getMonth() === new Date().getMonth()) {
      cloud.events.set(current.id, { ...current, timestamp: yesterday.toISOString() });
      const summary = await getTelemetrySummary("today");
      expect(summary.totalCalls).toBe(0);
      expect(summary.quota.monthlyCostUsedUsd).toBe(2);
    }
  });
});
