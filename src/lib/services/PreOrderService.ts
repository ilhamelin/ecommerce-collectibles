import { MemoryTransactionalStore } from "../db/memory-db";
import {
  PreOrderDepositEntity,
  PreOrderDepositStatus,
  PreOrderState,
  ProductDomainEntity,
} from "../types/domain";
import {
  DepositCalculationError,
  NotFoundError,
  PreOrderStateError,
  ValidationError,
} from "../errors/DomainErrors";

export interface PreOrderCreationParams {
  orderId: string;
  userId: string;
  productId: string;
  isPartialDeposit: boolean;
  depositPercentRequested?: number;
}

export interface WebhookNotificationPayload {
  eventType: "PREORDER_WAREHOUSE_ARRIVED";
  productId: string;
  productSku: string;
  productName: string;
  affectedDepositsCount: number;
  notifications: Array<{
    depositId: string;
    orderId: string;
    userId: string;
    remainingBalance: number;
    settlementDeadline: string;
    settlementPaymentUrl: string;
  }>;
}

export class PreOrderService {
  private store: MemoryTransactionalStore;

  // Canonical valid state transitions
  private readonly validTransitions: Record<PreOrderState, PreOrderState[]> = {
    ANNOUNCED: ["PREORDER_OPEN"],
    PREORDER_OPEN: ["MANUFACTURING", "ANNOUNCED"],
    MANUFACTURING: ["IN_TRANSIT_CUSTOMS"],
    IN_TRANSIT_CUSTOMS: ["WAREHOUSE_RECEIVED"],
    WAREHOUSE_RECEIVED: ["FULFILLED"],
    FULFILLED: [],
  };

  constructor(store: MemoryTransactionalStore = MemoryTransactionalStore.getInstance()) {
    this.store = store;
  }

  /**
   * Evaluates if a product can currently accept customer pre-orders.
   */
  public assertCanAcceptPreOrder(product: ProductDomainEntity): void {
    if (!product.isPreOrder) {
      throw new ValidationError(`Product '${product.sku}' is not configured as a pre-order item.`);
    }

    if (product.preOrderState !== "PREORDER_OPEN") {
      throw new PreOrderStateError(
        `Pre-orders for '${product.name}' (${product.sku}) are not currently open. Current state is '${product.preOrderState}'.`,
        { current: product.preOrderState || "NONE", expected: "PREORDER_OPEN" }
      );
    }
  }

  /**
   * Calculates required deposit amount, remaining balance, and validates minimum percentage constraints
   */
  public calculateDepositTerms(
    product: ProductDomainEntity,
    isPartialDeposit: boolean,
    requestedPercent?: number
  ): { depositAmount: number; remainingBalance: number; depositPercent: number } {
    const totalPrice = product.price;

    if (!isPartialDeposit) {
      return {
        depositAmount: Number(totalPrice.toFixed(2)),
        remainingBalance: 0.0,
        depositPercent: 1.0,
      };
    }

    // Determine minimum allowed deposit (default 20% for figures or specialty items)
    const minAllowedPercent = product.figureMetadata?.minimumDepositPercent ?? 0.2;
    const effectivePercent = requestedPercent ?? minAllowedPercent;

    if (effectivePercent < minAllowedPercent) {
      throw new DepositCalculationError(
        `Requested deposit of ${(effectivePercent * 100).toFixed(0)}% is below the required minimum of ${(minAllowedPercent * 100).toFixed(0)}% for product '${product.name}'.`,
        { minimumRequired: minAllowedPercent, provided: effectivePercent }
      );
    }

    const depositAmount = Number((totalPrice * effectivePercent).toFixed(2));
    const remainingBalance = Number((totalPrice - depositAmount).toFixed(2));

    return {
      depositAmount,
      remainingBalance,
      depositPercent: effectivePercent,
    };
  }

