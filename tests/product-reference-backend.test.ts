vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: async () => ({ uid: "demo", email: "demo@example.com", admin: false }) }));
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ConfirmedOrderEntity, ProductDomainEntity } from "@/lib/types/domain";
const cloud = vi.hoisted(() => ({ configured: true, products: [] as ProductDomainEntity[] | null, orders: [] as ConfirmedOrderEntity[] }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: vi.fn(async () => cloud.products),
  getAllOrdersFromFirestore: vi.fn(async () => cloud.orders) }));
vi.mock("@/lib/firebase/config", () => ({ isFirebaseConfigured: () => cloud.configured }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null, isFirebaseAdminConfigured: () => cloud.configured }));
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { POST as subscribeAlert } from "@/app/api/products/[id]/alerts/route";
import { GET } from "@/app/api/orders/route";
import { NextRequest } from "next/server";
beforeEach(() => { cloud.configured = true; cloud.products = []; cloud.orders = []; });
describe("Authoritative backend synchronization", () => {
  it("removes deleted products from a warm instance even when Firestore is empty", async () => {
    const store = MemoryTransactionalStore.getInstance(); store.reset();
    expect(store.products.size).toBeGreaterThan(0);
    await store.syncAllFromFirestore();
    expect(store.products.size).toBe(0);
  });
  it("retains state when no authoritative catalog could be obtained", async () => {
    const store = MemoryTransactionalStore.getInstance(); store.reset();
    const before = store.products.size; cloud.products = null;
    await store.syncAllFromFirestore(); expect(store.products.size).toBe(before);
  });
  it("does not resurrect deleted orders from server memory", async () => {
    const store = MemoryTransactionalStore.getInstance(); store.orders.clear();
    const old = { id: "ghost", orderNumber: "ghost", createdAt: new Date().toISOString(),
      status: "CONFIRMED" as const, paymentMethod: "BANK_TRANSFER",
      customer: { email: "demo@example.com", fullName: "Demo", phone: "12345678", region: "RM", comuna: "Santiago", address: "Demo 123" },
      shippingMethod: { name: "Retiro", cost: 0, estimatedDelivery: "Hoy", trackingNumber: "demo" },
      subtotal: 0, discountAmount: 0, shippingCost: 0, totalChargedNow: 0, remainingBalanceLater: 0, reservationIds: [], items: [] };
    store.orders.set(old.id, old);
    const response = await GET(new NextRequest("http://localhost/api/orders?email=demo@example.com"));
    const payload = await response.json();
    expect(payload.data.orders).toEqual([]);
    expect(payload.data.totalCount).toBe(0);
  });
});

it("rejects new alert subscriptions for a deleted product", async () => {
  const response = await subscribeAlert(new NextRequest("http://localhost/api/products/deleted/alerts", {
    method: "POST", body: JSON.stringify({ email: "demo@example.com" }),
  }), { params: { id: "deleted" } });
  expect(response.status).toBe(404);
});
