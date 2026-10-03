import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), check: vi.fn(), catalog: vi.fn(), telemetry: vi.fn(), key: vi.fn(), models: vi.fn(), provider: vi.fn() }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mocks.auth }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: async () => ({ uid: "", email: "admin@example.com", admin: true }) }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null, adminApp: {} }));
vi.mock("firebase-admin/app-check", () => ({ getAppCheck: () => ({ verifyToken: mocks.check }) }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: mocks.catalog }));
vi.mock("@/lib/services/apiTelemetryService", () => ({ recordApiUsage: mocks.telemetry }));
vi.mock("@/lib/services/geminiClient", () => ({ getGeminiApiKey: mocks.key, getSupportedGeminiModels: mocks.models }));
const report = { marketOverview: "Informe de prueba", scannedAt: "2026-10-03T00:00:00.000Z", reissueAlerts: [], hotTrends: [], urgentRecommendations: [] };
const request = (token?: string) => new NextRequest("http://localhost/api/admin/radar", { headers: token ? { "X-Firebase-AppCheck": token } : {} });
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("FIREBASE_APPCHECK_MODE", "enforce");
  vi.stubEnv("AI_GLOBAL_DAILY_REQUESTS", "100"); vi.stubEnv("AI_USER_DAILY_REQUESTS", "100"); vi.stubEnv("AI_GLOBAL_DAILY_TOKENS", "10000000");
  mocks.auth.mockResolvedValue({ authorized: true, actor: "admin@example.com" }); mocks.check.mockResolvedValue({ appId: "registered-app" });
  mocks.catalog.mockResolvedValue([]); mocks.telemetry.mockResolvedValue(undefined); mocks.key.mockReturnValue("unit-test-provider-key"); mocks.models.mockResolvedValue(["test-model"]);
  mocks.provider.mockImplementation(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(report) }] } }], usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 40, totalTokenCount: 60 } }));
  vi.stubGlobal("fetch", mocks.provider);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Radar participates in shared App Check protection", () => {
  it("requires admin authority before checking tokens or reserving quota", async () => {
    mocks.auth.mockResolvedValue({ authorized: false }); const { GET } = await import("@/app/api/admin/radar/route");
    expect((await GET(request("valid"))).status).toBe(403); expect(mocks.check).not.toHaveBeenCalled(); expect(mocks.catalog).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
    const { readAiProtectionStatus } = await import("@/lib/services/aiProtection"); expect((await readAiProtectionStatus()).usage.requests).toBe(0);
  });
  it("rejects absent and invalid tokens in enforce mode before reading the catalog or calling Gemini", async () => {
    const { GET } = await import("@/app/api/admin/radar/route");
    expect((await GET(request())).status).toBe(403); mocks.check.mockRejectedValue(new Error("invalid"));
    expect((await GET(request("invalid"))).status).toBe(403); expect(mocks.catalog).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
  });
  it("verifies the token, increments shared quota and preserves actual usage telemetry", async () => {
    const { GET } = await import("@/app/api/admin/radar/route"); const response = await GET(request("valid"));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store"); expect((await response.json()).data).toEqual(report);
    expect(mocks.check).toHaveBeenCalledWith("valid"); expect(mocks.provider).toHaveBeenCalledOnce();
    expect(mocks.telemetry).toHaveBeenCalledWith(expect.objectContaining({ feature: "MARKET_RADAR", totalTokens: 60, success: true }));
    const { readAiProtectionStatus } = await import("@/lib/services/aiProtection");
    expect((await readAiProtectionStatus()).usage).toMatchObject({ requests: 1, tokens: 48000, unchecked: 0 });
  });
  it("records missing proofs in monitor mode while keeping the scan working", async () => {
    vi.stubEnv("FIREBASE_APPCHECK_MODE", "monitor"); const { GET } = await import("@/app/api/admin/radar/route");
    expect((await GET(request())).status).toBe(200);
    const { readAiProtectionStatus } = await import("@/lib/services/aiProtection"); expect((await readAiProtectionStatus()).usage).toMatchObject({ requests: 1, unchecked: 1 });
  });
  it("returns 429 on shared quota exhaustion instead of reporting a successful heuristic scan", async () => {
    vi.stubEnv("AI_GLOBAL_DAILY_REQUESTS", "1"); const { GET } = await import("@/app/api/admin/radar/route");
    expect((await GET(request("valid"))).status).toBe(200); const denied = await GET(request("valid"));
    expect(denied.status).toBe(429); expect((await denied.json()).success).toBe(false); expect(mocks.provider).toHaveBeenCalledOnce();
  });
  it("bounds fallback model attempts and does not swallow protection errors", async () => {
    mocks.models.mockResolvedValue(["one", "two", "three", "four"]); mocks.provider.mockImplementation(async () => new Response("unavailable", { status: 503 }));
    const { GET } = await import("@/app/api/admin/radar/route"); const response = await GET(request("valid"));
    expect(response.status).toBe(503); expect((await response.json()).code).toBe("AI_PROTECTION"); expect(mocks.provider).toHaveBeenCalledTimes(3);
  });
  it("preserves the explicit local engine without a Gemini key while still counting its admitted request", async () => {
    mocks.key.mockReturnValue(""); const { GET } = await import("@/app/api/admin/radar/route");
    const response = await GET(request("valid")); expect((await response.json()).engine).toBe("LOCAL_HEURISTIC"); expect(mocks.provider).not.toHaveBeenCalled();
    const { readAiProtectionStatus } = await import("@/lib/services/aiProtection"); expect((await readAiProtectionStatus()).usage.requests).toBe(1);
  });
});