  /**
   * Registers a new Pre-Order deposit record in the domain
   */
  public createPreOrderDeposit(params: PreOrderCreationParams): PreOrderDepositEntity {
    const product = this.store.products.get(params.productId);
    if (!product) {
      throw new NotFoundError(`Product '${params.productId}' not found.`);
    }

    this.assertCanAcceptPreOrder(product);

    const terms = this.calculateDepositTerms(
      product,
      params.isPartialDeposit,
      params.depositPercentRequested
    );

    const depositId = `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newDeposit: PreOrderDepositEntity = {
      id: depositId,
      orderId: params.orderId,
      productId: params.productId,
      userId: params.userId,
      totalProductPrice: product.price,
      depositAmountPaid: terms.depositAmount,
      remainingBalance: terms.remainingBalance,
      status: terms.remainingBalance > 0 ? "PARTIALLY_PAID" : "PAID_IN_FULL",
      dueDate: terms.remainingBalance > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };

    this.store.preOrderDeposits.set(depositId, newDeposit);
    return newDeposit;
  }

  /**
   * Transitions a product's pre-order state across the lifecycle.
   * If transitioning to WAREHOUSE_RECEIVED, triggers automatic settlement notifications.
   */
  public transitionState(
    productId: string,
    newState: PreOrderState
  ): { product: ProductDomainEntity; webhookEvent?: WebhookNotificationPayload } {
    const product = this.store.products.get(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found.`);
    }

    const currentState = product.preOrderState;
    if (!currentState) {
      throw new PreOrderStateError(`Product '${product.sku}' does not have an active pre-order lifecycle.`);
    }

    const allowed = this.validTransitions[currentState];
    if (!allowed.includes(newState)) {
      throw new PreOrderStateError(
        `Illegal pre-order transition for '${product.sku}' from '${currentState}' to '${newState}'. Allowed next states: [${allowed.join(", ")}]`,
        { current: currentState, expected: allowed }
      );
    }

    product.preOrderState = newState;

    let webhookEvent: WebhookNotificationPayload | undefined;

    // Critical Business Event: WAREHOUSE_RECEIVED
    // When stock arrives at physical warehouse, trigger settlement on pending deposits
    if (newState === "WAREHOUSE_RECEIVED") {
      webhookEvent = this.handleWarehouseArrival(product);
    }

    return { product, webhookEvent };
  }

  /**
   * Processes all pending partial deposits when products arrive at the warehouse
   */
  private handleWarehouseArrival(product: ProductDomainEntity): WebhookNotificationPayload {
    const now = new Date();
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day payment window
    const notifications: WebhookNotificationPayload["notifications"] = [];

    for (const deposit of this.store.preOrderDeposits.values()) {
      if (deposit.productId === product.id && deposit.status === "PARTIALLY_PAID") {
        deposit.status = "BALANCE_DUE";
        deposit.dueDate = deadline.toISOString();
        deposit.warehouseArrivalNotifiedAt = now.toISOString();

        notifications.push({
          depositId: deposit.id,
          orderId: deposit.orderId,
          userId: deposit.userId,
          remainingBalance: deposit.remainingBalance,
          settlementDeadline: deadline.toISOString(),
          settlementPaymentUrl: `https://collectibles.store/checkout/settle/${deposit.id}`,
        });
      }
    }

    return {
      eventType: "PREORDER_WAREHOUSE_ARRIVED",
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      affectedDepositsCount: notifications.length,
      notifications,
    };
  }

  /**
   * Settles the pending balance of a pre-order deposit prior to dispatch
   */
  public settleRemainingBalance(depositId: string, paymentAmount: number): PreOrderDepositEntity {
    const deposit = this.store.preOrderDeposits.get(depositId);
    if (!deposit) {
      throw new NotFoundError(`Pre-order deposit '${depositId}' not found.`);
    }

    if (deposit.status === "PAID_IN_FULL") {
      throw new ValidationError(`Deposit '${depositId}' is already paid in full.`);
    }

    if (paymentAmount < deposit.remainingBalance) {
      throw new ValidationError(
        `Payment amount of $${paymentAmount.toFixed(2)} is insufficient to clear remaining balance of $${deposit.remainingBalance.toFixed(2)}.`
      );
    }

    deposit.depositAmountPaid += deposit.remainingBalance;
    deposit.remainingBalance = 0;
    deposit.status = "PAID_IN_FULL";

    return deposit;
  }
}
