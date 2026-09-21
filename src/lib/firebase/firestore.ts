import { adminDb, isFirebaseAdminConfigured } from "./admin";
import { db, isFirebaseConfigured } from "./config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { ProductDomainEntity, ConfirmedOrderEntity } from "../types/domain";
import { UserAccount } from "../store/authStore";

import { COLLECTIONS } from "./collections";

/**
 * ============================================================================
 * PRODUCT OPERATIONS (Dual Client & Admin Support)
 * ============================================================================
 */

/**
 * In-memory TTL Cache to optimize requests between domain and Firestore,
 * preventing redundant queries under concurrent web traffic.
 */
let productsCache: { data: ProductDomainEntity[]; cachedAt: number } | null = null;
const PRODUCTS_CACHE_TTL_MS = 2000; // 2 seconds micro-cache

export function invalidateProductsCache() {
  productsCache = null;
}

/**
 * Fetch all products from Firestore if available. Returns null if Firebase is not active.
 */
export async function getProductsFromFirestore(bypassCache = false): Promise<ProductDomainEntity[] | null> {
  // Check memory cache first
  if (!bypassCache && productsCache && Date.now() - productsCache.cachedAt < PRODUCTS_CACHE_TTL_MS) {
    return productsCache.data;
  }

  try {
    let result: ProductDomainEntity[] | null = null;

    // 1. Check Server Admin SDK first
    if (typeof window === "undefined" && adminDb) {
      const snapshot = await adminDb.collection(COLLECTIONS.PRODUCTS).get();
      if (!snapshot.empty) {
        result = snapshot.docs.map((doc) => doc.data() as ProductDomainEntity);
      }
    }

    // 2. Check Client SDK
    if (!result && db && isFirebaseConfigured()) {
      const colRef = collection(db, COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        result = snapshot.docs.map((doc) => doc.data() as ProductDomainEntity);
      }
    }

    if (result) {
      productsCache = { data: result, cachedAt: Date.now() };
      return result;
    }

    if ((typeof window === "undefined" && adminDb) || (db && isFirebaseConfigured())) {
      return [];
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error reading products, using fallback store:", err);
    return null;
  }
}

/**
 * Find product by ID, SKU or slug in Firestore.
 */
export async function getProductByIdOrSkuFromFirestore(
  identifier: string
): Promise<ProductDomainEntity | null> {
  try {
    if (!identifier) return null;
    const rawId = identifier.trim();
    const clean = identifier.toLowerCase().trim();
    const upperSku = identifier.toUpperCase().trim();

    // 1. Server Admin SDK
    if (typeof window === "undefined" && adminDb) {
      // A. Check exact doc ID
      const directDoc = await adminDb.collection(COLLECTIONS.PRODUCTS).doc(rawId).get();
      if (directDoc.exists) {
        return directDoc.data() as ProductDomainEntity;
      }

      // B. Check lowercase doc ID if different
      if (clean !== rawId) {
        const lowerDoc = await adminDb.collection(COLLECTIONS.PRODUCTS).doc(clean).get();
        if (lowerDoc.exists) {
          return lowerDoc.data() as ProductDomainEntity;
        }
      }

      // C. Check by 'id' field in document
      const idSnap = await adminDb
        .collection(COLLECTIONS.PRODUCTS)
        .where("id", "==", rawId)
        .limit(1)
        .get();
      if (!idSnap.empty) {
        return idSnap.docs[0].data() as ProductDomainEntity;
      }

      // D. Check by SKU (uppercase)
      const skuSnap = await adminDb
        .collection(COLLECTIONS.PRODUCTS)
        .where("sku", "==", upperSku)
        .limit(1)
        .get();
      if (!skuSnap.empty) {
        return skuSnap.docs[0].data() as ProductDomainEntity;
      }

      // E. Check by raw SKU (in case SKU was stored as-is)
      if (upperSku !== rawId) {
        const rawSkuSnap = await adminDb
          .collection(COLLECTIONS.PRODUCTS)
          .where("sku", "==", rawId)
          .limit(1)
          .get();
        if (!rawSkuSnap.empty) {
          return rawSkuSnap.docs[0].data() as ProductDomainEntity;
        }
      }
    }

    // 2. Client SDK
    if (db && isFirebaseConfigured()) {
      const directDoc = await getDoc(doc(db, COLLECTIONS.PRODUCTS, rawId));
      if (directDoc.exists()) {
        return directDoc.data() as ProductDomainEntity;
      }

      if (clean !== rawId) {
        const lowerDoc = await getDoc(doc(db, COLLECTIONS.PRODUCTS, clean));
        if (lowerDoc.exists()) {
          return lowerDoc.data() as ProductDomainEntity;
        }
      }

      const colRef = collection(db, COLLECTIONS.PRODUCTS);
      const qId = query(colRef, where("id", "==", rawId));
      const snapId = await getDocs(qId);
      if (!snapId.empty) {
        return snapId.docs[0].data() as ProductDomainEntity;
      }

      const qSku = query(colRef, where("sku", "==", upperSku));
      const snapSku = await getDocs(qSku);
      if (!snapSku.empty) {
        return snapSku.docs[0].data() as ProductDomainEntity;
      }
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error searching product:", err);
    return null;
  }
}

/**
 * Strips all undefined values recursively, because Firebase Firestore strictly forbids
 * keys with undefined values (Unsupported field value: undefined).
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Save or update product in Firestore.
 */
export async function saveProductToFirestore(product: ProductDomainEntity): Promise<boolean> {
  try {
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

    const cleanProduct = cleanFirestoreData(product);

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.PRODUCTS).doc(product.id).set(cleanProduct, { merge: true });
      invalidateProductsCache();
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), cleanProduct, { merge: true });
      invalidateProductsCache();
      return true;
    }

    return false;
  } catch (err) {
    console.error("[Firestore] Error saving product:", err);
    return false;
  }
}

