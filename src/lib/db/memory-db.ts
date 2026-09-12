import {
  ProductDomainEntity,
  StockReservationEntity,
  PreOrderDepositEntity,
  ConfirmedOrderEntity,
} from "../types/domain";
import { BASE_PRODUCTS } from "../constants/catalog";

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
    const now = Date.now();
    let index = 0;
    for (const raw of BASE_PRODUCTS) {
      const prod = JSON.parse(JSON.stringify(raw));
      if (!prod.createdAt) {
        // Stagger default dates from 15 to 120 days ago for realistic slow-moving stock analysis
        const daysAgo = 15 + ((index * 17) % 105);
        prod.createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      }
      index++;
      if (prod.type === "BUNDLE") {
        if (prod.id === "prod-bun-01") {
          this.products.set(prod.id, {
            ...(prod as any),
            bundleComponents: [
              {
                componentProductId: "prod-vg-01",
                sku: "VG-ELDEN-PS5",
                name: "Elden Ring PS5",
                quantity: 1,
                unitPrice: 79990,
                unitCost: 69990,
                availableStock: 25,
              },
              {
                componentProductId: "prod-acc-01",
                sku: "ACC-PIN-SET",
                name: "Elden Enamel Pin Set",
                quantity: 1,
                unitPrice: 24990,
                unitCost: 8000,
                availableStock: 50,
              },
              {
                componentProductId: "prod-acc-02",
                sku: "ACC-ARTBOOK",
                name: "Lands Between Artbook",
                quantity: 1,
                unitPrice: 44990,
                unitCost: 20000,
                availableStock: 30,
              },
            ],
          });
        } else if (prod.id === "prod-bun-02") {
          this.products.set(prod.id, {
            ...(prod as any),
            bundleComponents: [
              {
                componentProductId: "prod-vg-02",
                sku: "VG-ZELDA-TOTK",
                name: "Zelda TotK Switch",
                quantity: 1,
                unitPrice: 59990,
                unitCost: 46000,
                availableStock: 35,
              },
              {
                componentProductId: "prod-fig-02",
                sku: "FIG-LINK-NENDO",
                name: "Nendoroid Link",
                quantity: 1,
                unitPrice: 64990,
                unitCost: 42000,
                availableStock: 40,
              },
              {
                componentProductId: "prod-acc-03",
                sku: "ACC-SWORD-MASTER",
                name: "Réplica Espada Maestra Zelda",
                quantity: 1,
                unitPrice: 139990,
                unitCost: 85000,
                availableStock: 10,
              },
            ],
          });
        } else {
          this.products.set(prod.id, prod as any);
        }
      } else {
        this.products.set(prod.id, prod as any);
      }
    }
  }
}
