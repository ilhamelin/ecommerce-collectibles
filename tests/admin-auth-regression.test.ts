import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/admin-session/route";
import { createAdminSessionToken } from "@/lib/auth/adminSessionToken";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { middleware } from "@/middleware";

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ adminAuth: { verifyIdToken } }));

function login(body: unknown) {
  return POST(new NextRequest("https://portfolio.example/api/auth/admin-session", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  vi.stubEnv("ADMIN_SESSION_SECRET", "test-private-signing-secret-at-least-32-characters");
  vi.stubEnv("ADMIN_DEMO_PASSWORD", "");
  vi.stubEnv("NODE_ENV", "test");
  verifyIdToken.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("Administrative identity regression", () => {
  it("rejects email-only requests and wrong passwords without issuing cookies", async () => {
    for (const body of [{ email: "admin@omnicollector.cl", role: "ADMIN" },
      { email: "admin@omnicollector.cl", password: "wrong" }, { email: 42 }]) {
      const response = await login(body);
      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });
  it("accepts the development demo and its cookie authorizes API requests", async () => {
    const response = await login({ email: "admin@omnicollector.cl", password: "admin123" });
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect((await verifyAdminAuthorization(new NextRequest("https://portfolio.example/api/products", {
      headers: { cookie },
    }))).authorized).toBe(true);
  });
  it("disables default demo credentials in production and accepts an explicit demo password", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await login({ email: "admin@omnicollector.cl", password: "admin123" })).status).toBe(401);
    vi.stubEnv("ADMIN_DEMO_PASSWORD", "configured-demo-password");
    const response = await login({ email: "admin@omnicollector.cl", password: "configured-demo-password" });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });
  it("takes identity from the verified Firebase token, ignoring body email and role", async () => {
    verifyIdToken.mockResolvedValue({ email: "customer@example.com", email_verified: true });
    expect((await login({ idToken: "customer-token", email: "admin@omnicollector.cl", role: "ADMIN" })).status).toBe(403);
    expect(verifyIdToken).toHaveBeenCalledWith("customer-token", true);
    verifyIdToken.mockResolvedValue({ email: "admin@omnicollector.cl", email_verified: true });
    expect((await login({ idToken: "admin-token" })).status).toBe(200);
  });
  it("rejects invalid and unverified Firebase identities", async () => {
    verifyIdToken.mockRejectedValue(new Error("invalid"));
    expect((await login({ idToken: "invalid" })).status).toBe(401);
    verifyIdToken.mockResolvedValue({ email: "admin@omnicollector.cl", email_verified: false });
    expect((await login({ idToken: "unverified" })).status).toBe(401);
  });
  it("fails closed when the private signing secret is absent", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect((await login({ email: "admin@omnicollector.cl", password: "admin123" })).status).toBe(500);
  });
});

describe("Administrative authorization regression", () => {
  it("rejects role headers, legacy keys, mock cookies and localhost bypasses", async () => {
    const headersList: Record<string, string>[] = [
      { "x-user-role": "ADMIN" }, { "x-admin-role": "ADMIN" },
      { "x-admin-secret": "omni-super-secret-key-2026" },
      { authorization: "Bearer omnicollector-admin-secret-chile-2026" },
      { cookie: "omni_admin_session=1", host: "localhost:3000", referer: "http://localhost:3000/admin" },
    ];
    for (const headers of headersList) {
      const request = new NextRequest("http://localhost:3000/api/admin/seed-firebase", { headers });
      expect((await verifyAdminAuthorization(request)).authorized).toBe(false);
      expect((await middleware(request)).status).toBe(403);
    }
  });
  it("allows a signed cookie through admin page and API middleware", async () => {
    const token = await createAdminSessionToken("admin@omnicollector.cl");
    for (const path of ["/admin/products", "/api/admin/seed-firebase"]) {
      const response = await middleware(new NextRequest(`https://portfolio.example${path}`, {
        headers: { cookie: `omni_admin_session=${token}` },
      }));
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  });
  it("rejects expired and tampered signed cookies", async () => {
    const expired = await createAdminSessionToken("admin@omnicollector.cl", -1);
    const valid = await createAdminSessionToken("admin@omnicollector.cl");
    for (const token of [expired, valid + "tampered"]) {
      expect((await verifyAdminAuthorization(new NextRequest("https://portfolio.example/api/products", {
        headers: { cookie: `omni_admin_session=${token}` },
      }))).authorized).toBe(false);
    }
  });
});
