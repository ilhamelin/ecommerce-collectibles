import { db, isFirebaseConfigured } from "./config";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { COLLECTIONS } from "./collections";
import type { UserAccount } from "../store/authStore";
import type { ProductDomainEntity } from "../types/domain";

/**
 * Helper to log database operation timings for monitoring and diagnostics
 */
function logDbQueryTelemetry(operation: string, collection: string, durationMs: number, success: boolean) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[DB_TELEMETRY] ${operation} on '${collection}' took ${durationMs.toFixed(1)}ms (success: ${success})`);
  }
}

/**
 * Updates a user's wishlist in Firestore using the Client SDK.
 * Fails silently without crashing if Firebase is not active.
 */
export async function updateWishlistInFirestoreClient(
  userId: string,
  wishlist: string[]
): Promise<boolean> {
  const start = performance.now();
  try {
    if (!db || !isFirebaseConfigured()) return false;
    await setDoc(doc(db, COLLECTIONS.USERS, userId), { wishlist }, { merge: true });
    logDbQueryTelemetry("setDoc", COLLECTIONS.USERS, performance.now() - start, true);
    return true;
  } catch (err) {
    logDbQueryTelemetry("setDoc", COLLECTIONS.USERS, performance.now() - start, false);
    console.warn("[Firebase Client] Error updating wishlist in Cloud Firestore:", err);
    return false;
  }
}

/**
 * Synchronizes user profile to Firestore using the Client SDK.
 */
export async function syncUserProfileToFirestoreClient(
  user: UserAccount
): Promise<boolean> {
  const start = performance.now();
  try {
    if (!db || !isFirebaseConfigured()) return false;
    const profile = {
      ...user,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), profile, { merge: true });
    logDbQueryTelemetry("syncUser", COLLECTIONS.USERS, performance.now() - start, true);
    return true;
  } catch (err) {
    logDbQueryTelemetry("syncUser", COLLECTIONS.USERS, performance.now() - start, false);
    console.warn("[Firebase Client] Error syncing user profile:", err);
    return false;
  }
}

/**
 * Get user profile directly from Firestore using the Client SDK.
 */
export async function getUserFromFirestoreClient(
  userId: string
): Promise<UserAccount | null> {
  const start = performance.now();
  try {
    if (!db || !isFirebaseConfigured()) return null;
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    logDbQueryTelemetry("getUser", COLLECTIONS.USERS, performance.now() - start, true);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (err) {
    logDbQueryTelemetry("getUser", COLLECTIONS.USERS, performance.now() - start, false);
    console.warn("[Firebase Client] Error fetching user profile:", err);
    return null;
  }
}

/**
 * Delete a user account directly from Firestore using the Client SDK.
 */
export async function deleteUserFromFirestoreClient(
  userId: string
): Promise<boolean> {
  try {
    if (!db || !isFirebaseConfigured()) return false;
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    return true;
  } catch (err) {
    console.warn("[Firebase Client] Error deleting user profile:", err);
    return false;
  }
}

/**
 * Delete a product directly from Firestore using the Client SDK.
 */
export async function deleteProductFromFirestoreClient(
  productId: string
): Promise<boolean> {
  try {
    if (!db || !isFirebaseConfigured()) return false;
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    return true;
  } catch (err) {
    console.warn("[Firebase Client] Error deleting product:", err);
    return false;
  }
}

/**
 * Save or update a product in Cloud Firestore using the Client SDK.
 * Used as a fallback when the server runtime does not have Firebase Admin keys configured.
 */
export async function saveProductToFirestoreClient(
  product: ProductDomainEntity
): Promise<boolean> {
  try {
    if (!db || !isFirebaseConfigured()) return false;

    // Ensure nested sub-metadata has proper productId references
    if (product.gameMetadata && !product.gameMetadata.productId) {
      product.gameMetadata.productId = product.id;
    }
    if (product.figureMetadata && !product.figureMetadata.productId) {
      product.figureMetadata.productId = product.id;
    }
    if (product.collectibleMetadata && !product.collectibleMetadata.productId) {
      product.collectibleMetadata.productId = product.id;
    }

    // Ensure category label consistency
    if (product.type === "VIDEO_GAME" && product.customCategoryLabel?.toUpperCase().includes("CONSOLA")) {
      product.customCategoryLabel = "Videojuegos";
    }

    // Strip undefined values to prevent Firestore unsupported field errors
    const cleanProduct = JSON.parse(JSON.stringify(product));
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), cleanProduct, { merge: true });
    return true;
  } catch (err) {
    console.warn("[Firebase Client] Error syncing product to Cloud Firestore:", err);
    return false;
  }
}
