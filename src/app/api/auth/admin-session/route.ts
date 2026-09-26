import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/lib/auth/adminSessionToken";
import { isConfiguredAdminEmail } from "@/lib/auth/adminRoles";
import { getUserFromFirestore } from "@/lib/firebase/firestore";
import { DEFAULT_USERS } from "@/lib/store/authStore";

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
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      role?: string;
    };

    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email de administrador requerido." },
        { status: 400 }
      );
    }

    // Verify admin eligibility:
    // 1. In configured admin whitelist
    const isWhitelisted = isConfiguredAdminEmail(email);

    // 2. Or in Firestore with role ADMIN
    let isDbAdmin = false;
    if (!isWhitelisted) {
      const userDoc = await getUserFromFirestore(email);
      if (userDoc && userDoc.role === "ADMIN") {
        isDbAdmin = true;
      } else {
        const memUser = DEFAULT_USERS.find((u) => u.email.toLowerCase() === email);
        if (memUser && memUser.role === "ADMIN") {
          isDbAdmin = true;
        }
      }
    }

    if (!isWhitelisted && !isDbAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: El correo no cuenta con privilegios administrativos.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
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
