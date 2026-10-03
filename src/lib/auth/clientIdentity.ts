"use client";
import { getFirebaseAuth, app } from "@/lib/firebase/config";
let appCheckPromise: Promise<import("firebase/app-check").AppCheck | null> | undefined;
/** A local portfolio account is never a cloud credential. */
export async function identityHeaders(includeAppCheck = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await getFirebaseAuth()?.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (includeAppCheck && app && process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY) {
    appCheckPromise ??= import("firebase/app-check").then(sdk => sdk.initializeAppCheck(app!, {
      provider: new sdk.ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY!),
      isTokenAutoRefreshEnabled: true,
    })).catch(() => null);
    const check = await appCheckPromise;
    if (check) {
      try { headers["X-Firebase-AppCheck"] = (await (await import("firebase/app-check")).getToken(check)).token; }
      catch { /* Enforced backends return an actionable error. */ }
    }
  }
  return headers;
}
