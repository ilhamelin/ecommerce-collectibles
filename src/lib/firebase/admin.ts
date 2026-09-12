import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

export function isFirebaseAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || projectId.includes("tu-proyecto-id")) return false;
  return Boolean(clientEmail && privateKey);
}

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

if (typeof window === "undefined") {
  try {
    const existingApps = getApps();
    if (isFirebaseAdminConfigured()) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }

      if (existingApps.length === 0) {
        adminApp = initializeApp({
          credential: cert({
            projectId: projectId!,
            clientEmail: clientEmail!,
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
    console.warn("[Firebase Admin] Running in local fallback mode.", err);
  }
}

export { adminApp, adminDb, adminAuth };
