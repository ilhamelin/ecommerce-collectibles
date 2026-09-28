import { CustomCategoryEntity } from "@/lib/types/domain";
import { getAdminHeaders } from "@/lib/auth/security";
import {
  getCustomCategoriesFromFirestoreClient,
  saveCustomCategoryToFirestoreClient,
  deleteCustomCategoryFromFirestoreClient,
} from "@/lib/firebase/client-firestore";

const CATEGORIES_CACHE_KEY = "omnicollector_custom_categories_cache";
let inMemoryCache: CustomCategoryEntity[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds client-side cache

function mergeCategoryLists(
  primary: CustomCategoryEntity[],
  secondary: CustomCategoryEntity[]
): CustomCategoryEntity[] {
  const map = new Map<string, CustomCategoryEntity>();
  for (const item of secondary) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of primary) {
    if (item && item.id) map.set(item.id, item);
  }
  return Array.from(map.values());
}

export const categoryClient = {
  /**
   * Retrieves all custom categories from database / API with immediate resilience.
   */
  async getCategories(forceRefresh = false): Promise<CustomCategoryEntity[]> {
    const now = Date.now();
    if (!forceRefresh && inMemoryCache && inMemoryCache.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
      return inMemoryCache;
    }

    // Try localStorage if available for immediate hydration
    if (!inMemoryCache && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CATEGORIES_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryCache = parsed;
          }
        }
      } catch {}
    }

    try {
      // Parallel fetch from API and Firestore client SDK
      const [apiRes, firestoreCats] = await Promise.all([
        fetch("/api/admin/categories", {
          headers: getAdminHeaders(),
          cache: "no-store",
        })
          .then(async (res) => (res.ok ? res.json() : null))
          .catch(() => null),
        getCustomCategoriesFromFirestoreClient().catch(() => [] as CustomCategoryEntity[]),
      ]);

      const serverCats: CustomCategoryEntity[] =
        apiRes?.success && Array.isArray(apiRes.data?.categories) ? apiRes.data.categories : [];

      const combined = mergeCategoryLists(serverCats, firestoreCats);

      if (combined.length > 0 || (apiRes && apiRes.success)) {
        inMemoryCache = combined;
        lastFetchTime = Date.now();
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(inMemoryCache));
          } catch {}
        }
        return inMemoryCache;
      }
    } catch (err) {
      console.warn("[categoryClient] Could not fetch categories from server:", err);
    }

    return inMemoryCache || [];
  },

  /**
   * Saves or creates a new category in Firestore and server disk storage.
   */
  async createCategory(
    category: Omit<CustomCategoryEntity, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<{ success: boolean; category?: CustomCategoryEntity; error?: string }> {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify(category),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.category) {
        const savedCategory: CustomCategoryEntity = json.data.category;

        // Also persist directly via Firestore Client SDK
        saveCustomCategoryToFirestoreClient(savedCategory).catch((e) =>
          console.warn("[categoryClient] Client Firestore save error:", e)
        );

        // Update local memory and storage immediately
        const current = inMemoryCache || [];
        const next = [...current.filter((c) => c.id !== savedCategory.id), savedCategory];
        inMemoryCache = next;
        lastFetchTime = Date.now();

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(next));
          } catch {}
        }

        return { success: true, category: savedCategory };
      }

      return { success: false, error: json.error || "Error al crear la categoría" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error de conexión",
      };
    }
  },

  /**
   * Deletes a custom category by ID from both Firestore and server storage.
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      // 1. Delete from Server API (and disk)
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      // 2. Delete from Client Firestore SDK
      deleteCustomCategoryFromFirestoreClient(id).catch((e) =>
        console.warn("[categoryClient] Client Firestore delete error:", e)
      );

      // 3. Immediately update local cache so UI reflects deletion permanently
      if (inMemoryCache) {
        inMemoryCache = inMemoryCache.filter((c) => c.id !== id && c.slug !== id);
      }
      if (typeof window !== "undefined") {
        try {
          if (inMemoryCache) {
            localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(inMemoryCache));
          } else {
            localStorage.removeItem(CATEGORIES_CACHE_KEY);
          }
        } catch {}
      }

      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Invalidates cache so next call refreshes data.
   */
  invalidateCache() {
    inMemoryCache = null;
    lastFetchTime = 0;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CATEGORIES_CACHE_KEY);
      } catch {}
    }
  },
};

