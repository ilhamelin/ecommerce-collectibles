import { describe, it, expect, beforeEach } from "vitest";
import { MemoryTransactionalStore } from "../src/lib/db/memory-db";
import { PreOrderService } from "../src/lib/services/PreOrderService";
import { DepositCalculationError, PreOrderStateError } from "../src/lib/errors/DomainErrors";

describe("Pre-orders Engine (Scale Figures, Partial Deposits & Remaining Balance in CLP)", () => {
  let store: MemoryTransactionalStore;
  let preOrderService: PreOrderService;

  beforeEach(() => {
    store = MemoryTransactionalStore.getInstance();
    store.reset();
    preOrderService = new PreOrderService(store);
  });

  it("should calculate correct balance owed and deposit on 20% partial deposit for Makima 1/7 figure in CLP", () => {
    // Makima Figure price: $ 249.990 CLP, minimum deposit: 20%
    const figure = store.products.get("prod-fig-01")!;
    expect(figure.figureMetadata?.scale).toBe("SCALE_1_7");

    const terms = preOrderService.calculateDepositTerms(figure, true, 0.2);

    // 249990 * 0.20 = 49998 CLP
    expect(terms.depositAmount).toBe(49998);
    // 249990 - 49998 = 199992 CLP
    expect(terms.remainingBalance).toBe(199992);
    expect(terms.depositPercent).toBe(0.2);
  });

  it("should calculate correct balance owed on 30% partial deposit for Nendoroid Link in CLP", () => {
    // Nendoroid Link price: $ 64.990 CLP, minimum deposit: 30%
    const link = store.products.get("prod-fig-02")!;
    link.preOrderState = "PREORDER_OPEN";

    const terms = preOrderService.calculateDepositTerms(link, true, 0.3);

    // 64990 * 0.30 = 19497 CLP
    expect(terms.depositAmount).toBe(19497);
    // 64990 - 19497 = 45493 CLP
    expect(terms.remainingBalance).toBe(45493);
  });

  it("should reject deposit attempts lower than the minimum allowed percentage", () => {
    const figure = store.products.get("prod-fig-01")!;
    expect(figure.figureMetadata?.minimumDepositPercent).toBe(0.2);

    expect(() => {
      preOrderService.calculateDepositTerms(figure, true, 0.1);
    }).toThrowError(DepositCalculationError);
  });

  it("should reject pre-order creation when product is not in PREORDER_OPEN state", () => {
    const link = store.products.get("prod-fig-02")!;
    expect(link.preOrderState).toBe("MANUFACTURING");

    expect(() => {
      preOrderService.assertCanAcceptPreOrder(link);
    }).toThrowError(PreOrderStateError);
  });

  it("should emit automated webhook notification when arriving at WAREHOUSE_RECEIVED and set status to BALANCE_DUE", () => {
    const deposit = preOrderService.createPreOrderDeposit({
      orderId: "ord-test-makima-clp",
      userId: "user-chile-collector",
      productId: "prod-fig-01",
      isPartialDeposit: true,
      depositPercentRequested: 0.2,
    });

    expect(deposit.status).toBe("PARTIALLY_PAID");
    expect(deposit.remainingBalance).toBe(199992);

    preOrderService.transitionState("prod-fig-01", "MANUFACTURING");
    preOrderService.transitionState("prod-fig-01", "IN_TRANSIT_CUSTOMS");

    const { product, webhookEvent } = preOrderService.transitionState(
      "prod-fig-01",
      "WAREHOUSE_RECEIVED"
    );

    expect(product.preOrderState).toBe("WAREHOUSE_RECEIVED");
    expect(webhookEvent).toBeDefined();
    expect(webhookEvent?.eventType).toBe("PREORDER_WAREHOUSE_ARRIVED");
    expect(webhookEvent?.affectedDepositsCount).toBe(1);

    const notification = webhookEvent?.notifications[0];
    expect(notification?.orderId).toBe("ord-test-makima-clp");
    expect(notification?.remainingBalance).toBe(199992);

    const updatedDeposit = store.preOrderDeposits.get(deposit.id)!;
    expect(updatedDeposit.status).toBe("BALANCE_DUE");
    expect(updatedDeposit.warehouseArrivalNotifiedAt).toBeDefined();

    // Settle balance in CLP
    const settled = preOrderService.settleRemainingBalance(deposit.id, 199992);
    expect(settled.status).toBe("PAID_IN_FULL");
    expect(settled.remainingBalance).toBe(0);
    expect(settled.depositAmountPaid).toBe(249990);
  });
});
