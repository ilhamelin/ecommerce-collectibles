import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const check = vi.hoisted(() => vi.fn());
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null, adminApp: {} }));
vi.mock("firebase-admin/app-check", () => ({ getAppCheck: () => ({ verifyToken: check }) }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: async () => ({ uid: "test", email: "test@example.com", admin: false }) }));
import { withAiProtection, protectedAiFetch } from "@/lib/services/aiProtection";
describe("AI request protection", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  beforeEach(() => { vi.stubEnv("FIREBASE_APPCHECK_MODE", "enforce"); vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("AI_USER_DAILY_REQUESTS", "100"); vi.stubEnv("AI_GLOBAL_DAILY_REQUESTS", "100"); vi.stubEnv("AI_GLOBAL_DAILY_TOKENS", "10000000"); check.mockReset(); });
  it("blocks missing and invalid App Check proofs before invoking the handler", async () => {
    const handler = vi.fn(async () => new Response()); const route = withAiProtection("test", handler);
    expect((await route(new NextRequest("http://localhost"))).status).toBe(403);
    check.mockRejectedValue(new Error("invalid")); expect((await route(new NextRequest("http://localhost", { headers: { "X-Firebase-AppCheck": "invalid" } }))).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
  it("admits valid proof and keeps monitoring mode compatible with an unconfigured browser", async () => {
    check.mockResolvedValue({ appId: "registered-app" }); const handler = vi.fn(async () => new Response("ok"));
    const route = withAiProtection("test", handler);
    expect((await route(new NextRequest("http://localhost", { headers: { "X-Firebase-AppCheck": "valid" } }))).status).toBe(200);
    vi.stubEnv("FIREBASE_APPCHECK_MODE", "monitor"); expect((await route(new NextRequest("http://localhost"))).status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(2);
  });
  it("bounds fallback calls and output size", async () => {
    const provider = vi.fn(async (_url: string, _options: RequestInit) => new Response("{}")); vi.stubGlobal("fetch", provider); vi.stubEnv("FIREBASE_APPCHECK_MODE", "monitor");
    const route = withAiProtection("test", async () => {
      for (let i = 0; i < 4; i++) await protectedAiFetch("https://example.com", { body: JSON.stringify({ generationConfig: { maxOutputTokens: 99999 } }) });
      return new Response();
    });
    expect((await route(new NextRequest("http://localhost"))).status).toBe(503); expect(provider).toHaveBeenCalledTimes(3);
    expect(JSON.parse(provider.mock.calls[0][1].body as string).generationConfig.maxOutputTokens).toBe(8192);
    vi.unstubAllGlobals();
  });
  it("fails closed in production if durable quota storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("FIREBASE_APPCHECK_MODE", "monitor"); const handler = vi.fn(async () => new Response());
    expect((await withAiProtection("test", handler)(new NextRequest("http://localhost"))).status).toBe(503); expect(handler).not.toHaveBeenCalled();
  });
});
