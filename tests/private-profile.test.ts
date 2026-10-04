import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  deleteDoc: vi.fn(), commit: vi.fn(), identity: vi.fn(), getUser: vi.fn(), save: vi.fn().mockResolvedValue(true), remove: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: { batch: () => ({ delete: mocks.deleteDoc, commit: mocks.commit }), collection: (name: string) => ({ doc: (id: string) => ({ path: name + "/" + id }) }) } }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: mocks.identity }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: vi.fn().mockResolvedValue({ authorized: false }) }));
vi.mock("@/lib/firebase/firestore", () => ({
  getUserFromFirestore: mocks.getUser, syncUserProfileToFirestore: mocks.save, deleteUserFromFirestore: mocks.remove,
  getUsersFromFirestore: vi.fn().mockResolvedValue([]), getProductsFromFirestore: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/firebase/productReferenceCleanup", () => ({ cleanupPersistedProductReferences: vi.fn() }));
import { GET, PUT, DELETE } from "@/app/api/users/route";
const alice = { id: "alice", email: "alice@example.com", role: "CUSTOMER", fullName: "Alice", phone: "", addresses: [], paymentMethods: [], wishlist: [], orders: [], createdAt: "2026-01-01" };
const request = (method: string, body?: object, id = "alice") => new NextRequest("http://localhost/api/users?id=" + id, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
describe("Private account API", () => {
  it("removes private collector documents only after verifying the account owner", async () => {
    mocks.identity.mockResolvedValue({ uid: "alice", email: "alice@example.com", admin: false }); mocks.getUser.mockResolvedValue({ ...alice });
    expect((await DELETE(request("DELETE"))).status).toBe(200);
    expect(mocks.deleteDoc).toHaveBeenCalledTimes(2); expect(mocks.commit).toHaveBeenCalledOnce();
    expect(mocks.deleteDoc.mock.calls.every(([ref]) => ref.path.startsWith("collector_profiles/"))).toBe(true);
  });
  beforeEach(() => { vi.clearAllMocks(); mocks.identity.mockResolvedValue({ uid: "alice", email: "alice@example.com", admin: false }); mocks.getUser.mockResolvedValue({ ...alice }); mocks.save.mockResolvedValue(true); mocks.remove.mockResolvedValue(true); mocks.commit.mockResolvedValue(undefined); });
  it("rejects unauthenticated profile reads, updates and deletion", async () => {
    mocks.identity.mockResolvedValue(null);
    expect((await GET(request("GET"))).status).toBe(401); expect((await PUT(request("PUT", { id: "alice" }))).status).toBe(401); expect((await DELETE(request("DELETE"))).status).toBe(401);
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("does not accept a different account identifier as proof of ownership", async () => {
    mocks.identity.mockResolvedValue({ uid: "bob", email: "bob@example.com", admin: false });
    expect((await GET(request("GET"))).status).toBe(403); expect((await PUT(request("PUT", { id: "alice", fullName: "Hacked" }))).status).toBe(403); expect((await DELETE(request("DELETE"))).status).toBe(403);
  });
  it("permits an owner update but ignores client permissions and orders", async () => {
    const response = await PUT(request("PUT", { id: "alice", fullName: "Updated", role: "ADMIN", orders: [{ status: "DELIVERED" }] }));
    expect(response.status).toBe(200); expect(mocks.save.mock.calls[0][0]).toMatchObject({ fullName: "Updated", role: "CUSTOMER", orders: [] });
  });
  it("rejects oversized profiles and raw card fields", async () => {
    expect((await PUT(request("PUT", { id: "alice", fullName: "x".repeat(201) }))).status).toBe(400);
    expect((await PUT(request("PUT", { id: "alice", paymentMethods: [{ id: "card", brand: "VISA", last4: "1234", expiry: "12/30", holderName: "A", isDefault: true, cvv: "123" }] }))).status).toBe(400);
  });
  it("reports database failure instead of claiming a successful cloud update", async () => {
    mocks.save.mockResolvedValue(false); expect((await PUT(request("PUT", { id: "alice", fullName: "Updated" }))).status).toBe(503);
    mocks.remove.mockResolvedValue(false); expect((await DELETE(request("DELETE"))).status).toBe(503);
  });
});