/**
 * Delete product from Firestore by ID or SKU.
 */
export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  try {
    const cleanId = productId.trim();
    const upper = cleanId.toUpperCase();
    invalidateProductsCache();

    // Server Admin SDK
    if (typeof window === "undefined" && adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCTS).doc(cleanId).delete();
      } catch {}

      // Delete by 'sku'
      const skuSnap = await adminDb
        .collection(COLLECTIONS.PRODUCTS)
        .where("sku", "==", upper)
        .get();
      for (const d of skuSnap.docs) {
        await d.ref.delete();
      }

      // Delete by 'id' field
      const idSnap = await adminDb
        .collection(COLLECTIONS.PRODUCTS)
        .where("id", "==", cleanId)
        .get();
      for (const d of idSnap.docs) {
        await d.ref.delete();
      }

      invalidateProductsCache();
      return true;
    }

    // Client SDK
    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, cleanId));
      } catch {}

      // In case ID was SKU
      const qSku = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where("sku", "==", upper)
      );
      const snapSku = await getDocs(qSku);
      for (const d of snapSku.docs) {
        await deleteDoc(d.ref);
      }

      // In case doc ID was different than 'id' field
      const qId = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where("id", "==", cleanId)
      );
      const snapId = await getDocs(qId);
      for (const d of snapId.docs) {
        await deleteDoc(d.ref);
      }

      invalidateProductsCache();
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error deleting product from Firestore:", err);
    return false;
  }
}

/**
 * Batch seed products into Firestore.
 */
export async function seedProductsToFirestore(products: ProductDomainEntity[]): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const batch = adminDb.batch();
      for (const prod of products) {
        const docRef = adminDb.collection(COLLECTIONS.PRODUCTS).doc(prod.id);
        batch.set(docRef, prod, { merge: true });
      }
      await batch.commit();
      return {
        success: true,
        count: products.length,
        message: `${products.length} productos sembrados exitosamente en Firestore.`,
      };
    }

    if (db && isFirebaseConfigured()) {
      // Test the first write with a 6-second timeout to give prompt feedback if database is not enabled
      const cleanFirst = cleanFirestoreData(products[0]);
      const firstWritePromise = setDoc(doc(db, COLLECTIONS.PRODUCTS, products[0].id), cleanFirst, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIEMPO_AGOTADO: Verifica que Cloud Firestore esté habilitado en Firebase Console.")), 6000)
      );

      await Promise.race([firstWritePromise, timeoutPromise]);

      // Seed the remaining items
      for (let i = 1; i < products.length; i++) {
        const cleanItem = cleanFirestoreData(products[i]);
        await setDoc(doc(db, COLLECTIONS.PRODUCTS, products[i].id), cleanItem, { merge: true });
      }

      return {
        success: true,
        count: products.length,
        message: `${products.length} productos guardados exitosamente en Cloud Firestore.`,
      };
    }

    return {
      success: false,
      count: 0,
      message: "Firebase no está configurado aún con credenciales activas.",
    };
  } catch (err: any) {
    console.error("[Firestore] Error seeding products:", err);
    let errorMsg = err.message || "Error al sembrar productos en Firestore.";
    if (errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("Cloud Firestore API has not been used") || errorMsg.includes("TIEMPO_AGOTADO")) {
      errorMsg = "Cloud Firestore aún no ha sido creado en Firebase Console. Ve al menú lateral izquierdo > Compilación > Cloud Firestore > 'Crear base de datos' (en modo de prueba).";
    }
    return {
      success: false,
      count: 0,
      message: errorMsg,
    };
  }
}

