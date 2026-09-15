import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const dynamic = "force-dynamic";

// Analytics store schema for strictly genuine activity
interface AnalyticsStore {
  totalPageViews: number;
  uniqueVisitors: Set<string>;
  totalProductClicks: number;
  productStats: Record<
    string,
    {
      sku: string;
      name: string;
      category: string;
      price: number;
      clicks: number;
      views: number;
      lastInteractionAt: number;
    }
  >;
  categoryStats: Record<string, number>;
  userStats: Record<
    string,
    {
      userId: string;
      visitsCount: number;
      clicksCount: number;
      lastVisitAt: number;
      lastDevice?: string;
    }
  >;
  dailyViews: Record<string, number>;
}

// Persistent disk file path for analytics summary
const DATA_DIR = path.join(process.cwd(), "src", "data");
const DISK_ANALYTICS_PATH = path.join(DATA_DIR, "analytics_summary.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAnalyticsFromDisk(): Partial<AnalyticsStore> | null {
  try {
    if (fs.existsSync(DISK_ANALYTICS_PATH)) {
      const raw = fs.readFileSync(DISK_ANALYTICS_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.warn("[Analytics] Could not read analytics summary from disk:", err);
  }
  return null;
}

function writeAnalyticsToDisk(store: AnalyticsStore): void {
  try {
    ensureDataDir();
    const payload = {
      totalPageViews: store.totalPageViews,
      uniqueVisitors: Array.from(store.uniqueVisitors),
      totalProductClicks: store.totalProductClicks,
      productStats: store.productStats,
      categoryStats: store.categoryStats,
      userStats: store.userStats,
      dailyViews: store.dailyViews,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DISK_ANALYTICS_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Analytics] Could not write analytics summary to disk:", err);
  }
}

// Initialized strictly with genuine 0 metrics - NO INVENTED NUMBERS
const diskSaved = readAnalyticsFromDisk();

const globalAnalytics: AnalyticsStore = {
  totalPageViews: typeof diskSaved?.totalPageViews === "number" ? diskSaved.totalPageViews : 0,
  uniqueVisitors: new Set(Array.isArray(diskSaved?.uniqueVisitors) ? (diskSaved.uniqueVisitors as string[]) : []),
  totalProductClicks: typeof diskSaved?.totalProductClicks === "number" ? diskSaved.totalProductClicks : 0,
  productStats: diskSaved?.productStats || {},
  categoryStats: diskSaved?.categoryStats || {},
  userStats: diskSaved?.userStats || {},
  dailyViews: diskSaved?.dailyViews || {},
};

let isAnalyticsLoadedFromDb = false;

async function syncAnalyticsWithFirestore() {
  if (isAnalyticsLoadedFromDb) return;
  try {
    let snapData: any = null;
    if (adminDb) {
      const snap = await adminDb.collection(COLLECTIONS.ANALYTICS).doc("global_summary").get();
      if (snap.exists) snapData = snap.data();
    } else if (db && isFirebaseConfigured()) {
      const snap = await getDoc(doc(db, COLLECTIONS.ANALYTICS, "global_summary"));
      if (snap.exists()) snapData = snap.data();
    }

    if (snapData) {
      if (typeof snapData.totalPageViews === "number" && snapData.totalPageViews > globalAnalytics.totalPageViews) {
        globalAnalytics.totalPageViews = snapData.totalPageViews;
      }
      if (typeof snapData.totalProductClicks === "number" && snapData.totalProductClicks > globalAnalytics.totalProductClicks) {
        globalAnalytics.totalProductClicks = snapData.totalProductClicks;
      }
      if (Array.isArray(snapData.uniqueVisitors)) {
        for (const v of snapData.uniqueVisitors) {
          globalAnalytics.uniqueVisitors.add(v);
        }
      }
      if (snapData.productStats && typeof snapData.productStats === "object") {
        globalAnalytics.productStats = { ...globalAnalytics.productStats, ...snapData.productStats };
      }
      if (snapData.categoryStats && typeof snapData.categoryStats === "object") {
        globalAnalytics.categoryStats = { ...globalAnalytics.categoryStats, ...snapData.categoryStats };
      }
      if (snapData.dailyViews && typeof snapData.dailyViews === "object") {
        globalAnalytics.dailyViews = { ...globalAnalytics.dailyViews, ...snapData.dailyViews };
      }
    }
    isAnalyticsLoadedFromDb = true;
  } catch (err) {
    console.warn("[Analytics] Could not load persisted summary from Firestore:", err);
  }
}

let saveDebounceTimer: any = null;
function scheduleSaveAnalyticsToDb() {
  // Always persist to local disk immediately
  writeAnalyticsToDisk(globalAnalytics);

  if (saveDebounceTimer) return;
  saveDebounceTimer = setTimeout(async () => {
    saveDebounceTimer = null;
    try {
      const payload = {
        totalPageViews: globalAnalytics.totalPageViews,
        uniqueVisitors: Array.from(globalAnalytics.uniqueVisitors),
        totalProductClicks: globalAnalytics.totalProductClicks,
        productStats: globalAnalytics.productStats,
        categoryStats: globalAnalytics.categoryStats,
        dailyViews: globalAnalytics.dailyViews,
        lastUpdated: new Date().toISOString(),
      };
      if (adminDb) {
        await adminDb.collection(COLLECTIONS.ANALYTICS).doc("global_summary").set(payload, { merge: true });
        return;
      }
      if (db && isFirebaseConfigured()) {
        await setDoc(doc(db, COLLECTIONS.ANALYTICS, "global_summary"), payload, { merge: true });
      }
    } catch (err) {
      console.warn("[Analytics] Could not save summary to Firestore:", err);
    }
  }, 2000);
}

export async function GET(request: NextRequest) {
  try {
    await syncAnalyticsWithFirestore();

    const topClickedProducts = Object.values(globalAnalytics.productStats).sort(
      (a, b) => b.clicks - a.clicks
    );

    const totalClicks = globalAnalytics.totalProductClicks;

    // Calculate Category distribution percentage
    const categoryBreakdown = Object.entries(globalAnalytics.categoryStats).map(
      ([cat, count]) => ({
        category: cat,
        count,
        percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
      })
    );

    const todayKey = new Date().toISOString().split("T")[0];

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPageViews: globalAnalytics.totalPageViews,
          uniqueVisitorsCount: globalAnalytics.uniqueVisitors.size,
          totalProductClicks: totalClicks,
          activeTodayViews: globalAnalytics.dailyViews[todayKey] || 0,
        },
        topClickedProducts,
        categoryBreakdown,
        userStats: Object.values(globalAnalytics.userStats),
        popularTags: [],
      },
    });
  } catch (error: any) {
    console.error("[ANALYTICS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al recuperar analítica de usuario" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = Array.isArray(body?.events) ? body.events : [body];

    const todayKey = new Date().toISOString().split("T")[0];
    if (!globalAnalytics.dailyViews[todayKey]) {
      globalAnalytics.dailyViews[todayKey] = 0;
    }

    for (const ev of events) {
      if (!ev) continue;

      if (ev.visitorId) {
        globalAnalytics.uniqueVisitors.add(ev.visitorId);
      }

      if (ev.userId) {
        if (!globalAnalytics.userStats[ev.userId]) {
          globalAnalytics.userStats[ev.userId] = {
            userId: ev.userId,
            visitsCount: 0,
            clicksCount: 0,
            lastVisitAt: Date.now(),
          };
        }
        globalAnalytics.userStats[ev.userId].lastVisitAt = ev.timestamp || Date.now();
      }

      if (ev.type === "PAGE_VIEW") {
        globalAnalytics.totalPageViews++;
        globalAnalytics.dailyViews[todayKey]++;
        if (ev.userId && globalAnalytics.userStats[ev.userId]) {
          globalAnalytics.userStats[ev.userId].visitsCount++;
        }
      } else if (ev.type === "PRODUCT_CLICK" || ev.type === "PRODUCT_VIEW") {
        const sku = ev.productSku;
        if (sku) {
          if (!globalAnalytics.productStats[sku]) {
            globalAnalytics.productStats[sku] = {
              sku,
              name: ev.productName || sku,
              category: ev.category || "GENERAL",
              price: ev.price || 0,
              clicks: 0,
              views: 0,
              lastInteractionAt: ev.timestamp || Date.now(),
            };
          }

          if (ev.type === "PRODUCT_CLICK") {
            globalAnalytics.productStats[sku].clicks++;
            globalAnalytics.totalProductClicks++;
            const cat = ev.category || "GENERAL";
            globalAnalytics.categoryStats[cat] = (globalAnalytics.categoryStats[cat] || 0) + 1;

            if (ev.userId && globalAnalytics.userStats[ev.userId]) {
              globalAnalytics.userStats[ev.userId].clicksCount++;
            }
          } else {
            globalAnalytics.productStats[sku].views++;
          }
          globalAnalytics.productStats[sku].lastInteractionAt = ev.timestamp || Date.now();
        }
      }
    }

    // Persist immediately to disk and queue Firestore write
    scheduleSaveAnalyticsToDb();

    return NextResponse.json({ success: true, processedCount: events.length });
  } catch (error: any) {
    console.warn("[ANALYTICS_POST_WARNING]", error);
    return NextResponse.json({ success: false, error: "Event ingestion error" }, { status: 400 });
  }
}
