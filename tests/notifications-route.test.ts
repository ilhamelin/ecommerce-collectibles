import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mock = vi.hoisted(() => ({ identity: vi.fn(), collection: vi.fn(), reads: [] as string[], saved: vi.fn(), where: vi.fn(), transaction: vi.fn(), health: vi.fn(), auth: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: { collection: mock.collection, runTransaction: mock.transaction } }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: mock.identity }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mock.auth }));
vi.mock("@/lib/services/systemHealth", () => ({ getSystemHealth: mock.health }));
import { GET, PATCH } from "@/app/api/users/notifications/route";
import { GET as healthGET } from "@/app/api/admin/health/route";
const request = (ids?: string[]) => new NextRequest("https://example.com/api/users/notifications", ids ? { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) } : undefined);
beforeEach(() => {
 vi.clearAllMocks(); mock.reads = []; mock.identity.mockResolvedValue({ uid: "u1", email: "one@example.com", admin: false });
 mock.collection.mockImplementation((name: string) => {
  if (name === "collector_profiles") return { doc: () => ({ get: async () => ({ data: () => ({ entries: [] }) }) }) };
  if (name === "notification_reads") return { doc: () => ({ get: async () => ({ data: () => ({ ids: mock.reads }) }) }) };
  const docs = name === "orders" ? [{ id: "order1", data: () => ({ status: "CONFIRMED", createdAt: "2026-10-03" }) }] : [];
  const query = { where: (...args: unknown[]) => { mock.where(name, ...args); return query; }, limit: () => query, get: async () => ({ docs }) }; return query;
 });
 mock.transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work({ get: async () => ({ data: () => ({ ids: mock.reads }) }), set: (_ref: unknown, data: { ids: string[] }) => { mock.reads = data.ids; mock.saved(data); } }));
});
describe("Private notification API", () => {
 it("rejects anonymous and unverified identities before any database read", async () => {
  mock.identity.mockResolvedValue(null); expect((await GET(request())).status).toBe(401);
  mock.identity.mockResolvedValue({ uid: "u1", email: "", admin: false }); expect((await GET(request())).status).toBe(403); expect(mock.collection).not.toHaveBeenCalled();
 });
 it("queries only the verified email and uses document IDs when data has none", async () => {
  const response = await GET(request()); const body = await response.json(); expect(response.headers.get("Cache-Control")).toContain("no-store"); expect(body.data.items).toHaveLength(1);
  expect(body.data.items[0].href).toBe("/order-confirmation/order1"); expect(mock.where).toHaveBeenCalledWith("orders", "customer.email", "==", "one@example.com"); expect(mock.where).toHaveBeenCalledWith("product_alerts", "email", "==", "one@example.com");
 });
 it("rejects forged notice IDs and never persists them", async () => {
  expect((await PATCH(request(["a".repeat(64)]))).status).toBe(403); expect(mock.saved).not.toHaveBeenCalled();
 });
 it("merges read state transactionally and returns server-confirmed read state", async () => {
  const first = await (await GET(request())).json(); const id = first.data.items[0].id;
  mock.reads = ["b".repeat(64)]; const result = await (await PATCH(request([id]))).json();
  expect(result.data.items[0].read).toBe(true); expect(result.data.unread).toBe(0); expect(mock.reads).toContain("b".repeat(64)); expect(mock.reads).toContain(id);
 });
 it("rejects malformed JSON and empty ID lists", async () => {
  expect((await PATCH(new NextRequest("https://example.com/api/users/notifications", { method: "PATCH", body: "{" }))).status).toBe(400);
  expect((await PATCH(request([]))).status).toBe(400); expect(mock.saved).not.toHaveBeenCalled();
 });
 it("handles storage failures without exposing internal errors", async () => {
  mock.collection.mockImplementation(() => { throw new Error("private key"); }); const result = await GET(request()); expect(result.status).toBe(503); expect(await result.text()).not.toContain("private key");
 });
});
describe("Administrative health API", () => {
 it("requires signed admin authorization before probing services", async () => { mock.auth.mockResolvedValue({ authorized: false }); expect((await healthGET(request())).status).toBe(403); expect(mock.health).not.toHaveBeenCalled(); });
 it("returns uncached health for an authorized admin", async () => { mock.auth.mockResolvedValue({ authorized: true }); mock.health.mockResolvedValue({ services: [] }); const result = await healthGET(request()); expect(result.status).toBe(200); expect(result.headers.get("Cache-Control")).toBe("no-store"); });
});