/**
 * ============================================================================
 * ORDER OPERATIONS
 * ============================================================================
 */

export async function createOrderInFirestore(order: ConfirmedOrderEntity): Promise<boolean> {
  try {
    const docId = order.id || order.orderNumber;
    const cleanOrder = cleanFirestoreData(order);

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.ORDERS).doc(docId).set(cleanOrder);
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.ORDERS, docId), cleanOrder);
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error creating order in Firestore:", err);
    return false;
  }
}

export async function getOrderByIdFromFirestore(orderId: string): Promise<ConfirmedOrderEntity | null> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const docSnap = await adminDb.collection(COLLECTIONS.ORDERS).doc(orderId).get();
      if (docSnap.exists) {
        return docSnap.data() as ConfirmedOrderEntity;
      }

      // Check by orderNumber
      const numSnap = await adminDb
        .collection(COLLECTIONS.ORDERS)
        .where("orderNumber", "==", orderId)
        .limit(1)
        .get();
      if (!numSnap.empty) {
        return numSnap.docs[0].data() as ConfirmedOrderEntity;
      }
    }

    if (db && isFirebaseConfigured()) {
      const docSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
      if (docSnap.exists()) {
        return docSnap.data() as ConfirmedOrderEntity;
      }

      const q = query(collection(db, COLLECTIONS.ORDERS), where("orderNumber", "==", orderId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as ConfirmedOrderEntity;
      }
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error reading order from Firestore:", err);
    return null;
  }
}

export async function getUserOrdersFromFirestore(email: string): Promise<ConfirmedOrderEntity[]> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    if (typeof window === "undefined" && adminDb) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.ORDERS)
        .where("customer.email", "==", cleanEmail)
        .get();
      return snapshot.docs.map((d) => d.data() as ConfirmedOrderEntity);
    }

    if (db && isFirebaseConfigured()) {
      const colRef = collection(db, COLLECTIONS.ORDERS);
      const q = query(colRef, where("customer.email", "==", cleanEmail));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ConfirmedOrderEntity);
    }

    return [];
  } catch (err) {
    console.warn("[Firestore] Error reading user orders:", err);
    return [];
  }
}

/**
 * Fetch all orders for Admin dashboard
 */
export async function getAllOrdersFromFirestore(): Promise<ConfirmedOrderEntity[]> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const snapshot = await adminDb.collection(COLLECTIONS.ORDERS).get();
      const orders = snapshot.docs.map((d) => d.data() as ConfirmedOrderEntity);
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (db && isFirebaseConfigured()) {
      const colRef = collection(db, COLLECTIONS.ORDERS);
      const snap = await getDocs(colRef);
      const orders = snap.docs.map((d) => d.data() as ConfirmedOrderEntity);
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return [];
  } catch (err) {
    console.warn("[Firestore] Error reading all orders:", err);
    return [];
  }
}

/**
 * Update an existing order (status, courier tracking, admin notes)
 */
export async function updateOrderInFirestore(
  orderId: string,
  updates: Partial<ConfirmedOrderEntity>,
  customerEmail?: string
): Promise<boolean> {
  try {
    const cleanUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.ORDERS).doc(orderId).set(cleanUpdates, { merge: true });
      // Sincronizar simultáneamente en la colección de usuarios si aplica
      await updateOrderInUserAccount(orderId, cleanUpdates, customerEmail);
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), cleanUpdates);
      await updateOrderInUserAccount(orderId, cleanUpdates, customerEmail);
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error updating order in Firestore:", err);
    return false;
  }
}

/**
 * Update an order's data inside the user's document in the 'users' collection
 */
