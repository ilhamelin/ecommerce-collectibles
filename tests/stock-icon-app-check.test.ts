import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), check: vi.fn(), catalog: vi.fn(), telemetry: vi.fn(), key: vi.fn(), models: vi.fn(), provider: vi.fn() }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mocks.auth }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: async () => ({ uid: "", email: "admin@example.com", admin: true }) }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null, adminApp: {} }));
vi.mock("firebase-admin/app-check", () => ({ getAppCheck: () => ({ verifyToken: mocks.check }) }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: mocks.catalog, getAllOrdersFromFirestore: async () => [] }));
vi.mock("@/lib/services/apiTelemetryService", () => ({ recordApiUsage: mocks.telemetry }));
vi.mock("@/lib/services/geminiClient", () => ({ getGeminiApiKey: mocks.key, getSupportedGeminiModels: mocks.models }));

vi.mock("@/lib/services/alertService", () => ({ alertService: { getAllAlerts: async () => [] } }));
vi.mock("@/lib/services/productRequestService", () => ({ productRequestService: { getAllRequests: async () => [] } }));
vi.mock("@/lib/firebase/config", () => ({ db: null, isFirebaseConfigured: () => false }));
const routes = ["predictive-stock", "branding/generate-icon"] as const;
const request = (route: string, token?: string) => new NextRequest("http://localhost/api/admin/" + route, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { "X-Firebase-AppCheck": token } : {}) }, body: JSON.stringify({ prompt: "Un símbolo personalizado" }) });
const load = async (route: typeof routes[number]) => route === "predictive-stock" ? import("@/app/api/admin/predictive-stock/route") : import("@/app/api/admin/branding/generate-icon/route");
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("FIREBASE_APPCHECK_MODE", "enforce");
  vi.stubEnv("AI_GLOBAL_DAILY_REQUESTS", "100"); vi.stubEnv("AI_USER_DAILY_REQUESTS", "100"); vi.stubEnv("AI_GLOBAL_DAILY_TOKENS", "10000000");
  mocks.auth.mockResolvedValue({ authorized: true, actor: "admin@example.com" }); mocks.check.mockResolvedValue({ appId: "registered-app" });
  mocks.catalog.mockResolvedValue([]); mocks.telemetry.mockResolvedValue(undefined); mocks.key.mockReturnValue("unit-test-provider-key"); mocks.models.mockResolvedValue(["test-model"]);
  mocks.provider.mockImplementation(async () => Response.json({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }));
  vi.stubGlobal("fetch", mocks.provider);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe.each(routes)("App Check for %s", route => {
  it("denies non-admin users before verification or quota", async () => {
    mocks.auth.mockResolvedValue({ authorized: false }); const { POST } = await load(route);
    expect((await POST(request(route, "valid"))).status).toBe(403); expect(mocks.check).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
    const { readAiProtectionStatus } = await import("@/lib/services/aiProtection"); expect((await readAiProtectionStatus()).usage.requests).toBe(0);
  });
  it("rejects absent and invalid proof before Gemini", async () => {
    const { POST } = await load(route); expect((await POST(request(route))).status).toBe(403);
    mocks.check.mockRejectedValue(new Error("invalid")); expect((await POST(request(route, "bad"))).status).toBe(403);
    expect(mocks.provider).not.toHaveBeenCalled(); expect(mocks.catalog).not.toHaveBeenCalled();
  });
  it("counts a verified generation and enforces shared quota", async () => {
    vi.stubEnv("AI_GLOBAL_DAILY_REQUESTS", "1");
    mocks.provider.mockImplementation(async () => Response.json({ candidates: [{ content: { parts: [{ text: route === "predictive-stock" ? JSON.stringify({ executiveSummary: "Diagnóstico", urgentRestock: [], stagnantLiquidationTactics: [], marketTrendSignals: [] }) : '<svg viewBox="0 0 24 24"><path d="M1 1L2 2" /></svg>' }] } }] }));
    const { POST } = await load(route); expect((await POST(request(route, "valid"))).status).toBe(200);
    expect((await POST(request(route, "valid"))).status).toBe(429); expect(mocks.provider).toHaveBeenCalledOnce();
    const { readAiProtectionStatus } = await import("@/lib/services/aiProtection"); expect((await readAiProtectionStatus()).usage).toMatchObject({ requests: 1, tokens: 48000, unchecked: 0 });
  });
  it("does not swallow the three-attempt protection error", async () => {
    mocks.models.mockResolvedValue(["one", "two", "three", "four"]); mocks.provider.mockImplementation(async () => new Response("unavailable", { status: 503 }));
    const { POST } = await load(route); const response = await POST(request(route, "valid"));
    expect(response.status).toBe(503); expect((await response.json()).code).toBe("AI_PROTECTION"); expect(mocks.provider).toHaveBeenCalledTimes(3);
  });
});
it("reading saved inventory metrics is admin-only and consumes no AI quota", async () => {
  const { GET } = await import("@/app/api/admin/predictive-stock/route");
  const req = new NextRequest("http://localhost/api/admin/predictive-stock");
  mocks.auth.mockResolvedValue({ authorized: false }); expect((await GET(req)).status).toBe(403); expect(mocks.catalog).not.toHaveBeenCalled();
  mocks.auth.mockResolvedValue({ authorized: true }); expect((await GET(req)).status).toBe(200);
  expect(mocks.check).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
  const { readAiProtectionStatus } = await import("@/lib/services/aiProtection"); expect((await readAiProtectionStatus()).usage.requests).toBe(0);
});
