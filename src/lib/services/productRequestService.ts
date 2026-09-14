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
}

// Path to persistent disk file
const DISK_FILE_PATH = path.join(process.cwd(), "src", "data", "product_requests.json");

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
    const dir = path.dirname(DISK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DISK_FILE_PATH, JSON.stringify(requests, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ProductRequestService] Could not write requests to disk:", err);
  }
}

declare global {
  var __omniProductRequests: ProductRequestRecord[] | undefined;
}

if (!global.__omniProductRequests) {
  const diskRequests = readRequestsFromDisk();
  if (diskRequests.length > 0) {
    global.__omniProductRequests = diskRequests;
  } else {
    // Initial sample from Visual Search detection
    global.__omniProductRequests = [
      {
        id: "req-gow-ragnarok-ps5",
        title: "God of War Ragnarök (PS5)",
        franchise: "God of War",
        category: "VIDEO_GAME",
        userEmail: "ilhamelin5@gmail.com",
        userName: "Benjamín (OmniCollector)",
        userId: null,
        isGuest: false,
        imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
        aiSummary: "Identificado con Gemini Vision: God of War Ragnarök para PS5 con Kratos y Atreus.",
        confidenceScore: 0.99,
        userNotes: "Deseo comprar este juego en formato físico para PS5 en cuanto esté disponible.",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        active: true,
      },
    ];
    writeRequestsToDisk(global.__omniProductRequests);
  }
}

const memoryRequests = global.__omniProductRequests!;

export const productRequestService = {
  /**
   * Saves or updates a product request across Cloud Firestore, Disk, and Memory cache.
   */
  async saveRequest(record: ProductRequestRecord): Promise<ProductRequestRecord> {
    const cleanRecord = JSON.parse(JSON.stringify(record));

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
   * Retrieves all product requests (merging Cloud Firestore, Disk, and Memory).
   */
  async getAllRequests(): Promise<ProductRequestRecord[]> {
    const requestsMap = new Map<string, ProductRequestRecord>();

    // 1. Add from disk
    const fromDisk = readRequestsFromDisk();
    for (const r of fromDisk) {
      if (r.id && r.active !== false) {
        requestsMap.set(r.id, r);
      }
    }

    // 2. Add from memory
    for (const r of memoryRequests) {
      if (r.id && r.active !== false) {
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
            if (data.id && data.active !== false) {
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
            if (data.id && data.active !== false) {
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
   * Deactivates or removes a product request
   */
  async deleteRequest(id: string): Promise<boolean> {
    const idx = memoryRequests.findIndex((r) => r.id === id);
    if (idx >= 0) {
      memoryRequests.splice(idx, 1);
      writeRequestsToDisk(memoryRequests);
    }

    if (adminDb) {
      try {
        await adminDb.collection(COLLECTIONS.PRODUCT_REQUESTS).doc(id).delete();
      } catch (err) {
        console.warn("[ProductRequestService] Could not delete from Firestore Admin:", err);
      }
    }

    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.PRODUCT_REQUESTS, id));
      } catch (err) {
        console.warn("[ProductRequestService] Could not delete from Firestore Client:", err);
      }
    }

    return true;
  },
};
