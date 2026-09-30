import { CustomCategoryEntity } from "@/lib/types/domain";
import { getAdminHeaders } from "@/lib/auth/security";
import {
  getCustomCategoriesFromFirestoreClient,
  saveCustomCategoryToFirestoreClient,
  deleteCustomCategoryFromFirestoreClient,
  getDeletedNativeCategoriesFromFirestoreClient,
  saveDeletedNativeCategoriesToFirestoreClient,
} from "@/lib/firebase/client-firestore";

export const NATIVE_CATEGORY_IDS = [
  "FIGURE",
  "VIDEO_GAME",
  "COLLECTIBLE",
  "CONSOLE",
  "HARDWARE",
  "GAMING_ACCESSORY",
  "APPAREL",
  "BOOK",
  "MERCH",
  "AUDIO",
  "BUNDLE",
] as const;

const CATEGORIES_CACHE_KEY = "omnicollector_custom_categories_cache";
const DELETED_NATIVE_CACHE_KEY = "omnicollector_deleted_native_categories_cache";
const CATEGORIES_EVENT = "omnicollector_categories_changed";
let inMemoryCache: CustomCategoryEntity[] | null = null;
let inMemoryDeletedNative: string[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds client-side cache

const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.warn("[categoryClient] Error in category change listener:", e);
    }
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CATEGORIES_EVENT));
    } catch {}
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === CATEGORIES_CACHE_KEY || e.key === DELETED_NATIVE_CACHE_KEY) {
      inMemoryCache = null;
      inMemoryDeletedNative = null;
      notifyListeners();
    }
  });
}

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

      if (apiRes?.success && Array.isArray(apiRes.data?.deletedNativeCategories)) {
        inMemoryDeletedNative = apiRes.data.deletedNativeCategories;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              DELETED_NATIVE_CACHE_KEY,
              JSON.stringify(apiRes.data.deletedNativeCategories)
            );
          } catch {}
        }
      }

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
   * Retrieves list of deleted/hidden native categories from server / Firestore.
   */
  async getDeletedNativeCategories(forceRefresh = false): Promise<string[]> {
    if (!forceRefresh && inMemoryDeletedNative && inMemoryDeletedNative.length >= 0) {
      return inMemoryDeletedNative;
    }

    if (!inMemoryDeletedNative && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(DELETED_NATIVE_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            inMemoryDeletedNative = parsed;
          }
        }
      } catch {}
    }

    try {
      const [apiRes, firestoreIds] = await Promise.all([
        fetch("/api/admin/categories", {
          headers: getAdminHeaders(),
          cache: "no-store",
        })
          .then(async (res) => (res.ok ? res.json() : null))
          .catch(() => null),
        getDeletedNativeCategoriesFromFirestoreClient().catch(() => [] as string[]),
      ]);

      const serverIds: string[] =
        apiRes?.success && Array.isArray(apiRes.data?.deletedNativeCategories)
          ? apiRes.data.deletedNativeCategories
          : [];

      const combined = Array.from(new Set([...serverIds, ...firestoreIds, ...(inMemoryDeletedNative || [])]));
      inMemoryDeletedNative = combined;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(DELETED_NATIVE_CACHE_KEY, JSON.stringify(combined));
        } catch {}
      }
      return combined;
    } catch (err) {
      console.warn("[categoryClient] Error fetching deleted native categories:", err);
    }

    return inMemoryDeletedNative || [];
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

        notifyListeners();
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
   * Deletes a category by ID (supporting both custom and pre-existing native categories).
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const upperId = id.toUpperCase();
      const isNative = (NATIVE_CATEGORY_IDS as readonly string[]).includes(upperId);

      if (isNative) {
        // 1. Delete/hide native category via Server API
        const res = await fetch(`/api/admin/categories/${upperId}`, {
          method: "DELETE",
          headers: getAdminHeaders(),
        });

        // 2. Persist to Firestore Client SDK
        const current = inMemoryDeletedNative || [];
        const next = Array.from(new Set([...current, upperId]));
        inMemoryDeletedNative = next;

        saveDeletedNativeCategoriesToFirestoreClient(next).catch((e) =>
          console.warn("[categoryClient] Firestore save deleted native error:", e)
        );

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(DELETED_NATIVE_CACHE_KEY, JSON.stringify(next));
          } catch {}
        }

        notifyListeners();
        return res.ok;
      }

      // Custom category deletion
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

      notifyListeners();
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Restores a previously deleted/hidden native category.
   */
  async restoreNativeCategory(id: string): Promise<boolean> {
    try {
      const upperId = id.toUpperCase();
      const res = await fetch(`/api/admin/categories/${upperId}?restore=true`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      const current = inMemoryDeletedNative || [];
      const next = current.filter((item) => item !== upperId);
      inMemoryDeletedNative = next;

      saveDeletedNativeCategoriesToFirestoreClient(next).catch((e) =>
        console.warn("[categoryClient] Firestore save restored native error:", e)
      );

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(DELETED_NATIVE_CACHE_KEY, JSON.stringify(next));
        } catch {}
      }

      notifyListeners();
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Subscribes to category updates across components.
   */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Invalidates cache so next call refreshes data.
   */
  invalidateCache() {
    inMemoryCache = null;
    inMemoryDeletedNative = null;
    lastFetchTime = 0;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CATEGORIES_CACHE_KEY);
        localStorage.removeItem(DELETED_NATIVE_CACHE_KEY);
      } catch {}
    }
    notifyListeners();
  },
};