export async function updateOrderInUserAccount(
  orderId: string,
  updates: Partial<ConfirmedOrderEntity>,
  customerEmail?: string
): Promise<boolean> {
  try {
    const cleanUpdates = cleanFirestoreData(updates);

    // 1. Server Admin SDK
    if (typeof window === "undefined" && adminDb) {
      let userDocRef: any = null;
      let userData: any = null;

      if (customerEmail) {
        const snap = await adminDb
          .collection(COLLECTIONS.USERS)
          .where("email", "==", customerEmail.toLowerCase().trim())
          .limit(1)
          .get();
        if (!snap.empty) {
          userDocRef = snap.docs[0].ref;
          userData = snap.docs[0].data();
        }
      }

      if (!userDocRef) {
        const allUsersSnap = await adminDb.collection(COLLECTIONS.USERS).get();
        for (const d of allUsersSnap.docs) {
          const u = d.data();
          if (Array.isArray(u.orders) && u.orders.some((o: any) => o.id === orderId || o.orderNumber === orderId)) {
            userDocRef = d.ref;
            userData = u;
            break;
          }
        }
      }

      if (userDocRef && userData && Array.isArray(userData.orders)) {
        const updatedOrders = userData.orders.map((ord: any) => {
          if (ord.id === orderId || ord.orderNumber === orderId) {
            return { ...ord, ...cleanUpdates, updatedAt: new Date().toISOString() };
          }
          return ord;
        });
        await userDocRef.update({ orders: updatedOrders });
        return true;
      }
    }

    // 2. Client SDK
    if (db && isFirebaseConfigured() && customerEmail) {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where("email", "==", customerEmail.toLowerCase().trim())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const u = userDoc.data();
        if (Array.isArray(u.orders)) {
          const updatedOrders = u.orders.map((ord: any) => {
            if (ord.id === orderId || ord.orderNumber === orderId) {
              return { ...ord, ...cleanUpdates, updatedAt: new Date().toISOString() };
            }
            return ord;
          });
          await updateDoc(doc(db, COLLECTIONS.USERS, userDoc.id), { orders: updatedOrders });
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error updating order in user document:", err);
    return false;
  }
}

/**
 * Delete / cancel an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  try {
    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.ORDERS).doc(orderId).delete();
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await deleteDoc(doc(db, COLLECTIONS.ORDERS, orderId));
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error deleting order from Firestore:", err);
    return false;
  }
}

/**
 * ============================================================================
 * USER & WISHLIST OPERATIONS
 * ============================================================================
 */

export async function syncUserProfileToFirestore(user: UserAccount): Promise<boolean> {
  try {
    // Sanitized user profile without plaintext password if desired
    const profile = cleanFirestoreData({
      ...user,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.USERS).doc(user.id).set(profile, { merge: true });
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.USERS, user.id), profile, { merge: true });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error syncing user profile:", err);
    return false;
  }
}

export async function updateWishlistInFirestore(userId: string, wishlist: string[]): Promise<boolean> {
  try {
    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.USERS).doc(userId).set({ wishlist }, { merge: true });
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.USERS, userId), { wishlist }, { merge: true });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error updating wishlist in Firestore:", err);
    return false;
  }
}

export async function seedUsersToFirestore(users: UserAccount[]): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const batch = adminDb.batch();
      for (const u of users) {
        const ref = adminDb.collection(COLLECTIONS.USERS).doc(u.id);
        batch.set(ref, u, { merge: true });
      }
      await batch.commit();
      return {
        success: true,
        count: users.length,
        message: `${users.length} usuarios sembrados en Firestore vía Admin SDK.`,
      };
    }

    if (db && isFirebaseConfigured()) {
      for (const u of users) {
        await setDoc(doc(db, COLLECTIONS.USERS, u.id), u, { merge: true });
      }
      return {
        success: true,
        count: users.length,
        message: `${users.length} usuarios guardados en Firestore via Client SDK.`,
      };
    }

    return {
      success: false,
      count: 0,
      message: "Firebase no está configurado aún con credenciales activas.",
    };
  } catch (err: any) {
    return { success: false, count: 0, message: err.message };
  }
}

/**
 * Get user by ID or Email from Firestore.
 */
export async function getUserFromFirestore(idOrEmail: string): Promise<UserAccount | null> {
  try {
    const clean = idOrEmail.toLowerCase().trim();

    // 1. Server Admin SDK
    if (typeof window === "undefined" && adminDb) {
      const docSnap = await adminDb.collection(COLLECTIONS.USERS).doc(idOrEmail).get();
      if (docSnap.exists) {
        return docSnap.data() as UserAccount;
      }
      const emailSnap = await adminDb
        .collection(COLLECTIONS.USERS)
        .where("email", "==", clean)
        .limit(1)
        .get();
      if (!emailSnap.empty) {
        return emailSnap.docs[0].data() as UserAccount;
      }
    }

    // 2. Client SDK
    if (db && isFirebaseConfigured()) {
      const directSnap = await getDoc(doc(db, COLLECTIONS.USERS, idOrEmail));
      if (directSnap.exists()) {
        return directSnap.data() as UserAccount;
      }

      const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", clean));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserAccount;
      }
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error fetching user:", err);
    return null;
  }
}

/**
 * Get all users from Firestore.
 */
