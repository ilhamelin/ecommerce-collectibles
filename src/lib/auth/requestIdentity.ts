import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { verifyAdminSessionToken } from "./adminSessionToken";

/** Only signed server sessions and verified Firebase tokens establish identity. */
export async function requestIdentity(request: NextRequest) {
  const session = await verifyAdminSessionToken(request.cookies.get("omni_admin_session")?.value);
  if (session.valid && session.role === "ADMIN" && session.email) {
    return { uid: "", email: session.email.toLowerCase(), admin: true };
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token || !adminAuth) return null;
  try {
    const identity = await adminAuth.verifyIdToken(token, true);
    return { uid: identity.uid, email: identity.email_verified ? identity.email?.toLowerCase() || "" : "", admin: false };
  } catch { return null; }
}
