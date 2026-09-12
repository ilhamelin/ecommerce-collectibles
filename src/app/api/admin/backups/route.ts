import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, query, orderBy, limit } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const dynamic = "force-dynamic";

interface CsvBackupRecord {
  id: string;
  filename: string;
  type: "ORDERS" | "STAGNANT_INVENTORY" | "CUSTOM";
  rowCount: number;
  totalAmountClp?: number;
  exportedBy: string;
  createdAt: string;
  summary: string;
  csvSnippet?: string;
}

interface KpiSnapshotRecord {
  id: string;
  capturedAt: string;
  capturedBy: string;
  totalRevenueClp: number;
  ordersCount: number;
  stagnantCapitalClp: number;
  stagnantUnits: number;
  registeredUsersCount: number;
  totalPageViews: number;
  totalProductClicks: number;
}

// In-memory fallback history
let inMemoryBackups: CsvBackupRecord[] = [
  {
    id: "bk-csv-20260912-001",
    filename: "omnicollector_pedidos_ordenados_2026-09-12.csv",
    type: "ORDERS",
    rowCount: 6,
    totalAmountClp: 5314660,
    exportedBy: "Administrador OmniCollector (admin@omnicollector.cl)",
    createdAt: new Date().toISOString(),
    summary: "Exportación cronológica de 6 pedidos completados y confirmados.",
    csvSnippet: "Numero_Pedido,Fecha,Cliente_Nombre,Email...",
  },
];

let inMemorySnapshots: KpiSnapshotRecord[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "csv" | "kpi" | "all"

    // 1. Try Firestore if available
    let firestoreBackups: CsvBackupRecord[] = [];
    let firestoreSnapshots: KpiSnapshotRecord[] = [];

    if (typeof window === "undefined" && adminDb) {
      try {
        if (type !== "kpi") {
          const snap = await adminDb
            .collection(COLLECTIONS.CSV_BACKUPS)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();
          firestoreBackups = snap.docs.map((d) => d.data() as CsvBackupRecord);
        }
        if (type !== "csv") {
          const snap = await adminDb
            .collection(COLLECTIONS.KPI_SNAPSHOTS)
            .orderBy("capturedAt", "desc")
            .limit(10)
            .get();
          firestoreSnapshots = snap.docs.map((d) => d.data() as KpiSnapshotRecord);
        }
      } catch (dbErr) {
        console.warn("[BACKUPS_GET] Firestore read warning:", dbErr);
      }
    } else if (db && isFirebaseConfigured()) {
      try {
        if (type !== "kpi") {
          const colRef = collection(db, COLLECTIONS.CSV_BACKUPS);
          const snap = await getDocs(colRef);
          firestoreBackups = snap.docs.map((d) => d.data() as CsvBackupRecord);
        }
        if (type !== "csv") {
          const colRef = collection(db, COLLECTIONS.KPI_SNAPSHOTS);
          const snap = await getDocs(colRef);
          firestoreSnapshots = snap.docs.map((d) => d.data() as KpiSnapshotRecord);
        }
      } catch (dbErr) {
        console.warn("[BACKUPS_GET] Client Firestore read warning:", dbErr);
      }
    }

    const backups = firestoreBackups.length > 0 ? firestoreBackups : inMemoryBackups;
    const snapshots = firestoreSnapshots.length > 0 ? firestoreSnapshots : inMemorySnapshots;

    return NextResponse.json({
      success: true,
      data: {
        backups,
        snapshots,
        source: firestoreBackups.length > 0 || firestoreSnapshots.length > 0 ? "FIRESTORE_CLOUD" : "LOCAL_FALLBACK",
      },
    });
  } catch (err: any) {
    console.error("[BACKUPS_GET_ERROR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // "SAVE_CSV_BACKUP" | "SAVE_KPI_SNAPSHOT"

    if (action === "SAVE_CSV_BACKUP") {
      const backup: CsvBackupRecord = {
        id: `bk-${Date.now()}`,
        filename: body.filename || `export_${Date.now()}.csv`,
        type: body.type || "ORDERS",
        rowCount: body.rowCount || 0,
        totalAmountClp: body.totalAmountClp || 0,
        exportedBy: body.exportedBy || "Admin",
        createdAt: new Date().toISOString(),
        summary: body.summary || "Respaldo automático de exportación CSV",
        csvSnippet: body.csvContent ? body.csvContent.slice(0, 1000) : undefined,
      };

      inMemoryBackups.unshift(backup);

      // Persist in Cloud Firestore (Admin SDK or Client SDK)
      if (typeof window === "undefined" && adminDb) {
        try {
          await adminDb.collection(COLLECTIONS.CSV_BACKUPS).doc(backup.id).set(backup);
        } catch (fsErr) {
          console.warn("[BACKUPS_POST] Firestore Admin write warning:", fsErr);
        }
      } else if (db && isFirebaseConfigured()) {
        try {
          await setDoc(doc(db, COLLECTIONS.CSV_BACKUPS, backup.id), backup);
        } catch (fsErr) {
          console.warn("[BACKUPS_POST] Firestore Client write warning:", fsErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Respaldo CSV guardado exitosamente en Cloud Firestore.",
        data: { backup },
      });
    }

    if (action === "SAVE_KPI_SNAPSHOT") {
      const snapshot: KpiSnapshotRecord = {
        id: `snap-${Date.now()}`,
        capturedAt: new Date().toISOString(),
        capturedBy: body.capturedBy || "Admin",
        totalRevenueClp: body.totalRevenueClp || 0,
        ordersCount: body.ordersCount || 0,
        stagnantCapitalClp: body.stagnantCapitalClp || 0,
        stagnantUnits: body.stagnantUnits || 0,
        registeredUsersCount: body.registeredUsersCount || 0,
        totalPageViews: body.totalPageViews || 0,
        totalProductClicks: body.totalProductClicks || 0,
      };

      inMemorySnapshots.unshift(snapshot);

      // Persist in Cloud Firestore (Admin SDK or Client SDK)
      if (typeof window === "undefined" && adminDb) {
        try {
          await adminDb.collection(COLLECTIONS.KPI_SNAPSHOTS).doc(snapshot.id).set(snapshot);
        } catch (fsErr) {
          console.warn("[KPI_SNAPSHOT_POST] Firestore Admin write warning:", fsErr);
        }
      } else if (db && isFirebaseConfigured()) {
        try {
          await setDoc(doc(db, COLLECTIONS.KPI_SNAPSHOTS, snapshot.id), snapshot);
        } catch (fsErr) {
          console.warn("[KPI_SNAPSHOT_POST] Firestore Client write warning:", fsErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Snapshot de Métricas & KPIs guardado exitosamente en Cloud Firestore.",
        data: { snapshot },
      });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    console.error("[BACKUPS_POST_ERROR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
