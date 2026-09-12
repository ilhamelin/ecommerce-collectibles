import { MemoryTransactionalStore } from "../db/memory-db";
import { StockReservationEntity } from "../types/domain";
import {
  InsufficientStockError,
  NotFoundError,
  ReservationExpiredError,
  ValidationError,
} from "../errors/DomainErrors";
import { BundleService } from "./BundleService";

export interface ReservationRequestItem {
  productId: string;
  quantity: number;
}

export interface ReservationBatchResult {
  cartSessionId: string;
  expiresAt: string;
  reservations: StockReservationEntity[];
}

export class StockReservationService {
  private store: MemoryTransactionalStore;
  private bundleService: BundleService;
  public static readonly TTL_MINUTES = 15;

  constructor(
    store: MemoryTransactionalStore = MemoryTransactionalStore.getInstance(),
    bundleService: BundleService = new BundleService(store)
  ) {
    this.store = store;
    this.bundleService = bundleService;
  }

  /**
   * Performs an atomic reservation with pessimistic locking across all requested products.
   * If a requested item is a BUNDLE, it decomposes into atomic components and locks each one.
   * All reservations receive a strict 15-minute TTL.
   */
  public async reserveStockAtomic(
    cartSessionId: string,
    items: ReservationRequestItem[]
  ): Promise<ReservationBatchResult> {
    if (!items || items.length === 0) {
      throw new ValidationError("Cannot create reservation for an empty cart.");
    }

    // Sweep any expired reservations first to ensure up-to-date availability
    this.store.sweepExpiredReservations();

    // 1. Flatten all required atomic SKUs (decomposing bundles)
    const requiredAtomicComponents = new Map<string, { productId: string; totalQty: number }>();

    for (const item of items) {
      let product = this.store.products.get(item.productId);
      if (!product) {
        product = (await this.store.getOrFetchProduct(item.productId)) || undefined;
      }
      if (!product) {
        throw new NotFoundError(`Product '${item.productId}' does not exist.`);
      }

      if (product.type === "BUNDLE") {
        // Pre-validate bundle component availability
        if (product.bundleComponents) {
          for (const comp of product.bundleComponents) {
            if (!this.store.products.has(comp.componentProductId)) {
              await this.store.getOrFetchProduct(comp.componentProductId);
            }
          }
        }
        this.bundleService.validateBundleStock(product, item.quantity);

        for (const comp of product.bundleComponents || []) {
          const current = requiredAtomicComponents.get(comp.componentProductId)?.totalQty || 0;
          requiredAtomicComponents.set(comp.componentProductId, {
            productId: comp.componentProductId,
            totalQty: current + comp.quantity * item.quantity,
          });
        }
      } else {
        const current = requiredAtomicComponents.get(product.id)?.totalQty || 0;
        requiredAtomicComponents.set(product.id, {
          productId: product.id,
          totalQty: current + item.quantity,
        });
      }
    }

    const lockKeys = Array.from(requiredAtomicComponents.keys());

    // 2. Execute within row-level transaction locks (SELECT FOR UPDATE)
    return await this.store.withRowLocks(lockKeys, async () => {
      // Verification phase under lock
      for (const [productId, req] of requiredAtomicComponents.entries()) {
        let prod = this.store.products.get(productId);
        if (!prod) {
          prod = (await this.store.getOrFetchProduct(productId)) || undefined;
        }
        if (!prod) {
          throw new NotFoundError(`Product '${productId}' does not exist.`);
        }
        const freeStock = prod.stockAvailable - prod.stockReserved;

        if (freeStock < req.totalQty) {
          throw new InsufficientStockError(
            `Insufficient stock for '${prod.name}' (${prod.sku}). Available: ${freeStock}, Requested: ${req.totalQty}`,
            {
              sku: prod.sku,
              requested: req.totalQty,
              available: freeStock,
            }
          );
        }
      }

      // Reservation phase: create 15-minute reservations and adjust stockReserved
      const expiresAtDate = new Date(Date.now() + StockReservationService.TTL_MINUTES * 60 * 1000);
      const expiresAtIso = expiresAtDate.toISOString();
      const createdReservations: StockReservationEntity[] = [];

      for (const [productId, req] of requiredAtomicComponents.entries()) {
        const prod = this.store.products.get(productId)!;
        prod.stockReserved += req.totalQty;

        const resId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const reservation: StockReservationEntity = {
          id: resId,
          cartSessionId,
          productId,
          quantity: req.totalQty,
          expiresAt: expiresAtIso,
          status: "PENDING",
          createdAt: new Date().toISOString(),
        };

        this.store.reservations.set(resId, reservation);
        createdReservations.push(reservation);
      }

      return {
        cartSessionId,
        expiresAt: expiresAtIso,
        reservations: createdReservations,
      };
    });
  }

  /**
   * Confirms reservations upon completed payment, permanently converting reserved stock into fulfilled stock
   */
  public async confirmReservations(reservationIds: string[]): Promise<void> {
    const lockKeys = reservationIds
      .map((id) => this.store.reservations.get(id)?.productId)
      .filter((id): id is string => Boolean(id));

    await this.store.withRowLocks(lockKeys, async () => {
      const now = new Date().getTime();

      for (const resId of reservationIds) {
        const res = this.store.reservations.get(resId);
        if (!res) continue;

        if (res.status === "EXPIRED" || new Date(res.expiresAt).getTime() <= now) {
          res.status = "EXPIRED";
          throw new ReservationExpiredError(resId);
        }

        if (res.status === "PENDING") {
          res.status = "CONFIRMED";
          const product = this.store.products.get(res.productId);
          if (product) {
            // Deduct from total inventory and clear reservation
            product.stockAvailable = Math.max(0, product.stockAvailable - res.quantity);
            product.stockReserved = Math.max(0, product.stockReserved - res.quantity);
          }
        }
      }
    });
  }

  /**
   * Cancels/releases reservations (e.g. user abandoned checkout)
   */
  public async releaseReservations(reservationIds: string[]): Promise<void> {
    const lockKeys = reservationIds
      .map((id) => this.store.reservations.get(id)?.productId)
      .filter((id): id is string => Boolean(id));

    await this.store.withRowLocks(lockKeys, async () => {
      for (const resId of reservationIds) {
        const res = this.store.reservations.get(resId);
        if (!res || res.status !== "PENDING") continue;

        res.status = "RELEASED";
        const product = this.store.products.get(res.productId);
        if (product) {
          product.stockReserved = Math.max(0, product.stockReserved - res.quantity);
        }
      }
    });
  }
}
