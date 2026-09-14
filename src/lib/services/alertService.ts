import { adminDb } from "@/lib/firebase/admin";

export interface ProductAlertRecord {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productPrice: number;
  productOriginalPrice?: number;
  productImageUrl?: string;
  email: string;
  userId?: string | null;
  userName?: string | null;
  isGuest: boolean;
  alertType: "STOCK_AVAILABLE" | "PRICE_DROP" | "BOTH";
  isOutOfStock: boolean;
  createdAt: string;
  active: boolean;
}

// Global in-memory persistence fallback for alerts
declare global {
  var __omniProductAlerts: ProductAlertRecord[] | undefined;
}

if (!global.__omniProductAlerts) {
  global.__omniProductAlerts = [
    {
      id: "alert-demo-1",
      productId: "VG-CYBERP-2077",
      productSku: "VG-CYBERP-2077",
      productName: "Cyberpunk 2077 - Edición Coleccionista",
      productPrice: 39900,
      productOriginalPrice: 54900,
      productImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600",
      email: "benjaigancioreyes56@gmail.com",
      userId: null,
      userName: "Benjamín",
      isGuest: false,
      alertType: "PRICE_DROP",
      isOutOfStock: false,
      createdAt: new Date().toISOString(),
      active: true,
    },
    {
      id: "alert-demo-2",
      productId: "MAN-SOLO-015",
      productSku: "MAN-SOLO-015",
      productName: "Solo Leveling Vol 15 (Manga / Artbook)",
      productPrice: 18990,
      productImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
      email: "coleccionista.invitado@gmail.com",
      userId: null,
      userName: "Invitado Web",
      isGuest: true,
      alertType: "STOCK_AVAILABLE",
      isOutOfStock: true,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      active: true,
    },
  ];
}

const memoryAlerts = global.__omniProductAlerts;

export const alertService = {
  /**
   * Saves or updates a product alert in Firestore and in-memory cache.
   */
  async saveAlert(record: ProductAlertRecord): Promise<ProductAlertRecord> {
    // 1. In-memory update
    const existingIdx = memoryAlerts.findIndex(
      (a) => a.id === record.id || (a.email === record.email && a.productId === record.productId && a.active)
    );

    if (existingIdx >= 0) {
      memoryAlerts[existingIdx] = { ...memoryAlerts[existingIdx], ...record, active: true };
    } else {
      memoryAlerts.unshift(record);
    }

    // 2. Firestore update if available
    if (adminDb) {
      try {
        await adminDb.collection("product_alerts").doc(record.id).set(record);
      } catch (err) {
        console.warn("[AlertService] Could not save to Firestore, using memory:", err);
      }
    }

    return record;
  },

  /**
   * Retrieves all alerts (for Admin).
   */
  async getAllAlerts(): Promise<ProductAlertRecord[]> {
    if (adminDb) {
      try {
        const snapshot = await adminDb.collection("product_alerts").orderBy("createdAt", "desc").get();
        if (!snapshot.empty) {
          const dbAlerts = snapshot.docs.map((d) => d.data() as ProductAlertRecord);
          // Merge with memory alerts avoiding duplicates
          const seen = new Set(dbAlerts.map((a) => a.id));
          const combined = [...dbAlerts, ...memoryAlerts.filter((a) => !seen.has(a.id))];
          return combined.filter((a) => a.active !== false);
        }
      } catch (err) {
        console.warn("[AlertService] Error reading from Firestore:", err);
      }
    }

    return memoryAlerts.filter((a) => a.active !== false);
  },

  /**
   * Retrieves alerts for a specific user (by email or userId).
   */
  async getUserAlerts(emailOrUserId: string): Promise<ProductAlertRecord[]> {
    const all = await this.getAllAlerts();
    const query = emailOrUserId.toLowerCase().trim();

    return all.filter(
      (a) =>
        a.active !== false &&
        ((a.email && a.email.toLowerCase().trim() === query) || (a.userId && a.userId === emailOrUserId))
    );
  },

  /**
   * Deactivates or removes an alert.
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    const idx = memoryAlerts.findIndex((a) => a.id === alertId);
    if (idx >= 0) {
      memoryAlerts.splice(idx, 1);
    }

    if (adminDb) {
      try {
        await adminDb.collection("product_alerts").doc(alertId).delete();
      } catch (err) {
        console.warn("[AlertService] Error deleting from Firestore:", err);
      }
    }

    return true;
  },
};
