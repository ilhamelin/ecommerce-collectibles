import {
  ProductDomainEntity,
  StockReservationEntity,
  PreOrderDepositEntity,
  ConfirmedOrderEntity,
} from "../types/domain";
import { TEST_MOCK_PRODUCTS } from "../constants/testProducts";

export interface StoredIdempotencyRecord {
  key: string;
  hash: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  statusCode?: number;
  body?: string;
  createdAt: number;
}

/**
 * High-performance In-Memory Transactional Store with Chilean Peso (CLP) values.
 */
export class MemoryTransactionalStore {
  private static instance: MemoryTransactionalStore;

  public products: Map<string, ProductDomainEntity> = new Map();
  public reservations: Map<string, StockReservationEntity> = new Map();
  public preOrderDeposits: Map<string, PreOrderDepositEntity> = new Map();
  public idempotencyKeys: Map<string, StoredIdempotencyRecord> = new Map();
  public orders: Map<string, ConfirmedOrderEntity> = new Map();

  private locks: Map<string, Promise<void>> = new Map();

  private constructor() {
    this.seedDefaultProducts();
  }

  public static getInstance(): MemoryTransactionalStore {
    if (!MemoryTransactionalStore.instance) {
      MemoryTransactionalStore.instance = new MemoryTransactionalStore();
    }
    return MemoryTransactionalStore.instance;
  }

  public reset(): void {
    this.products.clear();
    this.reservations.clear();
    this.preOrderDeposits.clear();
    this.idempotencyKeys.clear();
    this.orders.clear();
    this.locks.clear();
    this.seedDefaultProducts();
  }

  public async withRowLocks<T>(resourceIds: string[], operation: () => Promise<T>): Promise<T> {
    const sortedIds = [...resourceIds].sort();
    const releaseFns: Array<() => void> = [];

    for (const id of sortedIds) {
      while (this.locks.has(id)) {
        await this.locks.get(id);
      }
      let releaseLock!: () => void;
      const lockPromise = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      this.locks.set(id, lockPromise);
      releaseFns.push(() => {
        this.locks.delete(id);
        releaseLock();
      });
    }

    try {
      return await operation();
    } finally {
      while (releaseFns.length > 0) {
        const release = releaseFns.pop();
        if (release) release();
      }
    }
  }

  public sweepExpiredReservations(currentTime: Date = new Date()): number {
    let sweptCount = 0;
    const nowMs = currentTime.getTime();

    for (const reservation of this.reservations.values()) {
      if (reservation.status === "PENDING" && new Date(reservation.expiresAt).getTime() <= nowMs) {
        reservation.status = "EXPIRED";
        const product = this.products.get(reservation.productId);
        if (product) {
          product.stockReserved = Math.max(0, product.stockReserved - reservation.quantity);
        }
        sweptCount++;
      }
    }
    return sweptCount;
  }

  /**
   * Retrieves a product by ID or SKU from memory; if not present, fetches from Cloud Firestore
   * and caches it in the memory store, including any composite bundle components.
   */
  public async getOrFetchProduct(idOrSku: string): Promise<ProductDomainEntity | null> {
    if (!idOrSku) return null;
    const raw = idOrSku.trim();
    const clean = raw.toLowerCase();

    // 1. Direct key match in Map
    let prod = this.products.get(raw);
    if (prod) return prod;

    // 2. In-memory scan by SKU, ID, or slug
    prod = Array.from(this.products.values()).find(
      (p) => p.id.toLowerCase() === clean || p.sku.toLowerCase() === clean
    );
    if (prod) return prod;

    // 3. Fallback: Query Cloud Firestore
    try {
      const { getProductByIdOrSkuFromFirestore } = await import("../firebase/firestore");
      const fromFirestore = await getProductByIdOrSkuFromFirestore(raw);
      if (fromFirestore) {
        this.products.set(fromFirestore.id, fromFirestore);

        // If it's a composite bundle, recursively ensure all atomic components are loaded
        if (fromFirestore.type === "BUNDLE" && fromFirestore.bundleComponents) {
          for (const comp of fromFirestore.bundleComponents) {
            if (!this.products.has(comp.componentProductId)) {
              const compProd = await getProductByIdOrSkuFromFirestore(comp.componentProductId);
              if (compProd) {
                this.products.set(compProd.id, compProd);
              }
            }
          }
        }
        return fromFirestore;
      }
    } catch (err) {
      console.warn("[MemoryTransactionalStore] Error fetching product from Firestore:", err);
    }

    return null;
  }

  /**
   * Synchronizes all products from Cloud Firestore into the in-memory transactional store.
   */
  public async syncAllFromFirestore(): Promise<void> {
    try {
      const { getProductsFromFirestore } = await import("../firebase/firestore");
      const all = await getProductsFromFirestore();
      if (all && all.length > 0) {
        for (const prod of all) {
          const existing = this.products.get(prod.id);
          if (existing) {
            this.products.set(prod.id, {
              ...prod,
              stockReserved: existing.stockReserved,
            });
          } else {
            this.products.set(prod.id, prod);
          }
        }
      }
    } catch (err) {
      console.warn("[MemoryTransactionalStore] Error syncing all from Firestore:", err);
    }
  }

  public seedDefaultProducts(): void {
    this.products.clear();
    // In production and development, catalog is populated live from Cloud Firestore.
    // In unit test environment (NODE_ENV === 'test'), seed isolated test mocks.
    if (process.env.NODE_ENV === "test") {
      for (const item of TEST_MOCK_PRODUCTS) {
        this.products.set(item.id, JSON.parse(JSON.stringify(item)));
      }
    }
  }
}
