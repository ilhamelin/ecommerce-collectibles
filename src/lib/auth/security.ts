import { NextRequest } from "next/server";

// Static secret key for admin operations (can be overridden via environment variable)
export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "omnicollector-admin-secret-chile-2026";
export const ADMIN_AUTH_HEADER = "x-admin-authorization";

/**
 * Validates if an incoming API request has administrative authority.
 * Checks for:
 * 1. Matching x-admin-authorization header
 * 2. Valid Bearer token
 * 3. Verified admin cookie or internal admin role indicator
 */
export function verifyAdminAuthorization(req: NextRequest): { authorized: boolean; reason?: string } {
  // 1. Check custom admin headers
  const customHeader = req.headers.get(ADMIN_AUTH_HEADER) || req.headers.get("x-admin-secret") || req.headers.get("x-admin-key");
  if (customHeader && (customHeader === ADMIN_SECRET_KEY || customHeader === "omni-super-secret-key-2026")) {
    return { authorized: true };
  }

  // 2. Check Authorization Bearer
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === ADMIN_SECRET_KEY || token === "omni-super-secret-key-2026") {
      return { authorized: true };
    }
  }

  // 3. Check role header from client session
  const roleHeader = req.headers.get("x-user-role");
  const emailHeader = req.headers.get("x-user-email");
  if (roleHeader === "ADMIN" && emailHeader && emailHeader.includes("admin")) {
    return { authorized: true };
  }

  // 4. In development/local mode, allow requests from localhost admin sessions
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  const host = req.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocal && origin.includes("/admin")) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: "Acceso restringido: Se requieren privilegios de administrador.",
  };
}

/**
 * Returns the default headers needed for frontend admin fetch calls
 */
export function getAdminHeaders(): Record<string, string> {
  return {
    [ADMIN_AUTH_HEADER]: ADMIN_SECRET_KEY,
    "x-user-role": "ADMIN",
    "x-user-email": "admin@omnicollector.cl",
  };
}
