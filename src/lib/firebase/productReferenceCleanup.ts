import { adminDb } from "./admin";
import { COLLECTIONS } from "./collections";
import type { ProductDomainEntity } from "../types/domain";
import type { UserAccount } from "../store/authStore";
import { createProductReferenceIndex, pruneOrderProductReferences } from "../services/productReferences";

/** Removes mutable references for all accounts; canonical financial orders are preserved. */
export async function cleanupPersistedProductReferences(products: ProductDomainEntity[], onlyUserId?: string) {
  if (!adminDb) return;
  const database = adminDb;
  const index = createProductReferenceIndex(products);
  const users = onlyUserId
    ? [await database.collection(COLLECTIONS.USERS).doc(onlyUserId).get()]
    : (await database.collection(COLLECTIONS.USERS).get()).docs;
  for (const user of users) {
    if (!user.exists) continue;
    await database.runTransaction(async transaction => {
      const snapshot = await transaction.get(user.ref);
      if (!snapshot.exists) return;
      const data = snapshot.data() as UserAccount;
      const wishlist = (data.wishlist || []).filter(id => index.ids.has(id));
      const orders = pruneOrderProductReferences(data.orders || [], products);
      if (wishlist.length !== (data.wishlist || []).length || JSON.stringify(orders) !== JSON.stringify(data.orders || [])) {
        transaction.update(user.ref, { wishlist, orders });
      }
    });
  }
  if (!onlyUserId) {
    const alerts = await database.collection(COLLECTIONS.PRODUCT_ALERTS).get();
    for (const alert of alerts.docs) {
      if (!index.has(alert.data())) await alert.ref.delete();
    }
  }
}
