import { normalizeFirebasePrivateKey } from "./adminCredentials";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

export function isFirebaseAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || projectId.includes("tu-proyecto-id")) return false;
  return Boolean(clientEmail && privateKey);
}

let initializationFailed = false;

/** Safe diagnostic: never includes credential values or raw SDK errors. */
export function getFirebaseAdminUnavailableMessage(): string {
  const missing = [
    !(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)?.trim() && "FIREBASE_PROJECT_ID",
    !process.env.FIREBASE_CLIENT_EMAIL?.trim() && "FIREBASE_CLIENT_EMAIL",
    !process.env.FIREBASE_PRIVATE_KEY?.trim() && "FIREBASE_PRIVATE_KEY",
  ].filter(Boolean);
  if (missing.length) return `Firebase Admin: el servidor no recibió ${missing.join(", ")}. Revisa el entorno del despliegue y vuelve a desplegar.`;
  if (initializationFailed) return "Las variables de Firebase están presentes, pero Firebase Admin no pudo inicializarse. Revisa el formato de la clave privada y los logs del servidor.";
  return "Firebase Admin no está disponible. Revisa la configuración y los logs del servidor.";
}

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

if (typeof window === "undefined") {
  try {
    if (isFirebaseAdminConfigured()) {
      // Lazy load firestore and auth modules only when credentials are valid
      // preventing "Cannot find module @google-cloud/firestore" in CI/testing
      const { getFirestore } = require("firebase-admin/firestore");
      const { getAuth } = require("firebase-admin/auth");

      const existingApps = getApps();
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) {
        privateKey = normalizeFirebasePrivateKey(privateKey);
      }

      if (existingApps.length === 0) {
        adminApp = initializeApp({
          credential: cert({
            projectId: projectId!.trim(),
            clientEmail: clientEmail!.trim(),
            privateKey: privateKey!,
          }),
        });
      } else {
        adminApp = existingApps[0];
      }

      adminDb = getFirestore(adminApp);
      adminAuth = getAuth(adminApp);
    }
  } catch (err) {
    initializationFailed = true;
    // SDK messages may contain input fragments; only expose the error class/code.
    const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "initialization-error";
    console.error("[Firebase Admin] Initialization failed", { code, errorType: err instanceof Error ? err.name : "UnknownError" });
  }
}

export { adminApp, adminDb, adminAuth };
