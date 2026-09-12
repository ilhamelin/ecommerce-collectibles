import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { db, isFirebaseConfigured } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

interface ActiveSessionRecord {
  email: string;
  deviceId: string;
  deviceName: string;
  lastActiveAt: number;
  ip?: string;
}

// In-memory cache for ultra-low latency & serverless instances
const memoryActiveSessions = new Map<string, ActiveSessionRecord>();

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours of inactivity before auto-release

async function getStoredSession(email: string): Promise<ActiveSessionRecord | null> {
  const cleanEmail = email.toLowerCase().trim();
  
  // 1. Check memory cache first
  const mem = memoryActiveSessions.get(cleanEmail);
  if (mem) {
    if (Date.now() - mem.lastActiveAt < SESSION_TIMEOUT_MS) {
      return mem;
    } else {
      memoryActiveSessions.delete(cleanEmail);
    }
  }

  // 2. Check Server Admin SDK
  if (typeof window === "undefined" && adminDb) {
    try {
      const snap = await adminDb.collection("active_sessions").doc(cleanEmail).get();
      if (snap.exists) {
        const data = snap.data() as ActiveSessionRecord;
        if (Date.now() - data.lastActiveAt < SESSION_TIMEOUT_MS) {
          memoryActiveSessions.set(cleanEmail, data);
          return data;
        } else {
          await snap.ref.delete().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[Session API] Firestore admin error:", err);
    }
  }

  // 3. Check Client SDK
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDoc(doc(db, "active_sessions", cleanEmail));
      if (snap.exists()) {
        const data = snap.data() as ActiveSessionRecord;
        if (Date.now() - data.lastActiveAt < SESSION_TIMEOUT_MS) {
          memoryActiveSessions.set(cleanEmail, data);
          return data;
        } else {
          await deleteDoc(doc(db, "active_sessions", cleanEmail)).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[Session API] Firestore client error:", err);
    }
  }

  return null;
}

async function saveStoredSession(session: ActiveSessionRecord): Promise<void> {
  const cleanEmail = session.email.toLowerCase().trim();
  memoryActiveSessions.set(cleanEmail, session);

  if (typeof window === "undefined" && adminDb) {
    try {
      await adminDb.collection("active_sessions").doc(cleanEmail).set(session, { merge: true });
    } catch (err) {
      console.warn("[Session API] Error saving admin session:", err);
    }
  } else if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, "active_sessions", cleanEmail), session, { merge: true });
    } catch (err) {
      console.warn("[Session API] Error saving client session:", err);
    }
  }
}

async function deleteStoredSession(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  memoryActiveSessions.delete(cleanEmail);

  if (typeof window === "undefined" && adminDb) {
    try {
      await adminDb.collection("active_sessions").doc(cleanEmail).delete();
    } catch (err) {
      console.warn("[Session API] Error deleting admin session:", err);
    }
  } else if (db && isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, "active_sessions", cleanEmail));
    } catch (err) {
      console.warn("[Session API] Error deleting client session:", err);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, deviceId, deviceName } = body;

    if (!email || !deviceId) {
      return NextResponse.json(
        { success: false, error: "Email y deviceId son obligatorios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanDeviceId = String(deviceId).trim();
    const cleanDeviceName = deviceName ? String(deviceName).trim() : "Navegador Web";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

    const currentSession = await getStoredSession(cleanEmail);

    // ACTION: LOGIN_CHECK
    if (action === "LOGIN_CHECK") {
      if (currentSession && currentSession.deviceId !== cleanDeviceId) {
        const minutesAgo = Math.max(1, Math.round((Date.now() - currentSession.lastActiveAt) / (1000 * 60)));
        return NextResponse.json(
          {
            success: false,
            code: "ACTIVE_SESSION_EXISTS",
            error: `Esta cuenta ya tiene una sesión activa en otro dispositivo (${currentSession.deviceName}). Para evitar colisiones y duplicidad en los eventos, el usuario debe cerrar sesión en ese dispositivo primero.`,
            activeDevice: currentSession.deviceName,
            lastSeenMinutesAgo: minutesAgo,
          },
          { status: 409 }
        );
      }

      // Claim or renew session for this device
      const newSession: ActiveSessionRecord = {
        email: cleanEmail,
        deviceId: cleanDeviceId,
        deviceName: cleanDeviceName,
        lastActiveAt: Date.now(),
        ip,
      };
      await saveStoredSession(newSession);

      return NextResponse.json({
        success: true,
        message: "Sesión autorizada exclusivamente en este dispositivo.",
        session: newSession,
      });
    }

    // ACTION: LOGOUT
    if (action === "LOGOUT") {
      if (currentSession && currentSession.deviceId === cleanDeviceId) {
        await deleteStoredSession(cleanEmail);
      } else if (!currentSession) {
        await deleteStoredSession(cleanEmail);
      }
      return NextResponse.json({
        success: true,
        message: "Sesión cerrada correctamente. La cuenta está libre para ser utilizada.",
      });
    }

    // ACTION: FORCE_LOGOUT (Emergency override for account owner/admin)
    if (action === "FORCE_LOGOUT") {
      const newSession: ActiveSessionRecord = {
        email: cleanEmail,
        deviceId: cleanDeviceId,
        deviceName: cleanDeviceName,
        lastActiveAt: Date.now(),
        ip,
      };
      await saveStoredSession(newSession);
      return NextResponse.json({
        success: true,
        message: "Sesión anterior cerrada remotamente. Acceso concedido a este dispositivo.",
        session: newSession,
      });
    }

    // ACTION: HEARTBEAT (Refresh session timestamp)
    if (action === "HEARTBEAT") {
      if (currentSession && currentSession.deviceId === cleanDeviceId) {
        currentSession.lastActiveAt = Date.now();
        await saveStoredSession(currentSession);
        return NextResponse.json({ success: true, active: true });
      }
      return NextResponse.json({ success: false, active: false });
    }

    return NextResponse.json(
      { success: false, error: `Acción '${action}' no reconocida.` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API_AUTH_SESSION_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al gestionar la sesión.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
