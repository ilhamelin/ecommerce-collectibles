import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, computeItemFinance } from "../src/lib/store/cartStore";

describe("Storefront B2C Mixed Cart & CLP Calculations (Zustand)", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.setState({ isOpen: false });
  });

  it("should accurately compute financial terms in CLP for partial deposit vs full payment", () => {
    // Makima Figure: $ 249.990 CLP, 20% deposit
    const partialTerms = computeItemFinance(249990, true, 0.2);
    expect(partialTerms.unitDeposit).toBe(49998);
    expect(partialTerms.remainingBalancePerUnit).toBe(199992);

    const fullTerms = computeItemFinance(249990, false, 1.0);
    expect(fullTerms.unitDeposit).toBe(249990);
    expect(fullTerms.remainingBalancePerUnit).toBe(0);
  });

  it("should calculate correct mixed cart totals in CLP: (1 Video Game + 1 Pre-order Figure + 1 Bundle)", () => {
    const store = useCartStore.getState();

    // 1. Add Video Game (In-Stock: $ 79.990 CLP full payment)
    store.addItem({
      productId: "prod-vg-01",
      sku: "VG-ELDEN-PS5",
      name: "Elden Ring PS5",
      type: "VIDEO_GAME",
      quantity: 1,
      unitPrice: 79990,
      unitCost: 69990,
      isPreOrder: false,
      isPartialDeposit: false,
      depositPercent: 1.0,
    });

    // 2. Add Figure Pre-order (20% deposit on $ 249.990 CLP = $ 49.998 CLP today, $ 199.992 CLP later)
    store.addItem({
      productId: "prod-fig-01",
      sku: "FIG-MAKIMA-17",
      name: "Makima 1/7 Scale Figure",
      type: "FIGURE",
      quantity: 1,
      unitPrice: 249990,
      unitCost: 160000,
      isPreOrder: true,
      isPartialDeposit: true,
      depositPercent: 0.2,
      customDepositPercent: 0.2,
    });

    // 3. Add Composite Bundle ($ 124.990 CLP full payment)
    store.addItem({
      productId: "prod-bun-01",
      sku: "BUN-ELDEN-MASTER",
      name: "Elden Lord Master Bundle",
      type: "BUNDLE",
      quantity: 1,
      unitPrice: 124990,
      unitCost: 97990,
      isPreOrder: false,
      isPartialDeposit: false,
      depositPercent: 1.0,
    });

    const totals = store.getTotals();

    // Verification:
    // Due Today = 79.990 + 49.998 + 124.990 = 254.978 CLP
    expect(totals.totalDueToday).toBe(254978);

    // Deferred Due Later = 199.992 CLP
    expect(totals.totalDeferredDueLater).toBe(199992);

    // Nominal Order Value = 79.990 + 249.990 + 124.990 = 454.970 CLP
    expect(totals.totalNominalOrderValue).toBe(454970);

    // Item Count = 3
    expect(totals.totalItemCount).toBe(3);
  });

  it("should reactively update totals when toggling pre-order deposit mode between partial and full in CLP", () => {
    const store = useCartStore.getState();

    store.addItem({
      productId: "prod-fig-01",
      sku: "FIG-MAKIMA-17",
      name: "Makima 1/7 Scale Figure",
      type: "FIGURE",
      quantity: 1,
      unitPrice: 249990,
      unitCost: 160000,
      isPreOrder: true,
      isPartialDeposit: true,
      depositPercent: 0.2,
    });

    const initialItem = useCartStore.getState().items[0];
    expect(initialItem.isPartialDeposit).toBe(true);
    expect(useCartStore.getState().getTotals().totalDueToday).toBe(49998);
    expect(useCartStore.getState().getTotals().totalDeferredDueLater).toBe(199992);

    // Toggle to Full Payment mode
    store.toggleDepositMode(initialItem.id);

    const toggledItem = useCartStore.getState().items[0];
    expect(toggledItem.isPartialDeposit).toBe(false);
    expect(useCartStore.getState().getTotals().totalDueToday).toBe(249990);
    expect(useCartStore.getState().getTotals().totalDeferredDueLater).toBe(0);
  });

  it("should handle quantity updates and item removals properly in CLP", () => {
    const store = useCartStore.getState();

    store.addItem({
      productId: "prod-fig-02",
      sku: "FIG-LINK-NENDO",
      name: "Nendoroid Link",
      type: "FIGURE",
      quantity: 1,
      unitPrice: 64990,
      unitCost: 42000,
      isPreOrder: true,
      isPartialDeposit: true,
      depositPercent: 0.3, // 30% deposit ($ 19.497 CLP today, $ 45.493 CLP later)
    });

    const itemId = useCartStore.getState().items[0].id;

    // Increase quantity to 3
    store.updateQuantity(itemId, 3);
    const totalsQty3 = useCartStore.getState().getTotals();

    // 19497 * 3 = 58491 CLP
    expect(totalsQty3.totalDueToday).toBe(58491);
    // 45493 * 3 = 136479 CLP
    expect(totalsQty3.totalDeferredDueLater).toBe(136479);
    expect(totalsQty3.totalItemCount).toBe(3);

    // Remove item
    store.removeItem(itemId);
    const totalsEmpty = useCartStore.getState().getTotals();
    expect(totalsEmpty.totalItemCount).toBe(0);
    expect(totalsEmpty.totalDueToday).toBe(0);
    expect(totalsEmpty.totalDeferredDueLater).toBe(0);
  });
});
