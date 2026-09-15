import fs from "fs";
import path from "path";
import { adminDb } from "@/lib/firebase/admin";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";

export interface ProductRequestRecord {
  id: string;
  title: string;
  franchise?: string;
  category?: string;
  userEmail: string;
  userName: string;
  userId?: string | null;
  isGuest: boolean;
  imageUrl?: string;
  aiSummary?: string;
  confidenceScore?: number;
  userNotes?: string;
  status: "PENDING" | "REVIEWING" | "ADDED" | "DISMISSED";
  createdAt: string;
  active: boolean;
  isDeleted?: boolean;
}

// Paths to persistent disk files
const DATA_DIR = path.join(process.cwd(), "src", "data");
const DISK_FILE_PATH = path.join(DATA_DIR, "product_requests.json");
const DELETED_IDS_PATH = path.join(DATA_DIR, "deleted_product_request_ids.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDeletedRequestIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_IDS_PATH)) {
      const raw = fs.readFileSync(DELETED_IDS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (err) {
    console.warn("[ProductRequestService] Could not read deleted request IDs:", err);
  }
  return new Set<string>();
}

function writeDeletedRequestIds(ids: Set<string>): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DELETED_IDS_PATH, JSON.stringify(Array.from(ids), null, 2), "utf-8");
  } catch (err) {
    console.warn("[ProductRequestService] Could not persist deleted request IDs:", err);
  }
}

