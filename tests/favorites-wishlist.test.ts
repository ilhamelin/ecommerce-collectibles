import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../src/lib/store/authStore";

describe("OmniCollector Favorites / Wishlist System", () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isAdmin: false,
      guestWishlist: [],
    });
  });

  describe("1. User Account Linked Wishlist", () => {
    beforeEach(() => {
      // Login as demo customer
      useAuthStore.getState().login("cliente@omnicollector.cl", "cliente123");
    });

    it("adds a new product to the logged-in customer's wishlist", () => {
      const store = useAuthStore.getState();
      const initialCount = store.currentUser?.wishlist.length || 0;
      const testProdId = "prod-new-test-01";

      const res = store.toggleWishlist(testProdId);

      expect(res.isWishlisted).toBe(true);
      expect(res.message).toContain("guardado en tus favoritos");

      const updated = useAuthStore.getState().currentUser;
      expect(updated?.wishlist.length).toBe(initialCount + 1);
      expect(updated?.wishlist).toContain(testProdId);
    });

    it("removes an already wishlisted product when toggled again", () => {
      const store = useAuthStore.getState();
      const testProdId = "prod-toggle-test";

      // Add it
      store.toggleWishlist(testProdId);
      expect(useAuthStore.getState().currentUser?.wishlist).toContain(testProdId);

      // Remove it
      const res = store.toggleWishlist(testProdId);
      expect(res.isWishlisted).toBe(false);
      expect(res.message).toContain("eliminado de tus favoritos");
      expect(useAuthStore.getState().currentUser?.wishlist).not.toContain(testProdId);
    });

    it("correctly identifies whether a product is wishlisted with isProductWishlisted", () => {
      const store = useAuthStore.getState();
      const prodA = "prod-test-a";
      const prodB = "prod-test-b";

      store.toggleWishlist(prodA);

      expect(store.isProductWishlisted(prodA)).toBe(true);
      expect(store.isProductWishlisted(prodB)).toBe(false);
    });

    it("clears all wishlisted items when clearWishlist is invoked", () => {
      const store = useAuthStore.getState();
      store.toggleWishlist("prod-1");
      store.toggleWishlist("prod-2");
      expect((useAuthStore.getState().currentUser?.wishlist || []).length).toBeGreaterThan(0);

      store.clearWishlist();
      expect(useAuthStore.getState().currentUser?.wishlist).toEqual([]);
    });
  });

  describe("2. Guest Wishlist & Seamless Account Merging", () => {
    it("allows unauthenticated guests to store favorites in guestWishlist", () => {
      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);

      const res = store.toggleWishlist("prod-guest-item-1");
      expect(res.isWishlisted).toBe(true);

      const state = useAuthStore.getState();
      expect(state.guestWishlist).toContain("prod-guest-item-1");
      expect(state.isProductWishlisted("prod-guest-item-1")).toBe(true);
    });

    it("merges guest wishlist items into user account upon login without duplicates", () => {
      const store = useAuthStore.getState();

      // Guest likes two items
      store.toggleWishlist("prod-guest-01");
      store.toggleWishlist("prod-guest-02");
      expect(useAuthStore.getState().guestWishlist.length).toBe(2);

      // User logs in
      store.login("cliente@omnicollector.cl", "cliente123");

      const loggedState = useAuthStore.getState();
      expect(loggedState.isAuthenticated).toBe(true);
      expect(loggedState.guestWishlist).toEqual([]);
      expect(loggedState.currentUser?.wishlist).toContain("prod-guest-01");
      expect(loggedState.currentUser?.wishlist).toContain("prod-guest-02");
    });

    it("preserves guest wishlist when creating a new account via register", () => {
      const store = useAuthStore.getState();
      store.toggleWishlist("prod-fig-makima");

      const newEmail = `nuevo-fav-${Date.now()}@coleccionista.cl`;
      store.register({
        fullName: "Coleccionista Nuevo",
        email: newEmail,
        password: "passwordSegura2026",
      });

      const registeredState = useAuthStore.getState();
      expect(registeredState.isAuthenticated).toBe(true);
      expect(registeredState.currentUser?.wishlist).toContain("prod-fig-makima");
      expect(registeredState.guestWishlist).toEqual([]);
    });
  });
});
