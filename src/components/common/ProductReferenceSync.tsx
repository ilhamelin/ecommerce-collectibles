"use client";
import { useEffect } from "react";
import { catalogClient } from "@/lib/services/catalogClient";
import { useAuthStore, DEFAULT_USERS } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { removeWishlistReferencesClient } from "@/lib/firebase/client-firestore";
import { pruneOrderProductReferences } from "@/lib/services/productReferences";
import type { ProductDomainEntity } from "@/lib/types/domain";

/** Reconciles persisted browser references only after a successful authoritative read. */
export function reconcileLocalProductReferences(products: ProductDomainEntity[]) {
  const ids = new Set(products.map(product => product.id));
  const auth = useAuthStore.getState();
  const guestWishlist = auth.guestWishlist.filter(id => ids.has(id));
  if (guestWishlist.length !== auth.guestWishlist.length) useAuthStore.setState({ guestWishlist });
  if (auth.currentUser) {
    const user = auth.currentUser;
    const wishlist = (user.wishlist || []).filter(id => ids.has(id));
    const orders = pruneOrderProductReferences(user.orders || [], products);
    if (wishlist.length !== (user.wishlist || []).length || JSON.stringify(orders) !== JSON.stringify(user.orders)) {
      useAuthStore.setState({ currentUser: { ...user, wishlist, orders } });
      if (wishlist.length !== (user.wishlist || []).length) {
        void removeWishlistReferencesClient(user.id, (user.wishlist || []).filter(id => !ids.has(id))).then(saved => {
          if (!saved) console.warn("[ProductReferenceSync] Wishlist cleanup not persisted; retry on next visit.");
        });
      }
    }
  }
  for (const user of DEFAULT_USERS) {
    user.wishlist = (user.wishlist || []).filter(id => ids.has(id));
    user.orders = pruneOrderProductReferences(user.orders || [], products);
  }
  const cart = useCartStore.getState();
  const items = cart.items.filter(item => ids.has(item.productId));
  const savedForLater = cart.savedForLater.filter(item => ids.has(item.productId));
  if (items.length !== cart.items.length || savedForLater.length !== cart.savedForLater.length) {
    useCartStore.setState({ items, savedForLater });
  }
}

export function ProductReferenceSync() {
  const currentUser = useAuthStore(state => state.currentUser);
  useEffect(() => {
    let disposed = false;
    const unsubscribe = catalogClient.subscribe(products => {
      if (!disposed) reconcileLocalProductReferences(products);
    });
    const refresh = () => {
      if (document.visibilityState === "visible") void catalogClient.getCatalog(true);
    };
    void catalogClient.getCatalog(true);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { disposed = true; unsubscribe(); window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [currentUser]);
  return null;
}