export async function getUsersFromFirestore(): Promise<UserAccount[]> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const snap = await adminDb.collection(COLLECTIONS.USERS).get();
      return snap.docs.map((d) => d.data() as UserAccount);
    }
    if (db && isFirebaseConfigured()) {
      const snap = await getDocs(collection(db, COLLECTIONS.USERS));
      return snap.docs.map((d) => d.data() as UserAccount);
    }
    return [];
  } catch (err) {
    console.warn("[Firestore] Error fetching all users:", err);
    return [];
  }
}

/**
 * Delete a user from Firestore permanently.
 */
export async function deleteUserFromFirestore(userIdOrEmail: string): Promise<boolean> {
  try {
    const clean = userIdOrEmail.toLowerCase().trim();

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.USERS).doc(userIdOrEmail).delete();
      const snap = await adminDb
        .collection(COLLECTIONS.USERS)
        .where("email", "==", clean)
        .get();
      for (const d of snap.docs) {
        await d.ref.delete();
      }
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userIdOrEmail));
      const q = query(collection(db, COLLECTIONS.USERS), where("email", "==", clean));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error deleting user from Firestore:", err);
    return false;
  }
}

/**
 * ============================================================================
 * SLIDER SETTINGS OPERATIONS
 * ============================================================================
 */

export async function getSliderSettingsFromFirestore(): Promise<any[] | null> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const snap = await adminDb.collection(COLLECTIONS.SLIDER_SETTINGS).doc("home_slider").get();
      if (snap.exists) {
        const data = snap.data();
        if (data && Array.isArray(data.slides)) {
          return data.slides;
        }
      }
    }

    if (db && isFirebaseConfigured()) {
      const snap = await getDoc(doc(db, COLLECTIONS.SLIDER_SETTINGS, "home_slider"));
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.slides)) {
          return data.slides;
        }
      }
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error fetching slider settings:", err);
    return null;
  }
}

export async function saveSliderSettingsToFirestore(slides: any[]): Promise<boolean> {
  try {
    const payload = {
      slides: cleanFirestoreData(slides),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.SLIDER_SETTINGS).doc("home_slider").set(payload, { merge: true });
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.SLIDER_SETTINGS, "home_slider"), payload, { merge: true });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error saving slider settings:", err);
    return false;
  }
}

/**
 * ============================================================================
 * STORE BRANDING SETTINGS (Logo, Title, Subtitle)
 * ============================================================================
 */
export async function getBrandingSettingsFromFirestore(): Promise<any | null> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const docSnap = await adminDb.collection(COLLECTIONS.BRANDING_SETTINGS).doc("main_brand").get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && data.branding) {
          return data.branding;
        }
      }
    }

    if (db && isFirebaseConfigured()) {
      const snap = await getDoc(doc(db, COLLECTIONS.BRANDING_SETTINGS, "main_brand"));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.branding) {
          return data.branding;
        }
      }
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error fetching branding settings:", err);
    return null;
  }
}

export async function saveBrandingSettingsToFirestore(branding: any): Promise<boolean> {
  try {
    const payload = {
      branding: cleanFirestoreData(branding),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.BRANDING_SETTINGS).doc("main_brand").set(payload, { merge: true });
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.BRANDING_SETTINGS, "main_brand"), payload, { merge: true });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error saving branding settings:", err);
    return false;
  }
}

/**
 * ============================================================================
 * TOP ANNOUNCEMENT BAR SETTINGS (Shipping, Payment, Guarantee, WhatsApp)
 * ============================================================================
 */
export async function getAnnouncementSettingsFromFirestore(): Promise<any | null> {
  try {
    if (typeof window === "undefined" && adminDb) {
      const docSnap = await adminDb.collection(COLLECTIONS.ANNOUNCEMENT_SETTINGS).doc("main_bar").get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && data.announcement) {
          return data.announcement;
        }
      }
    }

    if (db && isFirebaseConfigured()) {
      const snap = await getDoc(doc(db, COLLECTIONS.ANNOUNCEMENT_SETTINGS, "main_bar"));
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.announcement) {
          return data.announcement;
        }
      }
    }

    return null;
  } catch (err) {
    console.warn("[Firestore] Error fetching announcement settings:", err);
    return null;
  }
}

export async function saveAnnouncementSettingsToFirestore(announcement: any): Promise<boolean> {
  try {
    const payload = {
      announcement: cleanFirestoreData(announcement),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window === "undefined" && adminDb) {
      await adminDb.collection(COLLECTIONS.ANNOUNCEMENT_SETTINGS).doc("main_bar").set(payload, { merge: true });
      return true;
    }

    if (db && isFirebaseConfigured()) {
      await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENT_SETTINGS, "main_bar"), payload, { merge: true });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[Firestore] Error saving announcement settings:", err);
    return false;
  }
}


