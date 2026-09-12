import { db, isFirebaseConfigured } from "./config";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { COLLECTIONS } from "./collections";
import type { UserAccount } from "../store/authStore";

/**
 * Updates a user's wishlist in Firestore using the Client SDK.
 * Fails silently without crashing if Firebase is not active.
 */
export async function updateWishlistInFirestoreClient(
  userId: string,
  wishlist: string[]
): Promise<boolean> {
  try {
    if (!db || !isFirebaseConfigured()) return false;
    await setDoc(doc(db, COLLECTIONS.USERS, userId), { wishlist }, { merge: true });
    return true;
  } catch (err) {
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
  try {
    if (!db || !isFirebaseConfigured()) return false;
    const profile = {
      ...user,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), profile, { merge: true });
    return true;
  } catch (err) {
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
  try {
    if (!db || !isFirebaseConfigured()) return null;
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }
    return null;
  } catch (err) {
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
