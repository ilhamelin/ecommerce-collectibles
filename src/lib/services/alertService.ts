import fs from "fs";
import path from "path";
import { adminDb } from "@/lib/firebase/admin";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";

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

// Path to persistent disk file
const DISK_FILE_PATH = path.join(process.cwd(), "src", "data", "product_alerts.json");

function readAlertsFromDisk(): ProductAlertRecord[] {
  try {
    if (fs.existsSync(DISK_FILE_PATH)) {
      const raw = fs.readFileSync(DISK_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[AlertService] Could not read alerts from disk:", err);
  }
  return [];
}

function writeAlertsToDisk(alerts: ProductAlertRecord[]): void {
  try {
    const dir = path.dirname(DISK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISK_FILE_PATH, JSON.stringify(alerts, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AlertService] Could not write alerts to disk:", err);
  }
}

// In-memory cache initialization
declare global {
  var __omniProductAlerts: ProductAlertRecord[] | undefined;
}

if (!global.__omniProductAlerts) {
  const diskAlerts = readAlertsFromDisk();
  if (diskAlerts.length > 0) {
    global.__omniProductAlerts = diskAlerts;
  } else {
    global.__omniProductAlerts = [
      {
        id: "alert-persona-3-mixpro",
        productId: "VG-PERSONA-3-RELOAD",
        productSku: "VG-PERSONA-3-RELOAD",
        productName: "Persona 3 Reload (Collector's Aigis Edition)",
        productPrice: 189900,
        productImageUrl: "https://images.unsplash.com/photo-1612287233207-6819b16ea9a7?auto=format&fit=crop&q=80&w=600",
        email: "mixpro195@gmail.com",
        userId: null,
        userName: "Benjamin Reyes",
        isGuest: false,
        alertType: "PRICE_DROP",
        isOutOfStock: false,
        createdAt: "2026-09-14T08:59:00.000Z",
        active: true,
      },
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
        createdAt: "2026-09-14T08:54:44.535Z",
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
        createdAt: "2026-09-14T04:54:44.536Z",
        active: true,
      },
    ];
    writeAlertsToDisk(global.__omniProductAlerts);
  }
}

const memoryAlerts = global.__omniProductAlerts!;

export const alertService = {
  /**
   * Saves or updates a product alert across Cloud Firestore, Disk, and Memory cache.
   */
  async saveAlert(record: ProductAlertRecord): Promise<ProductAlertRecord> {
    const cleanRecord = JSON.parse(JSON.stringify(record));

    // 1. In-memory update
    const existingIdx = memoryAlerts.findIndex(
      (a) => a.id === record.id || (a.email === record.email && a.productId === record.productId && a.active)
    );

    if (existingIdx >= 0) {
      memoryAlerts[existingIdx] = { ...memoryAlerts[existingIdx], ...cleanRecord, active: true };
    } else {
      memoryAlerts.unshift(cleanRecord);
    }

    // 2. Persist to local disk file
    writeAlertsToDisk(memoryAlerts);

    // 3. Save to Cloud Firestore via Admin SDK (if configured)
    if (adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCT_ALERTS).doc(record.id).set(cleanRecord);
      } catch (err) {
        console.warn("[AlertService] Could not save to Firestore Admin:", err);
      }
    }

    // 4. Save to Cloud Firestore via Web SDK (connected with public keys)
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTIONS.PRODUCT_ALERTS, record.id), cleanRecord, { merge: true });
      } catch (err) {
        console.warn("[AlertService] Could not save to Firestore Client:", err);
      }
    }

    return cleanRecord;
  },

  /**
   * Retrieves all alerts (merging Cloud Firestore, Disk, and Memory).
   */
  async getAllAlerts(): Promise<ProductAlertRecord[]> {
    const alertsMap = new Map<string, ProductAlertRecord>();

    // 1. Add from disk
    const fromDisk = readAlertsFromDisk();
    for (const a of fromDisk) {
      if (a.id && a.active !== false) {
        alertsMap.set(a.id, a);
      }
    }

    // 2. Add from memory
    for (const a of memoryAlerts) {
      if (a.id && a.active !== false) {
        alertsMap.set(a.id, a);
      }
    }

    // 3. Fetch from Cloud Firestore Admin if active
    if (adminDb) {
      try {
        const snapshot = await adminDb.collection(COLLECTIONS.PRODUCT_ALERTS).orderBy("createdAt", "desc").get();
        if (!snapshot.empty) {
          for (const d of snapshot.docs) {
            const data = d.data() as ProductAlertRecord;
            if (data.id && data.active !== false) {
              alertsMap.set(data.id, data);
            }
          }
        }
      } catch (err) {
        console.warn("[AlertService] Error reading from Firestore Admin:", err);
      }
    }

    // 4. Fetch from Cloud Firestore Client SDK (Web SDK)
    if (db && isFirebaseConfigured()) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCT_ALERTS));
        if (!snapshot.empty) {
          for (const d of snapshot.docs) {
            const data = d.data() as ProductAlertRecord;
            if (data.id && data.active !== false) {
              alertsMap.set(data.id, data);
            }
          }
        }
      } catch (err) {
        console.warn("[AlertService] Error reading from Firestore Client:", err);
      }
    }

    const merged = Array.from(alertsMap.values());
    merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Keep memory and disk in sync with latest merged list
    memoryAlerts.length = 0;
    memoryAlerts.push(...merged);
    writeAlertsToDisk(merged);

    return merged;
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
   * Deactivates or removes an alert from Firestore, Disk, and Memory.
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    const idx = memoryAlerts.findIndex((a) => a.id === alertId);
    if (idx >= 0) {
      memoryAlerts.splice(idx, 1);
    }
    writeAlertsToDisk(memoryAlerts);

    if (adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCT_ALERTS).doc(alertId).delete();
      } catch (err) {
        console.warn("[AlertService] Error deleting from Firestore Admin:", err);
      }
    }

    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCT_ALERTS, alertId));
      } catch (err) {
        console.warn("[AlertService] Error deleting from Firestore Client:", err);
      }
    }

    return true;
  },
};
