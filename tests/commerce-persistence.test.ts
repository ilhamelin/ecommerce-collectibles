import { describe, it, expect, vi } from "vitest";
import { CommerceTransaction, commitOrderTransaction, planStockChanges, cancelOrderTransaction } from "@/lib/firebase/commerce";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { CheckoutService } from "@/lib/services/CheckoutService";

function database(seed: Record<string, Record<string, unknown>>) {
  let documents = structuredClone(seed);
  return {
    get: (path: string) => documents[path],
    async run<T>(operation: (transaction: CommerceTransaction) => Promise<T>) {
      const draft = structuredClone(documents);
      let writing = false;
      const result = await operation({
        read: async (path) => { if (writing) throw new Error("Read after write"); return draft[path] || null; },
        delete: (path) => { writing = true; delete draft[path]; },
        update: (path, data) => { writing = true; draft[path] = { ...draft[path], ...data }; },
        set: (path, data) => { writing = true; draft[path] = data; },
      });
      documents = draft;
      return result;
    },
  };
}

function order(): ConfirmedOrderEntity {
  const store = MemoryTransactionalStore.getInstance();
  store.reset();
  return {
    id: "ord-one", orderNumber: "ORD-ONE", checkoutRequestHash: "hash-one", createdAt: new Date().toISOString(),
    status: "CONFIRMED", paymentMethod: "BANK_TRANSFER",
    customer: { fullName: "Demo", email: "demo@example.com", phone: "12345678", region: "RM", comuna: "Santiago", address: "Demo 123" },
    shippingMethod: { name: "Demo", cost: 0, estimatedDelivery: "2 días", trackingNumber: "demo" },
    items: [{ productId: "one", sku: "ONE", name: "One", quantity: 2, unitPrice: 10, isPreOrder: false, isPartialDeposit: false, unitDeposit: 10, remainingBalancePerUnit: 0 },
      { productId: "two", sku: "TWO", name: "Two", quantity: 1, unitPrice: 10, isPreOrder: false, isPartialDeposit: false, unitDeposit: 10, remainingBalancePerUnit: 0 }],
    subtotal: 30, discountAmount: 0, shippingCost: 0, totalChargedNow: 30, remainingBalanceLater: 0, reservationIds: [],
  };
}

