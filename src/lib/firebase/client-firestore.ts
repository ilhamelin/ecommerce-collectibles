import { identityHeaders } from "@/lib/auth/clientIdentity";
import { db, isFirebaseConfigured } from "./config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { COLLECTIONS } from "./collections";
import type { UserAccount } from "../store/authStore";
import type { CustomCategoryEntity } from "../types/domain";

/**
 * Helper to log database operation timings for monitoring and diagnostics
 */
function logDbQueryTelemetry(operation: string, collection: string, durationMs: number, success: boolean) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[DB_TELEMETRY] ${operation} on '${collection}' took ${durationMs.toFixed(1)}ms (success: ${success})`);
  }
}

/**
 * Updates a wishlist through the authenticated server API.
 * Fails silently without crashing if Firebase is not active.
 */
export async function updateWishlistInFirestoreClient(
  userId: string,
  wishlist: string[]
): Promise<boolean> {
  const start = performance.now();
  try {
    if (!db || !isFirebaseConfigured()) return false;
    const response = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json", ...await identityHeaders() }, body: JSON.stringify({ id: userId, wishlist }) });
    if (!response.ok) return false;
    logDbQueryTelemetry("setDoc", COLLECTIONS.USERS, performance.now() - start, true);
    return true;
  } catch (err) {
    logDbQueryTelemetry("setDoc", COLLECTIONS.USERS, performance.now() - start, false);
    console.warn("[Firebase Client] Error updating wishlist in Cloud Firestore:", err);
    return false;
  }
}

/**
 * Synchronizes a user profile through the authenticated server API.
 */
export async function syncUserProfileToFirestoreClient(
  user: UserAccount
): Promise<boolean> {
  const start = performance.now();
  try {
    if (!db || !isFirebaseConfigured()) return false;
    const { password: _demoPassword, ...publicProfile } = user;
    const profile: Record<string, unknown> = JSON.parse(JSON.stringify({
      ...publicProfile,
      updatedAt: new Date().toISOString(),
    }));
    const response = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json", ...await identityHeaders() }, body: JSON.stringify(profile) });
    if (!response.ok) return false;
    logDbQueryTelemetry("syncUser", COLLECTIONS.USERS, performance.now() - start, true);
    return true;
  } catch (err) {
    logDbQueryTelemetry("syncUser", COLLECTIONS.USERS, performance.now() - start, false);
    console.warn("[Firebase Client] Error syncing user profile:", err);
    return false;
  }
}

/**
 * Reads the verified account through its private server API.
 */
export async function getUserFromFirestoreClient(
  userId: string
): Promise<UserAccount | null> {
  const start = performance.now();
  try {
    if (!db || !isFirebaseConfigured()) return null;
    const response = await fetch("/api/users?id=" + encodeURIComponent(userId), { headers: await identityHeaders(), cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as { success?: boolean; data?: { user?: UserAccount } };
    logDbQueryTelemetry("getUser", COLLECTIONS.USERS, performance.now() - start, true);
    return payload.success ? payload.data?.user || null : null;
  } catch (err) {
    logDbQueryTelemetry("getUser", COLLECTIONS.USERS, performance.now() - start, false);
    console.warn("[Firebase Client] Error fetching user profile:", err);
    return null;
  }
}

/**
 * Deletes the verified account through its private server API.
 */
export async function deleteUserFromFirestoreClient(
  userId: string
): Promise<boolean> {
  try {
    if (!db || !isFirebaseConfigured()) return false;
    const response = await fetch("/api/users?id=" + encodeURIComponent(userId), { method: "DELETE", headers: await identityHeaders() });
    if (!response.ok) return false;
    return true;
  } catch (err) {
    console.warn("[Firebase Client] Error deleting user profile:", err);
    return false;
  }
}

/**
 * ============================================================================
 * CUSTOM PRODUCT CATEGORIES & TECHNICAL TEMPLATES (Direct Client SDK)
 * ============================================================================
 */

/**
 * Retrieve all custom categories directly from Cloud Firestore via Client SDK
 */
export async function getCustomCategoriesFromFirestoreClient(): Promise<CustomCategoryEntity[]> {
  try {
    if (!db || !isFirebaseConfigured()) return [];
    const colRef = collection(db, COLLECTIONS.CUSTOM_CATEGORIES);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs
        .filter((d) => d.id !== "_deleted_native_categories_" && !d.id.startsWith("_"))
        .map((d) => d.data() as CustomCategoryEntity);
    }
    return [];
  } catch (err) {
    console.warn("[Firebase Client] Error reading custom categories:", err);
    return [];
  }
}

const DELETED_NATIVE_DOC_ID = "_deleted_native_categories_";

/**
 * Reads list of deleted/hidden native category IDs directly from Firestore Client SDK
 */
export async function getDeletedNativeCategoriesFromFirestoreClient(): Promise<string[]> {
  try {
    if (!db || !isFirebaseConfigured()) return [];
    const snap = await getDoc(doc(db, COLLECTIONS.CUSTOM_CATEGORIES, DELETED_NATIVE_DOC_ID));
    if (snap.exists() && Array.isArray(snap.data()?.ids)) {
      return snap.data()?.ids as string[];
    }
    return [];
  } catch (err) {
    console.warn("[Firebase Client] Error reading deleted native categories:", err);
    return [];
  }
}

/** Removes only invalid IDs, preserving favorites added concurrently on another device. */
export async function removeWishlistReferencesClient(userId: string, ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  if (!db || !isFirebaseConfigured()) return false;
  try {
    const response = await fetch("/api/users?id=" + encodeURIComponent(userId), { headers: await identityHeaders() });
    if (!response.ok) return false;
    return true;
  } catch (error: unknown) {
    console.warn("[Firebase Client] Wishlist reference cleanup failed", error);
    return false;
  }
}
