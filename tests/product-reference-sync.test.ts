import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/firebase/client-firestore", () => ({ removeWishlistReferencesClient: vi.fn().mockResolvedValue(true),
  updateWishlistInFirestoreClient: vi.fn(), syncUserProfileToFirestoreClient: vi.fn(),
  deleteUserFromFirestoreClient: vi.fn(), getUserFromFirestoreClient: vi.fn() }));
import { removeWishlistReferencesClient } from "@/lib/firebase/client-firestore";
import { reconcileLocalProductReferences } from "@/components/common/ProductReferenceSync";
import { pruneOrderProductReferences, createProductReferenceIndex } from "@/lib/services/productReferences";
import { catalogClient } from "@/lib/services/catalogClient";
import { useAuthStore, DEFAULT_USERS } from "@/lib/store/authStore";
import { useCartStore, CartItem } from "@/lib/store/cartStore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { CheckoutService } from "@/lib/services/CheckoutService";
import type { ConfirmedOrderEntity } from "@/lib/types/domain";

function fixture() {
  const store = MemoryTransactionalStore.getInstance(); store.reset();
  const products = [...store.products.values()].filter(p => p.type !== "BUNDLE").slice(0, 2);
  const result = new CheckoutService(store).processCheckout({ idempotencyKey: "reference-test", userId: "reference-user", cartSessionId: "reference-test",
    customerInfo: { fullName: "Demo", email: "demo@example.com", phone: "12345678" },
    shippingAddress: { region: "RM", comuna: "Santiago", address: "Demo 123" },
    items: products.map(p => ({ productId: p.id, quantity: 1, isPartialDeposit: false })),
    shippingMethod: { name: "Retiro", carrier: "PICKUP", cost: 0 }, paymentMethod: "BANK_TRANSFER" });
  return { products, result, store };
}
beforeEach(() => { vi.clearAllMocks(); catalogClient.invalidateCache(); });
describe("Deleted product references", () => {
  it("prunes mixed orders without changing their financial amounts or original ledger", async () => {
    const { products, result } = fixture(); const order = (await result).order!;
    const view = pruneOrderProductReferences([order], [products[0]]);
    expect(view[0].items).toHaveLength(1);
    expect(view[0].totalChargedNow).toBe(order.totalChargedNow);
    expect(order.items).toHaveLength(2);
    expect(pruneOrderProductReferences([order], [])).toEqual([]);
  });
  it("does not revive deleted IDs through a reused SKU", async () => {
    const { products, result } = fixture(); await result; const index = createProductReferenceIndex(products);
    expect(index.has({ productId: "deleted", sku: products[0].sku })).toBe(false);
    expect(index.has({ productSku: products[0].sku })).toBe(true);
  });
  it("cleans current and guest favorites, cart and saved items, persisting only removed IDs", async () => {
    const { products, result } = fixture(); const order = (await result).order!;
    useAuthStore.setState({ currentUser: { ...DEFAULT_USERS[0], wishlist: [products[0].id, products[1].id], orders: [order] },
      guestWishlist: [products[0].id, products[1].id] });
    const items: CartItem[] = products.map(product => ({ id: product.id, productId: product.id, sku: product.sku,
      name: product.name, type: product.type, quantity: 1, unitPrice: product.price, unitCost: 0,
      isPreOrder: false, isPartialDeposit: false, depositPercent: 0, unitDeposit: product.price, remainingBalancePerUnit: 0 }));
    useCartStore.setState({ items, savedForLater: items });
    reconcileLocalProductReferences([products[0]]);
    expect(useAuthStore.getState().currentUser?.wishlist).toEqual([products[0].id]);
    expect(useAuthStore.getState().guestWishlist).toEqual([products[0].id]);
    expect(useAuthStore.getState().currentUser?.orders[0].items).toHaveLength(1);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().savedForLater).toHaveLength(1);
    expect(removeWishlistReferencesClient).toHaveBeenCalledWith(DEFAULT_USERS[0].id, [products[1].id]);
    reconcileLocalProductReferences([]);
    expect(useAuthStore.getState().currentUser?.orders).toEqual([]);
    expect(useCartStore.getState().items).toEqual([]);
  });
  it("a network failure never publishes a deletion snapshot", async () => {
    const listener = vi.fn(); const unsubscribe = catalogClient.subscribe(listener);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await catalogClient.getCatalog(true);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe(); vi.unstubAllGlobals();
  });
  it("a successful empty catalog does publish a cleanup snapshot", async () => {
    const listener = vi.fn(); const unsubscribe = catalogClient.subscribe(listener);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { products: [] } }) }));
    await catalogClient.getCatalog(true);
    expect(listener).toHaveBeenCalledWith([]);
    unsubscribe(); vi.unstubAllGlobals();
  });
});
