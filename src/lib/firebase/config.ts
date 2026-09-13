import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

/**
 * Checks if real Firebase credentials are configured in the environment.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim() !== "" &&
    !firebaseConfig.apiKey.includes("AIzaSyA_TU_API_KEY_AQUI") &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim() !== "" &&
    !firebaseConfig.projectId.includes("tu-proyecto-id")
  );
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== "undefined" || process.env.NODE_ENV !== "test") {
  if (isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      try {
        db = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        });
      } catch {
        db = getFirestore(app);
      }
      auth = getAuth(app);
      storage = getStorage(app);
    } catch (err) {
      console.warn("[Firebase Client] Error initializing Firebase client:", err);
    }
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  if (typeof window !== "undefined" && isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      return auth;
    } catch (err) {
      console.warn("[Firebase Client] Error getting Firebase Auth instance:", err);
      return null;
    }
  }
  return null;
}

export { app, db, auth, storage };