function readRequestsFromDisk(): ProductRequestRecord[] {
  try {
    if (fs.existsSync(DISK_FILE_PATH)) {
      const raw = fs.readFileSync(DISK_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[ProductRequestService] Could not read requests from disk:", err);
  }
  return [];
}

function writeRequestsToDisk(requests: ProductRequestRecord[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DISK_FILE_PATH, JSON.stringify(requests, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ProductRequestService] Could not write requests to disk:", err);
  }
}

declare global {
  var __omniProductRequests: ProductRequestRecord[] | undefined;
  var __omniDeletedRequestIds: Set<string> | undefined;
}

if (!global.__omniDeletedRequestIds) {
  global.__omniDeletedRequestIds = readDeletedRequestIds();
}

if (!global.__omniProductRequests) {
  const diskRequests = readRequestsFromDisk();
  const deletedSet = global.__omniDeletedRequestIds;
  global.__omniProductRequests = diskRequests.filter(
    (r) => r && r.id && !deletedSet.has(r.id) && r.active !== false && !r.isDeleted
  );
}

const memoryRequests = global.__omniProductRequests!;
const deletedRequestIds = global.__omniDeletedRequestIds!;

export const productRequestService = {
  /**
   * Saves or updates a product request across Cloud Firestore, Disk, and Memory cache.
   */
  async saveRequest(record: ProductRequestRecord): Promise<ProductRequestRecord> {
    const cleanRecord: ProductRequestRecord = {
      ...JSON.parse(JSON.stringify(record)),
      active: true,
      isDeleted: false,
    };

    if (deletedRequestIds.has(record.id)) {
      deletedRequestIds.delete(record.id);
      writeDeletedRequestIds(deletedRequestIds);
    }

    // 1. In-memory update
    const existingIdx = memoryRequests.findIndex((r) => r.id === record.id);
    if (existingIdx >= 0) {
      memoryRequests[existingIdx] = { ...memoryRequests[existingIdx], ...cleanRecord };
    } else {
      memoryRequests.unshift(cleanRecord);
    }

    // 2. Persist to local disk file
    writeRequestsToDisk(memoryRequests);

    // 3. Save to Cloud Firestore via Admin SDK
    if (adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCT_REQUESTS).doc(record.id).set(cleanRecord);
      } catch (err) {
        console.warn("[ProductRequestService] Could not save to Firestore Admin:", err);
      }
    }

    // 4. Save to Cloud Firestore via Web SDK
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, COLLECTIONS.PRODUCT_REQUESTS, record.id), cleanRecord, { merge: true });
      } catch (err) {
        console.warn("[ProductRequestService] Could not save to Firestore Client:", err);
      }
    }

    return cleanRecord;
  },

  /**
   * Retrieves all product requests (merging Cloud Firestore, Disk, and Memory),
   * strictly excluding any tombstoned / deleted requests.
   */
  async getAllRequests(): Promise<ProductRequestRecord[]> {
    const freshDeletedIds = readDeletedRequestIds();
    for (const id of freshDeletedIds) {
      deletedRequestIds.add(id);
    }

    const requestsMap = new Map<string, ProductRequestRecord>();

    const isRecordValid = (r: ProductRequestRecord | undefined | null): boolean => {
      if (!r || !r.id) return false;
      if (deletedRequestIds.has(r.id)) return false;
      if (r.active === false || r.isDeleted === true) return false;
      return true;
    };

    // 1. Add from disk
    const fromDisk = readRequestsFromDisk();
    for (const r of fromDisk) {
      if (isRecordValid(r)) {
        requestsMap.set(r.id, r);
      }
    }

    // 2. Add from memory
    for (const r of memoryRequests) {
      if (isRecordValid(r)) {
        requestsMap.set(r.id, r);
      }
    }

    // 3. Fetch from Cloud Firestore Admin
    if (adminDb) {
      try {
        const snapshot = await adminDb.collection(COLLECTIONS.PRODUCT_REQUESTS).orderBy("createdAt", "desc").get();
        if (!snapshot.empty) {
          for (const d of snapshot.docs) {
            const data = d.data() as ProductRequestRecord;
            if (isRecordValid(data)) {
              requestsMap.set(data.id, data);
            }
          }
        }
      } catch (err) {
        console.warn("[ProductRequestService] Error reading from Firestore Admin:", err);
      }
    }

    // 4. Fetch from Cloud Firestore Client SDK
    if (db && isFirebaseConfigured()) {
      try {
        const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCT_REQUESTS));
        if (!snapshot.empty) {
          for (const d of snapshot.docs) {
            const data = d.data() as ProductRequestRecord;
            if (isRecordValid(data)) {
              requestsMap.set(data.id, data);
            }
          }
        }
      } catch (err) {
        console.warn("[ProductRequestService] Error reading from Firestore Client:", err);
      }
    }

    const merged = Array.from(requestsMap.values());
    merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    memoryRequests.length = 0;
    memoryRequests.push(...merged);
    writeRequestsToDisk(merged);

    return merged;
  },

  /**
   * Updates status of a request (PENDING, REVIEWING, ADDED, DISMISSED)
   */
  async updateStatus(id: string, status: ProductRequestRecord["status"]): Promise<boolean> {
    const all = await this.getAllRequests();
    const target = all.find((r) => r.id === id);
    if (!target) return false;

    target.status = status;
    await this.saveRequest(target);
    return true;
  },

  /**
   * Deactivates or removes a product request permanently.
   * Tombstones the ID to prevent resurrection on refresh.
   */
  async deleteRequest(id: string): Promise<boolean> {
    if (!id) return false;

    // 1. Mark as tombstoned
    deletedRequestIds.add(id);
    writeDeletedRequestIds(deletedRequestIds);

    // 2. Remove from memory and disk
    const idx = memoryRequests.findIndex((r) => r.id === id);
    if (idx >= 0) {
      memoryRequests.splice(idx, 1);
    }
    writeRequestsToDisk(memoryRequests);

    // 3. Mark inactive & delete in Firestore Admin
    if (adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCT_REQUESTS).doc(id).set(
          { active: false, isDeleted: true, deletedAt: new Date().toISOString() },
          { merge: true }
        );
        await adminDb.collection(COLLECTIONS.PRODUCT_REQUESTS).doc(id).delete();
      } catch (err) {
        console.warn("[ProductRequestService] Could not delete from Firestore Admin:", err);
      }
    }

    // 4. Mark inactive & delete in Firestore Client
    if (db && isFirebaseConfigured()) {
      try {
        await setDoc(
          doc(db, COLLECTIONS.PRODUCT_REQUESTS, id),
          { active: false, isDeleted: true, deletedAt: new Date().toISOString() },
          { merge: true }
        );
        await deleteDoc(doc(db, COLLECTIONS.PRODUCT_REQUESTS, id));
      } catch (err) {
        console.warn("[ProductRequestService] Could not delete from Firestore Client:", err);
      }
    }

    return true;
  },
};
