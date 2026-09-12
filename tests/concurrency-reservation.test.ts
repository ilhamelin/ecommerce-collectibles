import { describe, it, expect, beforeEach } from "vitest";
import { MemoryTransactionalStore } from "../src/lib/db/memory-db";
import { StockReservationService } from "../src/lib/services/StockReservationService";
import { CheckoutService } from "../src/lib/services/CheckoutService";
import { InsufficientStockError } from "../src/lib/errors/DomainErrors";

describe("Checkout Concurrency, Overselling Prevention & 15-Min TTL", () => {
  let store: MemoryTransactionalStore;
  let reservationService: StockReservationService;
  let checkoutService: CheckoutService;

  beforeEach(() => {
    store = MemoryTransactionalStore.getInstance();
    store.reset();
    reservationService = new StockReservationService(store);
    checkoutService = new CheckoutService(store, reservationService);
  });

  it("should prevent overselling when multiple concurrent transactions compete for a single certified piece (Charizard PSA 9)", async () => {
    // Only 1 Charizard PSA 9 exists
    const charizard = store.products.get("prod-col-01")!;
    expect(charizard.stockAvailable).toBe(1);

    // Simulate 5 buyers hitting the checkout button at the exact same millisecond
    const buyerSessions = [
      "session-buyer-alpha",
      "session-buyer-beta",
      "session-buyer-gamma",
      "session-buyer-delta",
      "session-buyer-epsilon",
    ];

    const results = await Promise.allSettled(
      buyerSessions.map((sessionId) =>
        reservationService.reserveStockAtomic(sessionId, [
          { productId: "prod-col-01", quantity: 1 },
        ])
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly 1 winner
    expect(successful).toHaveLength(1);
    // Exactly 4 buyers blocked with InsufficientStockError
    expect(rejected).toHaveLength(4);

    rejected.forEach((rej) => {
      if (rej.status === "rejected") {
        expect(rej.reason).toBeInstanceOf(InsufficientStockError);
      }
    });

    // Verify stockReserved is 1 and free stock is 0
    expect(charizard.stockReserved).toBe(1);
    expect(charizard.stockAvailable - charizard.stockReserved).toBe(0);
  });

  it("should automatically restore available inventory when 15-minute TTL expires", async () => {
    const game = store.products.get("prod-vg-01")!;
    const initialFreeStock = game.stockAvailable - game.stockReserved;

    // Reserve 5 copies
    const batch = await reservationService.reserveStockAtomic("cart-abandoned", [
      { productId: "prod-vg-01", quantity: 5 },
    ]);

    expect(game.stockReserved).toBe(5);
    expect(game.stockAvailable - game.stockReserved).toBe(initialFreeStock - 5);

    // Fast-forward time past 15-minute TTL (16 minutes later)
    const futureTime = new Date(Date.now() + 16 * 60 * 1000);
    const sweptCount = store.sweepExpiredReservations(futureTime);

    expect(sweptCount).toBe(1);

    // Stock reserved should be released back to 0
    expect(game.stockReserved).toBe(0);
    expect(game.stockAvailable - game.stockReserved).toBe(initialFreeStock);
  });

  it("should ensure idempotency on checkout when using Idempotency-Key header", async () => {
    const idempotencyKey = "idem-key-prod-order-unique-998877";

    const payload = {
      cartSessionId: "session-unique-checkout-1",
      userId: "user-buyer-101",
      idempotencyKey,
      paymentMethod: "STRIPE" as const,
      items: [
        {
          productId: "prod-vg-01",
          quantity: 2,
          isPartialDeposit: false,
        },
      ],
    };

    // First checkout request
    const firstResult = await checkoutService.processCheckout(payload);
    expect(firstResult.orderNumber).toBeDefined();

    // Check stock reserved after first request
    const game = store.products.get("prod-vg-01")!;
    const reservedAfterFirst = game.stockReserved;
    expect(reservedAfterFirst).toBe(2);

    // Duplicate checkout request (retry with same Idempotency-Key)
    const secondResult = await checkoutService.processCheckout(payload);

    // Results must be identical
    expect(secondResult.orderId).toBe(firstResult.orderId);
    expect(secondResult.orderNumber).toBe(firstResult.orderNumber);
    expect(secondResult.totalAmountChargedNow).toBe(firstResult.totalAmountChargedNow);

    // Crucial check: stockReserved must NOT be decremented twice!
    expect(game.stockReserved).toBe(reservedAfterFirst);
  });
});
