import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { collectorInput } from "@/lib/collector/schema";
import { collectorOwnerKey } from "@/lib/collector/storage";

const mocks = vi.hoisted(() => ({ identity: vi.fn(), products: vi.fn(), db: { collection: vi.fn(), runTransaction: vi.fn() } }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: mocks.identity }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: mocks.products }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: mocks.db }));
import { GET, POST, PATCH, DELETE } from "@/app/api/users/collector/route";

type RecordData = { entries?: unknown; updatedAt?: string };
let docs: Map<string, RecordData>;
const input = collectorInput.parse({ title: "Link Nendoroid", category: "FIGURE" });
const req = (method: string, body?: unknown, query = "") => new NextRequest("https://example.com/api/users/collector" + query, { method, ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}) });
beforeEach(() => {
  vi.clearAllMocks(); docs = new Map(); mocks.identity.mockResolvedValue({ uid: "alice", email: "alice@example.com" }); mocks.products.mockResolvedValue([]);
  mocks.db.collection.mockImplementation((collection: string) => ({ doc: (id: string) => ({ path: collection + "/" + id, get: async () => ({ data: () => docs.get(collection + "/" + id) }) }) }));
  mocks.db.runTransaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => {
    const writes = new Map<string, RecordData>();
    const result = await work({ get: async (ref: { path: string }) => ({ data: () => docs.get(ref.path) }), set: (ref: { path: string }, data: RecordData) => writes.set(ref.path, data) });
    for (const [key, value] of writes) docs.set(key, value); return result;
  });
});
describe("Private collector API", () => {
  it("requires an authenticated identity before reads or writes", async () => {
    mocks.identity.mockResolvedValue(null);
    for (const method of [GET, POST, PATCH, DELETE]) expect((await method(req(method === GET ? "GET" : "POST"))).status).toBe(401);
    expect(mocks.db.collection).not.toHaveBeenCalled();
  });
  it("uses verified owner keys and ignores a forged query owner", async () => {
    const added = await (await POST(req("POST", { kind: "COLLECTION", entry: input }))).json(); expect(added.data.entries).toHaveLength(1);
    expect([...docs.keys()]).toEqual(["collector_profiles/" + collectorOwnerKey({ uid: "alice", email: "alice@example.com" })]);
    mocks.identity.mockResolvedValue({ uid: "bob", email: "bob@example.com" });
    const response = await GET(req("GET", undefined, "?userId=alice")); expect((await response.json()).data.entries).toEqual([]); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect((await DELETE(req("DELETE", undefined, "?id=" + added.data.entries[0].id))).status).toBe(404);
  });
  it("preserves created date when editing and moves to collection atomically", async () => {
    const added = await (await POST(req("POST", { kind: "WANTED", entry: input }))).json(); const item = added.data.entries[0];
    const edited = await (await PATCH(req("PATCH", { id: item.id, kind: "COLLECTION", entry: { ...input, notes: "Con caja" } }))).json();
    expect(edited.data.entries).toHaveLength(1); expect(edited.data.entries[0]).toMatchObject({ kind: "COLLECTION", createdAt: item.createdAt, notes: "Con caja" });
    expect((await DELETE(req("DELETE", undefined, "?id=" + item.id))).status).toBe(200);
    expect((await (await GET(req("GET"))).json()).data.entries).toEqual([]);
  });
  it("validates unknown fields, malformed JSON, URLs and deletion IDs without writing", async () => {
    expect((await POST(req("POST", { kind: "WANTED", entry: input, userId: "victim" }))).status).toBe(400);
    expect((await POST(req("POST", { kind: "WANTED", entry: { ...input, photoUrl: "javascript:alert(1)" } }))).status).toBe(400);
    expect((await POST(new NextRequest("https://example.com/api/users/collector", { method: "POST", body: "{" }))).status).toBe(400);
    expect((await DELETE(req("DELETE", undefined, "?id=../../victim"))).status).toBe(400); expect(docs.size).toBe(0);
  });
  it("requires a real linked catalog product and does not write during outages", async () => {
    expect((await POST(req("POST", { kind: "COLLECTION", entry: { ...input, productId: "missing" } }))).status).toBe(400);
    mocks.products.mockResolvedValue(null);
    expect((await POST(req("POST", { kind: "COLLECTION", entry: { ...input, productId: "p1" } }))).status).toBe(503); expect(docs.size).toBe(0);
  });
  it("persists manual entries even when catalog suggestions are unavailable", async () => {
    mocks.products.mockResolvedValue(null);
    const response = await POST(req("POST", { kind: "WANTED", entry: input })); const result = await response.json(); expect(response.status).toBe(200); expect(result.data.catalogAvailable).toBe(false); expect(result.data.entries).toHaveLength(1);
  });
  it("does not report success or leak secrets on a transaction failure", async () => {
    mocks.db.runTransaction.mockRejectedValue(new Error("private credential"));
    const response = await POST(req("POST", { kind: "WANTED", entry: input })); expect(response.status).toBe(503); expect(await response.text()).not.toContain("credential"); expect(docs.size).toBe(0);
  });
});
