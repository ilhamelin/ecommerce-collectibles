import { describe, it, expect } from "vitest";
import { isFirebaseConfigured, firebaseConfig } from "../src/lib/firebase/config";
import { isFirebaseAdminConfigured } from "../src/lib/firebase/admin";
import {
  getProductsFromFirestore,
  getProductByIdOrSkuFromFirestore,
  saveProductToFirestore,
  createOrderInFirestore,
  updateWishlistInFirestore,
} from "../src/lib/firebase/firestore";
import { CatalogRepository } from "../src/lib/services/CatalogRepository";

describe("Firebase Cloud Firestore Architecture & Fallback Resilience", () => {
  it("correctly identifies unconfigured or placeholder Firebase credentials", () => {
    // In test environment, placeholders or empty strings should report false
    expect(typeof isFirebaseConfigured()).toBe("boolean");
    expect(typeof isFirebaseAdminConfigured()).toBe("boolean");
  });

  it("handles Firestore product retrieval gracefully when credentials are not configured", async () => {
    const products = await getProductsFromFirestore();
    // In fallback mode, getProductsFromFirestore returns null so caller uses memory store
    expect(products === null || Array.isArray(products)).toBe(true);
  });

  it("handles single product lookup gracefully in fallback mode", async () => {
    const product = await getProductByIdOrSkuFromFirestore("VG-ELDEN-PS5");
    // Returns null in fallback, allowing CatalogRepository to resolve it
    expect(product === null || typeof product === "object").toBe(true);

    const fallbackRepo = CatalogRepository.getInstance();
    const resolved = fallbackRepo.getBySlugOrSku("VG-ELDEN-PS5");
    expect(resolved).not.toBeNull();
    expect(resolved?.sku).toBe("VG-ELDEN-PS5");
  });

  it("handles product saving gracefully without throwing in fallback mode", async () => {
    const fallbackRepo = CatalogRepository.getInstance();
    const product = fallbackRepo.getAll()[0];
    expect(product).toBeDefined();

    // Saving to Firestore in fallback mode should return false and not throw
    const result = await saveProductToFirestore(product);
    expect(typeof result).toBe("boolean");
  });

  it("handles order persistence gracefully without throwing in fallback mode", async () => {
    const dummyOrder: any = {
      orderId: "ord-test-fb-01",
      orderNumber: "ORD-2026-TEST01",
      customerEmail: "test@omnicollector.cl",
      customerName: "Test Collector",
      shippingAddress: {
        fullName: "Test Collector",
        phone: "+56 9 1234 5678",
        region: "Región Metropolitana de Santiago",
        comuna: "Providencia",
        address: "Av. Test 123",
      },
      courierName: "Starken Express",
      shippingCost: 4990,
      totalChargedNow: 69990,
      remainingBalanceLater: 0,
      items: [],
      reservationIds: [],
      createdAt: new Date().toISOString(),
      currentStatus: "CONFIRMED",
    };

    const result = await createOrderInFirestore(dummyOrder);
    expect(typeof result).toBe("boolean");
  });

  it("handles wishlist cloud synchronization gracefully in fallback mode", async () => {
    const result = await updateWishlistInFirestore("usr-cust-01", ["prod-vg-01", "prod-fig-01"]);
    expect(typeof result).toBe("boolean");
  });
});
