import type { ProductDomainEntity } from "../types/domain";

/**
 * Configuration options for catalog client cache
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * In-memory client cache to prevent redundant HTTP roundtrips across components
 * (StoreNavbar, Catalog, Product Detail, RelatedProductsSlider).
 */
let memoryCatalogCache: CacheEntry<ProductDomainEntity[]> | null = null;
let inFlightCatalogPromise: Promise<ProductDomainEntity[]> | null = null;

const DEFAULT_TTL_MS = 30_000; // 30 seconds fresh cache

/**
 * Centralized client catalog service implementing:
 * 1. Request Deduplication: Merges concurrent network requests into a single promise.
 * 2. In-Memory Micro-Caching: Serves cached records during navigation without re-fetching.
 * 3. Controlled Invalidation: Allows immediate cache busts upon product mutation.
 */
export const catalogClient = {
  /**
   * Retrieves the full product catalog.
   * If an active request is already in-flight, it joins it rather than issuing a duplicate fetch.
   *
   * @param forceFresh - If true, bypasses the local memory cache
   * @param ttlMs - Time-to-live in milliseconds for cached results (default: 30s)
   */
  async getCatalog(forceFresh = false, ttlMs = DEFAULT_TTL_MS): Promise<ProductDomainEntity[]> {
    const now = Date.now();

    // 1. Serve from fresh memory cache if valid
    if (!forceFresh && memoryCatalogCache && now - memoryCatalogCache.timestamp < ttlMs) {
      return memoryCatalogCache.data;
    }

    // 2. Join in-flight network request if one is currently pending
    if (inFlightCatalogPromise) {
      return inFlightCatalogPromise;
    }

    // 3. Issue deduplicated network request
    inFlightCatalogPromise = (async (): Promise<ProductDomainEntity[]> => {
      try {
        const queryParam = forceFresh ? `?fresh=true&_t=${now}` : "";
        const res = await fetch(`/api/products${queryParam}`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Catalog fetch failed with HTTP ${res.status}`);
        }

        const data = (await res.json()) as {
          success: boolean;
          data?: { products: ProductDomainEntity[] };
        };

        if (!data.success || !Array.isArray(data.data?.products)) {
          throw new Error("Invalid payload format received from /api/products");
        }

        const products = data.data.products;

        // Update local memory cache
        memoryCatalogCache = {
          data: products,
          timestamp: Date.now(),
        };

        return products;
      } catch (err: unknown) {
        console.warn("[catalogClient] Error fetching catalog:", err);
        // If fetch fails but we have stale cache, return stale as resilient fallback
        if (memoryCatalogCache) {
          return memoryCatalogCache.data;
        }
        return [];
      } finally {
        inFlightCatalogPromise = null;
      }
    })();

    return inFlightCatalogPromise;
  },

  /**
   * Finds a product by SKU, ID, or slug from the cached catalog first.
   * If not cached or not found, falls back to targeted single-item API query.
   *
   * @param identifier - Sku, id, or slug of the product
   */
  async getProductByIdentifier(identifier: string): Promise<ProductDomainEntity | null> {
    if (!identifier || identifier.trim() === "") return null;
    const clean = identifier.toLowerCase().trim();

    // 1. Check current memory cache first
    if (memoryCatalogCache) {
      const match = memoryCatalogCache.data.find(
        (p) =>
          p.sku.toLowerCase() === clean ||
          p.id.toLowerCase() === clean ||
          p.sku.toLowerCase().replace(/_/g, "-") === clean
      );
      if (match) return match;
    }

    // 2. If not found in cache, fetch catalog or direct item
    try {
      const all = await this.getCatalog();
      const match = all.find(
        (p) =>
          p.sku.toLowerCase() === clean ||
          p.id.toLowerCase() === clean ||
          p.sku.toLowerCase().replace(/_/g, "-") === clean
      );
      if (match) return match;

      // Direct fallback by SKU
      const res = await fetch(`/api/products?sku=${encodeURIComponent(identifier)}`);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        success: boolean;
        data?: { product?: ProductDomainEntity };
      };
      return data.success && data.data?.product ? data.data.product : null;
    } catch {
      return null;
    }
  },

  /**
   * Clears the in-memory cache to force a fresh fetch on the next call.
   * Call this immediately after creating, updating, or deleting a product.
   */
  invalidateCache(): void {
    memoryCatalogCache = null;
    inFlightCatalogPromise = null;
  },
};
