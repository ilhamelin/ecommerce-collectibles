import { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "./adminSessionToken";

/** Administrative authority comes exclusively from a verified server-issued cookie. */
export async function verifyAdminAuthorization(req: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  const session = await verifyAdminSessionToken(req.cookies.get("omni_admin_session")?.value);
  return session.valid && session.role === "ADMIN"
    ? { authorized: true }
    : { authorized: false, reason: "Acceso restringido: Se requiere una sesión administrativa válida." };
}

/** Same-origin fetch sends the HttpOnly session cookie automatically. */
export function getAdminHeaders(): Record<string, string> {
  return {};
}
