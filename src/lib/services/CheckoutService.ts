import { FREE_SHIPPING_THRESHOLD_CLP, DEFAULT_SHIPPING_FEE_CLP } from "@/lib/constants/shipping";
import { MemoryTransactionalStore } from "../db/memory-db";
import { CheckoutRequestDTO } from "../validations/schemas";
import { CheckoutResult, ConfirmedOrderEntity } from "../types/domain";
import { StockReservationService } from "./StockReservationService";
import { PreOrderService } from "./PreOrderService";
import {
  IdempotencyConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/DomainErrors";
import crypto from "crypto";

export class CheckoutService {
  private store: MemoryTransactionalStore;
  private reservationService: StockReservationService;
  private preOrderService: PreOrderService;

  constructor(
    store: MemoryTransactionalStore = MemoryTransactionalStore.getInstance(),
    reservationService: StockReservationService = new StockReservationService(store),
    preOrderService: PreOrderService = new PreOrderService(store)
  ) {
    this.store = store;
    this.reservationService = reservationService;
    this.preOrderService = preOrderService;
  }

  /**
   * Generates a deterministic hash of the request body for idempotency validation
   */
  public computeRequestHash(payload: unknown): string {
    return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  /** Finalize local reservations only after the persistent transaction succeeds. */
  public finalizePersistedOrder(order: ConfirmedOrderEntity): void {
    const localOrder = this.store.orders.get(order.id);
    if (localOrder?.stockDeducted) return;
    for (const id of order.reservationIds) {
      const reservation = this.store.reservations.get(id);
      if (!reservation) continue;
      const product = this.store.products.get(reservation.productId);
      if (product) {
        product.stockAvailable = Math.max(0, product.stockAvailable - reservation.quantity);
        product.stockReserved = Math.max(0, product.stockReserved - reservation.quantity);
      }
      reservation.status = "CONFIRMED";
    }
    this.store.orders.set(order.id, order);
  }

  public restoreLocalOrderInventory(order: ConfirmedOrderEntity): void {
    if (!order.stockDeducted) return;
    for (const id of order.reservationIds) {
      const reservation = this.store.reservations.get(id);
      if (reservation?.status !== "CONFIRMED") continue;
      const product = this.store.products.get(reservation.productId);
      if (product) product.stockAvailable += reservation.quantity;
      reservation.status = "RELEASED";
    }
  }

  public async rollbackCheckout(idempotencyKey: string): Promise<void> {
    const orderId = this.getOrderId(idempotencyKey);
    const order = this.store.orders.get(orderId);
    if (order?.stockDeducted) return;
    if (order) {
      for (const id of order.reservationIds) {
        const reservation = this.store.reservations.get(id);
        if (reservation?.status === "CONFIRMED") reservation.status = "PENDING";
      }
      await this.reservationService.releaseReservations(order.reservationIds);
    }
    for (const [id, deposit] of this.store.preOrderDeposits) {
      if (deposit.orderId === orderId) this.store.preOrderDeposits.delete(id);
    }
    this.store.orders.delete(orderId);
    this.store.idempotencyKeys.delete(idempotencyKey);
  }

  public getOrderId(idempotencyKey: string): string {
    return `ord-${this.computeRequestHash(idempotencyKey).slice(0, 32)}`;
  }

  /** Calculate checkout terms and reserve local stock; persistence commits the final inventory movement. */
  public async processCheckout(request: CheckoutRequestDTO): Promise<CheckoutResult> {
    const { idempotencyKey, cartSessionId, userId, items } = request;
    const requestHash = this.computeRequestHash({ ...request, idempotencyKey: undefined });

    // 1. Idempotency Verification
    const existingRecord = this.store.idempotencyKeys.get(idempotencyKey);
    if (existingRecord) {
      if (existingRecord.hash !== requestHash) throw new IdempotencyConflictError(idempotencyKey);
      if (existingRecord.status === "IN_PROGRESS") {
        throw new IdempotencyConflictError(idempotencyKey);
      }
      if (existingRecord.status === "COMPLETED" && existingRecord.body) {
        const cached = JSON.parse(existingRecord.body) as CheckoutResult;
        cached.order = this.store.orders.get(cached.orderId) || cached.order;
        return cached;
      }
    }

    // Register idempotency key as IN_PROGRESS
    this.store.idempotencyKeys.set(idempotencyKey, {
      key: idempotencyKey,
      hash: requestHash,
      status: "IN_PROGRESS",
      createdAt: Date.now(),
    });

    let reservedIds: string[] = [];
    try {
      // 2. Atomic Stock Reservation (15-min TTL)
      const reservationBatch = await this.reservationService.reserveStockAtomic(
        cartSessionId,
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );

      reservedIds = reservationBatch.reservations.map((reservation) => reservation.id);
      const orderId = this.getOrderId(idempotencyKey);
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      let totalAmountChargedNow = 0;
      let remainingBalanceLater = 0;
      const orderItemsDetail: ConfirmedOrderEntity["items"] = [];

      // 3. Process Pricing & Pre-Order terms per item, and deduct stock
      for (const item of items) {
        let product = this.store.products.get(item.productId);
        if (!product) {
          product = (await this.store.getOrFetchProduct(item.productId)) || undefined;
        }
        if (!product) {
          throw new NotFoundError(`Product '${item.productId}' not found.`);
        }

        let unitDeposit = product.price;
        let remainingBalancePerUnit = 0;

        if (product.isPreOrder) {
          // Pre-order calculations
          const terms = this.preOrderService.calculateDepositTerms(
            product,
            Boolean(item.isPartialDeposit),
            item.customDepositPercent
          );

          unitDeposit = terms.depositAmount;
          remainingBalancePerUnit = terms.remainingBalance;

          totalAmountChargedNow += terms.depositAmount * item.quantity;
          remainingBalanceLater += terms.remainingBalance * item.quantity;

          // Register deposit record
          this.preOrderService.createPreOrderDeposit({
            orderId,
            userId,
            productId: product.id,
            isPartialDeposit: Boolean(item.isPartialDeposit),
            depositPercentRequested: item.customDepositPercent,
          });
        } else {
          // Standard in-stock product or bundle
          totalAmountChargedNow += product.price * item.quantity;
        }

        // In-memory order tracking
        orderItemsDetail.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          isPreOrder: product.isPreOrder,
          isPartialDeposit: Boolean(item.isPartialDeposit),
          unitDeposit,
          remainingBalancePerUnit,
          imageUrl: product.imageUrl || (product.images && product.images[0]),
        });
      }

      // Mark reservations as confirmed
      for (const res of reservationBatch.reservations) {
        res.status = "CONFIRMED";
      }

      // 4. Calculate coupon discounts if applicable
      const subtotal = totalAmountChargedNow;
      let discountAmount = 0;
      if (request.couponCode) {
        const code = request.couponCode.trim().toUpperCase();
        if (code === "COLECCIONISTA5K") {
          discountAmount = Math.min(totalAmountChargedNow, 5000);
        } else if (code === "CHILE10") {
          discountAmount = Math.round(totalAmountChargedNow * 0.1);
        }
      }

      totalAmountChargedNow = Math.max(0, totalAmountChargedNow - discountAmount);

      // 5. Shipping calculation
      const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_CLP || request.couponCode?.toUpperCase() === "MINTFREE";
      let shippingCost = isFreeShipping ? 0 : DEFAULT_SHIPPING_FEE_CLP;
      if (request.shippingMethod?.cost !== undefined) {
        shippingCost = isFreeShipping ? 0 : request.shippingMethod.cost;
      }
      totalAmountChargedNow += shippingCost;

      // 6. Generate Courier Tracking Number
      const carrier = request.shippingMethod?.carrier || "STARKEN";
      const trackingNumber =
        carrier === "CHILEXPRESS"
          ? `CHX-${Math.floor(1000000 + Math.random() * 9000000)}`
          : `STK-CHL-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const customerInfo: ConfirmedOrderEntity["customer"] = {
        fullName: request.customerInfo?.fullName || "Coleccionista Invitado",
        email: request.customerInfo?.email || "contacto@cliente.cl",
        phone: request.customerInfo?.phone || "+56 9 8765 4321",
        rut: request.customerInfo?.rut || "",
        region: request.shippingAddress?.region || "Región Metropolitana",
        comuna: request.shippingAddress?.comuna || "Santiago",
        address: request.shippingAddress?.address || "Av. Providencia 1234",
        apartment: request.shippingAddress?.apartment,
        notes: request.shippingAddress?.notes,
      };

      const confirmedOrder: ConfirmedOrderEntity = {
        id: orderId,
        checkoutRequestHash: requestHash,
        orderNumber,
        createdAt: new Date().toISOString(),
        status: "CONFIRMED",
        customer: customerInfo,
        shippingMethod: {
          name: request.shippingMethod?.name || "Starken Express (1 a 2 días)",
          cost: shippingCost,
          estimatedDelivery: "2 días hábiles en Chile",
          trackingNumber,
        },
        paymentMethod: request.paymentMethod,
        items: orderItemsDetail,
        subtotal,
        discountAmount,
        couponCode: request.couponCode,
        shippingCost,
        totalChargedNow: Number(totalAmountChargedNow.toFixed(2)),
        remainingBalanceLater: Number(remainingBalanceLater.toFixed(2)),
        reservationIds: reservationBatch.reservations.map((r) => r.id),
      };

      // Store the confirmed order in memory
      this.store.orders.set(orderId, confirmedOrder);

      const result: CheckoutResult = {
        orderId,
        orderNumber,
        totalAmountChargedNow: Number(totalAmountChargedNow.toFixed(2)),
        remainingBalanceLater: Number(remainingBalanceLater.toFixed(2)),
        reservationIds: reservationBatch.reservations.map((r) => r.id),
        expiresAt: reservationBatch.expiresAt,
        trackingNumber,
        order: confirmedOrder,
      };

      // 7. Update idempotency state to COMPLETED
      this.store.idempotencyKeys.set(idempotencyKey, {
        key: idempotencyKey,
        hash: requestHash,
        status: "COMPLETED",
        statusCode: 200,
        body: JSON.stringify(result),
        createdAt: Date.now(),
      });

      return result;
    } catch (error) {
      for (const id of reservedIds) {
        const reservation = this.store.reservations.get(id);
        if (reservation?.status === "CONFIRMED") reservation.status = "PENDING";
      }
      await this.reservationService.releaseReservations(reservedIds);
      await this.rollbackCheckout(idempotencyKey);
      // Mark idempotency key as FAILED so client can retry with same key
      this.store.idempotencyKeys.set(idempotencyKey, {
        key: idempotencyKey,
        hash: requestHash,
        status: "FAILED",
        createdAt: Date.now(),
      });
      throw error;
    }
  }
}
