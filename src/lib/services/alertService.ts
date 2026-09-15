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
  isDeleted?: boolean;
}

// Paths to persistent disk files
const DATA_DIR = path.join(process.cwd(), "src", "data");
const DISK_FILE_PATH = path.join(DATA_DIR, "product_alerts.json");
const DELETED_IDS_PATH = path.join(DATA_DIR, "deleted_alert_ids.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDeletedAlertIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_IDS_PATH)) {
      const raw = fs.readFileSync(DELETED_IDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (err) {
    console.warn("[AlertService] Could not read deleted alert IDs:", err);
  }
  return new Set<string>();
}

function writeDeletedAlertIds(ids: Set<string>): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DELETED_IDS_PATH, JSON.stringify(Array.from(ids), null, 2), "utf-8");
  } catch (err) {
    console.warn("[AlertService] Could not persist deleted alert IDs:", err);
  }
}

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
    ensureDataDir();
    fs.writeFileSync(DISK_FILE_PATH, JSON.stringify(alerts, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AlertService] Could not write alerts to disk:", err);
  }
}

// In-memory cache initialization without fake demo data
declare global {
  var __omniProductAlerts: ProductAlertRecord[] | undefined;
  var __omniDeletedAlertIds: Set<string> | undefined;
}

if (!global.__omniDeletedAlertIds) {
  global.__omniDeletedAlertIds = readDeletedAlertIds();
}

if (!global.__omniProductAlerts) {
  const diskAlerts = readAlertsFromDisk();
  // Filter out any previously deleted IDs
  const deletedSet = global.__omniDeletedAlertIds;
  global.__omniProductAlerts = diskAlerts.filter(
    (a) => a && a.id && !deletedSet.has(a.id) && a.active !== false && !a.isDeleted
  );
}

const memoryAlerts = global.__omniProductAlerts!;
const deletedAlertIds = global.__omniDeletedAlertIds!;

export const alertService = {
  /**
   * Saves or updates a product alert across Cloud Firestore, Disk, and Memory cache.
   */
  async saveAlert(record: ProductAlertRecord): Promise<ProductAlertRecord> {
    const cleanRecord: ProductAlertRecord = {
      ...JSON.parse(JSON.stringify(record)),
      active: true,
      isDeleted: false,
    };

    // If ID was in deleted set, un-tombstone it
    if (deletedAlertIds.has(record.id)) {
      deletedAlertIds.delete(record.id);
      writeDeletedAlertIds(deletedAlertIds);
    }

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
   * Retrieves all alerts (merging Cloud Firestore, Disk, and Memory),
   * strictly excluding any tombstoned / deleted alerts so they never resurrect on refresh.
   */
  async getAllAlerts(): Promise<ProductAlertRecord[]> {
    // Reload fresh deleted IDs from disk in case of multi-process or cold-start
    const freshDeletedIds = readDeletedAlertIds();
    for (const id of freshDeletedIds) {
      deletedAlertIds.add(id);
    }

    const alertsMap = new Map<string, ProductAlertRecord>();

    const isRecordValid = (r: ProductAlertRecord | undefined | null): boolean => {
      if (!r || !r.id) return false;
      if (deletedAlertIds.has(r.id)) return false;
      if (r.active === false || r.isDeleted === true) return false;
      return true;
    };

    // 1. Add from disk
    const fromDisk = readAlertsFromDisk();
    for (const a of fromDisk) {
      if (isRecordValid(a)) {
        alertsMap.set(a.id, a);
      }
    }

    // 2. Add from memory
    for (const a of memoryAlerts) {
      if (isRecordValid(a)) {
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
            if (isRecordValid(data)) {
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
            if (isRecordValid(data)) {
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

    // Keep memory and disk synchronized with active, non-deleted list
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
        !a.isDeleted &&
        !deletedAlertIds.has(a.id) &&
        ((a.email && a.email.toLowerCase().trim() === query) || (a.userId && a.userId === emailOrUserId))
    );
  },

  /**
   * Permanently deactivates and removes an alert from Firestore, Disk, and Memory.
   * Tracks the ID in deletedAlertIds so it NEVER resurrects upon UI refresh.
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    if (!alertId) return false;

    // 1. Mark as tombstoned immediately in memory and disk
    deletedAlertIds.add(alertId);
    writeDeletedAlertIds(deletedAlertIds);

    // 2. Remove from in-memory cache
    const idx = memoryAlerts.findIndex((a) => a.id === alertId);
    if (idx >= 0) {
      memoryAlerts.splice(idx, 1);
    }
    writeAlertsToDisk(memoryAlerts);

    // 3. Mark inactive & delete in Cloud Firestore Admin
    if (adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCT_ALERTS).doc(alertId).set(
          { active: false, isDeleted: true, deletedAt: new Date().toISOString() },
          { merge: true }
        );
        await adminDb.collection(COLLECTIONS.PRODUCT_ALERTS).doc(alertId).delete();
      } catch (err) {
        console.warn("[AlertService] Error deleting from Firestore Admin:", err);
      }
    }

    // 4. Mark inactive & delete in Cloud Firestore Client SDK
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(
          doc(db, COLLECTIONS.PRODUCT_ALERTS, alertId),
          { active: false, isDeleted: true, deletedAt: new Date().toISOString() },
          { merge: true }
        );
        await deleteDoc(doc(db, COLLECTIONS.PRODUCT_ALERTS, alertId));
      } catch (err) {
        console.warn("[AlertService] Error deleting from Firestore Client:", err);
      }
    }

    return true;
  },
};
