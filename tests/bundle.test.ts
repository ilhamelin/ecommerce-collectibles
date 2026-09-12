import { describe, it, expect, beforeEach } from "vitest";
import { MemoryTransactionalStore } from "../src/lib/db/memory-db";
import { BundleService } from "../src/lib/services/BundleService";
import { StockReservationService } from "../src/lib/services/StockReservationService";
import { InsufficientStockError } from "../src/lib/errors/DomainErrors";

describe("Dynamic Bundling Engine (Composite Pattern & Margin Compensation en CLP)", () => {
  let store: MemoryTransactionalStore;
  let bundleService: BundleService;
  let reservationService: StockReservationService;

  beforeEach(() => {
    store = MemoryTransactionalStore.getInstance();
    store.reset();
    bundleService = new BundleService(store);
    reservationService = new StockReservationService(store, bundleService);
  });

  it("should correctly compute available stock of bundle as min(available_stock / required_qty)", () => {
    const availability = bundleService.getBundleAvailability("prod-bun-01");
    expect(availability.calculatedAvailableStock).toBe(25);
    expect(availability.components).toHaveLength(3);
  });

  it("should fail atomically when one component of the bundle has zero or insufficient inventory", async () => {
    const artbook = store.products.get("prod-acc-02")!;
    artbook.stockAvailable = 0;

    const availability = bundleService.getBundleAvailability("prod-bun-01");
    expect(availability.calculatedAvailableStock).toBe(0);

    await expect(
      reservationService.reserveStockAtomic("session-cart-test-fail", [
        { productId: "prod-bun-01", quantity: 1 },
      ])
    ).rejects.toThrowError(InsufficientStockError);

    const game = store.products.get("prod-vg-01")!;
    const pins = store.products.get("prod-acc-01")!;
    expect(game.stockReserved).toBe(0);
    expect(pins.stockReserved).toBe(0);
    expect(artbook.stockReserved).toBe(0);
  });

  it("should accurately calculate aggregate gross profit, discount percentage, and runtime margin in CLP", () => {
    // Bundle price: $ 124.990 CLP
    // Nominal sum: 79990 + 24990 + 44990 = $ 149.970 CLP
    // Components cost: 69990 + 8000 + 20000 = $ 97.990 CLP
    // Gross profit: 124990 - 97990 = $ 27.000 CLP
    // Margin %: (27000 / 124990) * 100 = 21.60%
    // Discount %: ((149970 - 124990) / 149970) * 100 = 16.66%

    const availability = bundleService.getBundleAvailability("prod-bun-01");

    expect(availability.bundlePrice).toBe(124990);
    expect(availability.nominalSumOfItems).toBe(149970);
    expect(availability.totalComponentCost).toBe(97990);
    expect(availability.aggregateGrossProfit).toBe(27000);
    expect(availability.aggregateMarginPercent).toBeCloseTo(21.6, 1);
    expect(availability.bundleDiscountPercent).toBeCloseTo(16.66, 1);
    expect(availability.isViable).toBe(true);
  });

  it("should simulate parametric discounts in CLP and warn when margin becomes negative", () => {
    // Extreme discount of 40% off the nominal sum ($ 149.970 * 0.60 = $ 89.982)
    // Cost is $ 97.990 -> Gross profit will be negative
    const simulation = bundleService.simulateParametricDiscount("prod-bun-01", 40);

    expect(simulation.simulatedPrice).toBe(89982);
    expect(simulation.newGrossProfit).toBeLessThan(0);
    expect(simulation.isViable).toBe(false);
  });
});