describe("Persistent order/inventory connection", () => {
  it("commits a multi-product order with all reads before writes and canonical stock fields", async () => {
    const db = database({ "products/one": { stockAvailable: 5 }, "products/two": { stockAvailable: 2 } });
    const result = await db.run((transaction) => commitOrderTransaction(transaction, order()));
    expect(db.get("products/one").stockAvailable).toBe(3);
    expect(db.get("products/two").stockAvailable).toBe(1);
    expect(db.get("orders/ord-one").stockDeducted).toBe(true);
    expect(result.stockDeducted).toBe(true);
  });
  it("rolls back the whole order when any component is out of stock", async () => {
    const db = database({ "products/one": { stockAvailable: 5 }, "products/two": { stockAvailable: 0 } });
    await expect(db.run((transaction) => commitOrderTransaction(transaction, order()))).rejects.toThrow("Stock insuficiente");
    expect(db.get("products/one").stockAvailable).toBe(5);
    expect(db.get("orders/ord-one")).toBeUndefined();
  });
  it("replays the saved order without decrementing inventory again and rejects a changed request", async () => {
    const db = database({ "products/one": { stockAvailable: 5 }, "products/two": { stockAvailable: 2 } });
    const first = await db.run((transaction) => commitOrderTransaction(transaction, order()));
    expect(await db.run((transaction) => commitOrderTransaction(transaction, order()))).toEqual(first);
    expect(db.get("products/one").stockAvailable).toBe(3);
    await expect(db.run((transaction) => commitOrderTransaction(transaction, { ...order(), checkoutRequestHash: "changed" }))).rejects.toThrow();
  });
  it("aggregates direct and bundled quantities and supports restoring legacy inventory", async () => {
    const db = database({ "products/one": { stockAvailable: 10 }, "products/two": { stock: 5 },
      "products/bundle": { type: "BUNDLE", bundleComponents: [{ componentProductId: "one", quantity: 2 }, { componentProductId: "two", quantity: 1 }] } });
    const items = [{ productId: "bundle", quantity: 2 }, { productId: "one", quantity: 1 }];
    await db.run(async (transaction) => { const changes = await planStockChanges(transaction, items, -1); for (const change of changes) transaction.update(change.path, change.data); });
    expect(db.get("products/one").stockAvailable).toBe(5);
    expect(db.get("products/two").stockAvailable).toBe(3);
    expect(db.get("products/two").stock).toBe(3);
    await db.run(async (transaction) => { const changes = await planStockChanges(transaction, items, 1); for (const change of changes) transaction.update(change.path, change.data); });
    expect(db.get("products/one").stockAvailable).toBe(10);
    expect(db.get("products/two").stock).toBe(5);
  });
  it("rejects missing products, circular bundles and invalid quantities", async () => {
    const db = database({ "products/loop": { type: "BUNDLE", bundleComponents: [{ componentProductId: "loop", quantity: 1 }] } });
    for (const item of [{ productId: "missing", quantity: 1 }, { productId: "loop", quantity: 1 }, { productId: "loop", quantity: -1 }]) {
      await expect(db.run((transaction) => planStockChanges(transaction, [item], -1))).rejects.toThrow();
    }
  });
  it("includes shipping, coupon and customer changes in checkout idempotency", async () => {
    const store = MemoryTransactionalStore.getInstance(); store.reset();
    const service = new CheckoutService(store);
    const request = { cartSessionId: "cart-test", userId: "demo", idempotencyKey: "test-key-123", paymentMethod: "BANK_TRANSFER" as const,
      items: [{ productId: "prod-vg-01", quantity: 1, isPartialDeposit: false }] };
    await service.processCheckout(request);
    await expect(service.processCheckout({ ...request, couponCode: "CHILE10" })).rejects.toThrow();
    expect(service.getOrderId(request.idempotencyKey)).toBe(new CheckoutService(store).getOrderId(request.idempotencyKey));
  });
  it("releases local inventory after a persistence failure and finalizes it once on success", async () => {
    const store = MemoryTransactionalStore.getInstance(); store.reset();
    const service = new CheckoutService(store);
    const request = { cartSessionId: "cart-test", userId: "demo", idempotencyKey: "test-key-456", paymentMethod: "BANK_TRANSFER" as const,
      items: [{ productId: "prod-vg-01", quantity: 1, isPartialDeposit: false }] };
    const product = store.products.get("prod-vg-01")!;
    const initial = product.stockAvailable;
    await service.processCheckout(request);
    await service.rollbackCheckout(request.idempotencyKey);
    expect(product.stockReserved).toBe(0);
    expect(product.stockAvailable).toBe(initial);
    expect(store.orders.size).toBe(0);
    const result = await service.processCheckout(request);
    const saved = { ...result.order!, stockDeducted: true };
    service.finalizePersistedOrder(saved);
    service.finalizePersistedOrder(saved);
    expect(product.stockAvailable).toBe(initial - 1);
    expect(product.stockReserved).toBe(0);
  });
});


it("cancelling and then deleting a committed order restores inventory only once", async () => {
  const db = database({ "products/one": { stockAvailable: 5 }, "products/two": { stockAvailable: 2 } });
  await db.run((transaction) => commitOrderTransaction(transaction, order()));
  await db.run((transaction) => cancelOrderTransaction(transaction, "ord-one"));
  expect(db.get("products/one").stockAvailable).toBe(5);
  expect(db.get("orders/ord-one").status).toBe("CANCELLED");
  await db.run((transaction) => cancelOrderTransaction(transaction, "ord-one", true));
  expect(db.get("products/one").stockAvailable).toBe(5);
  expect(db.get("orders/ord-one")).toBeUndefined();
});
