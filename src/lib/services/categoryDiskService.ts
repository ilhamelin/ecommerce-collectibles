import fs from "fs";
import path from "path";
import { CustomCategoryEntity } from "@/lib/types/domain";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const CATEGORIES_DISK_PATH = path.join(DATA_DIR, "custom_categories.json");
const DELETED_NATIVE_DISK_PATH = path.join(DATA_DIR, "deleted_native_category_ids.json");

// Ensure global singleton cache across server hot-reloads and API route boundaries
declare global {
  // eslint-disable-next-line no-var
  var __customCategoriesGlobalStore: CustomCategoryEntity[] | undefined;
  // eslint-disable-next-line no-var
  var __deletedNativeCategoriesGlobalStore: string[] | undefined;
}

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[CategoryDiskService] Error creating data directory:", err);
  }
}

/**
 * Reads all custom categories from disk storage.
 */
export function readCategoriesFromDisk(): CustomCategoryEntity[] {
  if (globalThis.__customCategoriesGlobalStore && globalThis.__customCategoriesGlobalStore.length > 0) {
    return globalThis.__customCategoriesGlobalStore;
  }

  try {
    if (fs.existsSync(CATEGORIES_DISK_PATH)) {
      const raw = fs.readFileSync(CATEGORIES_DISK_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalThis.__customCategoriesGlobalStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[CategoryDiskService] Could not read categories from disk:", err);
  }

  globalThis.__customCategoriesGlobalStore = [];
  return [];
}

/**
 * Writes the given array of custom categories to disk.
 */
export function writeCategoriesToDisk(categories: CustomCategoryEntity[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(CATEGORIES_DISK_PATH, JSON.stringify(categories, null, 2), "utf-8");
    globalThis.__customCategoriesGlobalStore = categories;
  } catch (err) {
    console.warn("[CategoryDiskService] Could not persist categories to disk:", err);
  }
}

/**
 * Upserts a custom category in disk storage.
 */
export function saveCategoryToDisk(category: CustomCategoryEntity): CustomCategoryEntity {
  const current = readCategoriesFromDisk();
  const existingIdx = current.findIndex(
    (c) => c.id === category.id || (c.slug && category.slug && c.slug === category.slug)
  );

  const updated = [...current];
  if (existingIdx >= 0) {
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...category,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated.push(category);
  }

  writeCategoriesToDisk(updated);
  return category;
}

/**
 * Deletes a custom category from disk storage.
 */
export function deleteCategoryFromDisk(id: string): boolean {
  const current = readCategoriesFromDisk();
  const filtered = current.filter((c) => c.id !== id && c.slug !== id);
  if (filtered.length !== current.length) {
    writeCategoriesToDisk(filtered);
    return true;
  }
  return false;
}

/**
 * Finds a category by ID or slug from disk storage.
 */
export function getCategoryByIdFromDisk(id: string): CustomCategoryEntity | null {
  const current = readCategoriesFromDisk();
  return current.find((c) => c.id === id || c.slug === id) || null;
}

/**
 * ============================================================================
 * NATIVE/PRE-EXISTING CATEGORY EXCLUSION & SOFT-DELETION
 * ============================================================================
 */

/**
 * Reads list of deleted/hidden native category IDs from disk storage.
 */
export function readDeletedNativeCategoriesFromDisk(): string[] {
  if (globalThis.__deletedNativeCategoriesGlobalStore) {
    return globalThis.__deletedNativeCategoriesGlobalStore;
  }

  try {
    if (fs.existsSync(DELETED_NATIVE_DISK_PATH)) {
      const raw = fs.readFileSync(DELETED_NATIVE_DISK_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        globalThis.__deletedNativeCategoriesGlobalStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[CategoryDiskService] Could not read deleted native categories:", err);
  }

  globalThis.__deletedNativeCategoriesGlobalStore = [];
  return [];
}

/**
 * Writes list of deleted/hidden native category IDs to disk.
 */
export function writeDeletedNativeCategoriesToDisk(ids: string[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DELETED_NATIVE_DISK_PATH, JSON.stringify(ids, null, 2), "utf-8");
    globalThis.__deletedNativeCategoriesGlobalStore = ids;
  } catch (err) {
    console.warn("[CategoryDiskService] Could not persist deleted native categories:", err);
  }
}

/**
 * Marks a native category as deleted on disk.
 */
export function deleteNativeCategoryOnDisk(id: string): boolean {
  const upperId = id.toUpperCase();
  const current = readDeletedNativeCategoriesFromDisk();
  if (!current.includes(upperId)) {
    const updated = [...current, upperId];
    writeDeletedNativeCategoriesToDisk(updated);
    return true;
  }
  return false;
}

/**
 * Restores a previously deleted native category on disk.
 */
export function restoreNativeCategoryOnDisk(id: string): boolean {
  const upperId = id.toUpperCase();
  const current = readDeletedNativeCategoriesFromDisk();
  const filtered = current.filter((item) => item !== upperId);
  if (filtered.length !== current.length) {
    writeDeletedNativeCategoriesToDisk(filtered);
    return true;
  }
  return false;
}

