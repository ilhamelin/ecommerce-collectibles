import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/lib/auth/adminSessionToken";
import { isConfiguredAdminEmail } from "@/lib/auth/adminRoles";
import { adminAuth } from "@/lib/firebase/admin";
import { createHash, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "omni_admin_session";
const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours

/**
 * GET /api/auth/admin-session
 * Verifies if the incoming request has a cryptographically valid admin session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const verification = await verifyAdminSessionToken(token);

    if (!verification.valid) {
      return NextResponse.json(
        { authenticated: false, error: verification.error || "No autorizado." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      email: verification.email,
      role: verification.role,
    });
  } catch (error) {
    console.error("[ADMIN_SESSION_GET_ERROR]", error);
    return NextResponse.json(
      { authenticated: false, error: "Error interno al verificar sesión." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/admin-session
 * Issues an HttpOnly cryptographically signed admin session cookie upon verified authorization.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Solicitud inválida." }, { status: 400 });
    }
    const credentials = body as Record<string, unknown>;
    let email = "";
    if (typeof credentials.idToken === "string") {
      if (!adminAuth) {
        return NextResponse.json({ success: false, error: "Firebase Admin no está configurado." }, { status: 503 });
      }
      try {
        const identity = await adminAuth.verifyIdToken(credentials.idToken, true);
        if (!identity.email_verified || !identity.email) {
          return NextResponse.json({ success: false, error: "Identidad no verificada." }, { status: 401 });
        }
        email = identity.email.trim().toLowerCase();
      } catch {
        return NextResponse.json({ success: false, error: "Credenciales inválidas." }, { status: 401 });
      }
    } else {
      // The portfolio demo is explicit in production and limited to one account.
      const demoPassword = process.env.ADMIN_DEMO_PASSWORD ||
        (process.env.NODE_ENV !== "production" ? "admin123" : "");
      const demoEmail = (process.env.ADMIN_DEMO_EMAIL || "admin@omnicollector.cl").trim().toLowerCase();
      const suppliedEmail = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const suppliedPassword = typeof credentials.password === "string" ? credentials.password : "";
      const digest = (value: string) => createHash("sha256").update(value).digest();
      if (!demoPassword || suppliedEmail !== demoEmail ||
          !timingSafeEqual(digest(suppliedPassword), digest(demoPassword))) {
        return NextResponse.json({ success: false, error: "Credenciales inválidas." }, { status: 401 });
      }
      email = demoEmail;
    }

    // Never trust a role stored in a client-writable profile or supplied in the body.
    if (!isConfiguredAdminEmail(email)) {
      return NextResponse.json({ success: false, error: "Acceso denegado.", code: "FORBIDDEN" }, { status: 403 });
    }

    const token = await createAdminSessionToken(email, COOKIE_MAX_AGE);
    const response = NextResponse.json({
      success: true,
      message: "Sesión de administrador firmada y autorizada exitosamente.",
      email,
      role: "ADMIN",
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("[ADMIN_SESSION_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al emitir sesión de administrador." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/admin-session
 * Revokes and deletes the admin session cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Sesión administrativa cerrada exitosamente.",
  });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
