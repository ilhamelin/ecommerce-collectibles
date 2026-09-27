import { CustomCategoryEntity } from "@/lib/types/domain";
import { getAdminHeaders } from "@/lib/auth/security";

const CATEGORIES_CACHE_KEY = "omnicollector_custom_categories_cache";
let inMemoryCache: CustomCategoryEntity[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds client-side cache

export const categoryClient = {
  /**
   * Retrieves all custom categories, using memory/local storage cache first.
   */
  async getCategories(forceRefresh = false): Promise<CustomCategoryEntity[]> {
    const now = Date.now();
    if (!forceRefresh && inMemoryCache && now - lastFetchTime < CACHE_TTL_MS) {
      return inMemoryCache;
    }

    // Try localStorage if available
    if (!forceRefresh && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CATEGORIES_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && !inMemoryCache) {
            inMemoryCache = parsed;
          }
        }
      } catch {}
    }

    try {
      const res = await fetch("/api/admin/categories", {
        headers: getAdminHeaders(),
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.categories) {
          inMemoryCache = json.data.categories;
          lastFetchTime = Date.now();
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(inMemoryCache));
            } catch {}
          }
          return inMemoryCache || [];
        }
      }
    } catch (err) {
      console.warn("[categoryClient] Could not fetch categories from server:", err);
    }

    return inMemoryCache || [];
  },

  /**
   * Saves or creates a new category.
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
        this.invalidateCache();
        return { success: true, category: json.data.category };
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
   * Deletes a custom category by ID.
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        this.invalidateCache();
        return true;
      }
      return false;
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
