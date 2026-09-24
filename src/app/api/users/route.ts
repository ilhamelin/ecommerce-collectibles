import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromFirestore,
  deleteUserFromFirestore,
  syncUserProfileToFirestore,
  getUsersFromFirestore,
} from "@/lib/firebase/firestore";
import { DEFAULT_USERS, UserAccount } from "@/lib/store/authStore";
import { sanitizeUserOutput, sanitizeText } from "@/lib/utils/sanitizer";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { isConfiguredAdminEmail } from "@/lib/auth/adminRoles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("id") || searchParams.get("email");

    if (identifier) {
      // 1. Try Firestore first
      const firestoreUser = await getUserFromFirestore(identifier);
      if (firestoreUser) {
        const isPermAdmin = isConfiguredAdminEmail(firestoreUser.email);
        const resolvedRole = isPermAdmin ? "ADMIN" : (firestoreUser.role || "CUSTOMER");
        return NextResponse.json({
          success: true,
          data: { user: sanitizeUserOutput({ ...firestoreUser, role: resolvedRole }), source: "FIRESTORE_CLOUD" },
        });
      }

      // 2. Fallback to default users list
      const clean = identifier.toLowerCase().trim();
      const fallbackUser = DEFAULT_USERS.find(
        (u) => u.id === identifier || u.email.toLowerCase() === clean
      );

      if (fallbackUser) {
        const isPermAdmin = isConfiguredAdminEmail(fallbackUser.email);
        const resolvedRole = isPermAdmin ? "ADMIN" : (fallbackUser.role || "CUSTOMER");
        return NextResponse.json({
          success: true,
          data: { user: sanitizeUserOutput({ ...fallbackUser, role: resolvedRole }), source: "LOCAL_FALLBACK" },
        });
      }

      return NextResponse.json(
        { success: false, error: "Usuario no encontrado", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // SECURITY: Listing all registered users requires verified Admin Authorization
    const authCheck = verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren privilegios de administrador para listar la base de datos de usuarios.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // List all users for authorized admin (with sensitive fields like passwords stripped)
    const firestoreUsers = await getUsersFromFirestore();
    const rawUsers = firestoreUsers.length > 0 ? firestoreUsers : DEFAULT_USERS;
    const safeUsers = rawUsers.map((u) => {
      const isPermAdmin = isConfiguredAdminEmail(u.email);
      const resolvedRole = isPermAdmin ? "ADMIN" : (u.role || "CUSTOMER");
      return sanitizeUserOutput({ ...u, role: resolvedRole });
    });

    return NextResponse.json({
      success: true,
      data: {
        users: safeUsers,
        total: safeUsers.length,
        source: firestoreUsers.length > 0 ? "FIRESTORE_CLOUD" : "LOCAL_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[API_USERS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar usuarios", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<UserAccount>;
    const { id, email, fullName, phone, rut, addresses, paymentMethods, wishlist, role } = body;

    if (!id && !email) {
      return NextResponse.json(
        { success: false, error: "Identificador (id o email) requerido", code: "MISSING_IDENTIFIER" },
        { status: 400 }
      );
    }

    // Lookup existing or create
    const cleanEmail = (email || "").toLowerCase().trim();
    const existing = await getUserFromFirestore(id || cleanEmail);

    // Only allow setting role if authorized admin
    let resolvedRole: "ADMIN" | "CUSTOMER" = existing?.role || "CUSTOMER";
    if (role && (role === "ADMIN" || role === "CUSTOMER")) {
      const authCheck = verifyAdminAuthorization(request);
      if (authCheck.authorized) {
        resolvedRole = role;
      }
    }
    if (isConfiguredAdminEmail(cleanEmail || existing?.email)) {
      resolvedRole = "ADMIN";
    }

    const userToSave: UserAccount = {
      id: id || existing?.id || `usr-${Date.now()}`,
      email: cleanEmail || existing?.email || "",
      fullName: fullName !== undefined ? sanitizeText(fullName) : (existing?.fullName || ""),
      phone: phone !== undefined ? sanitizeText(phone) : (existing?.phone || ""),
      rut: rut !== undefined ? sanitizeText(rut) : (existing?.rut || ""),
      role: resolvedRole,
      addresses: addresses !== undefined ? addresses : (existing?.addresses || []),
      paymentMethods: paymentMethods !== undefined ? paymentMethods : (existing?.paymentMethods || []),
      orders: existing?.orders || [],
      wishlist: wishlist !== undefined ? wishlist : (existing?.wishlist || []),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    const saved = await syncUserProfileToFirestore(userToSave);

    // Also update default users in-memory fallback
    const index = DEFAULT_USERS.findIndex((u) => u.id === userToSave.id || u.email.toLowerCase() === userToSave.email.toLowerCase());
    if (index >= 0) {
      DEFAULT_USERS[index] = { ...DEFAULT_USERS[index], ...userToSave };
    } else {
      DEFAULT_USERS.push(userToSave);
    }

    return NextResponse.json({
      success: true,
      message: "Datos de cuenta actualizados exitosamente en Cloud Firestore.",
      data: { user: sanitizeUserOutput(userToSave), syncedToFirestore: saved },
    });
  } catch (error) {
    console.error("[API_USERS_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar cuenta de usuario", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users
 * Promotes or demotes user administrative roles.
 * Protected by admin authorization.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authCheck = verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren privilegios de administrador para modificar roles de usuario.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { id?: string; email?: string; role?: string };
    const { id, email, role } = body;

    if ((!id && !email) || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "Parámetros incompletos: se requiere 'id' o 'email', y el campo 'role' ('ADMIN' | 'CUSTOMER').",
          code: "INVALID_PARAMETERS",
        },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "CUSTOMER") {
      return NextResponse.json(
        {
          success: false,
          error: "Rol no válido. Los roles admitidos son 'ADMIN' o 'CUSTOMER'.",
          code: "INVALID_ROLE",
        },
        { status: 400 }
      );
    }

    const targetIdentifier = id || email || "";
    const cleanEmail = (email || "").toLowerCase().trim();

    // Prevent demoting root admin
    if (
      (cleanEmail === "admin@omnicollector.cl" || targetIdentifier === "usr-admin-01") &&
      role === "CUSTOMER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "La cuenta raíz 'admin@omnicollector.cl' no puede ser degradada a cliente.",
          code: "ROOT_ADMIN_IMMUTABLE",
        },
        { status: 400 }
      );
    }

    const existing = await getUserFromFirestore(targetIdentifier);
    const index = DEFAULT_USERS.findIndex(
      (u) => u.id === targetIdentifier || u.email.toLowerCase() === cleanEmail || (existing && u.id === existing.id)
    );

    const baseUser = existing || (index >= 0 ? DEFAULT_USERS[index] : null);
    if (!baseUser) {
      return NextResponse.json(
        {
          success: false,
          error: `Usuario '${targetIdentifier}' no encontrado en el sistema.`,
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const updatedUser: UserAccount = {
      ...baseUser,
      role: role as "ADMIN" | "CUSTOMER",
    };

    const synced = await syncUserProfileToFirestore(updatedUser);

    if (index >= 0) {
      DEFAULT_USERS[index] = { ...DEFAULT_USERS[index], ...updatedUser };
    } else {
      DEFAULT_USERS.push(updatedUser);
    }

    return NextResponse.json({
      success: true,
      message: `Rol del usuario '${updatedUser.email}' actualizado exitosamente a '${role}'.`,
      data: {
        user: sanitizeUserOutput(updatedUser),
        syncedToFirestore: synced,
      },
    });
  } catch (error) {
    console.error("[API_USERS_PATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar rol del usuario", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("email");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID o correo de usuario requerido para eliminación.", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    // 1. Delete in Firestore
    const deletedInFirestore = await deleteUserFromFirestore(id);

    // 2. Remove from default users array
    const clean = id.toLowerCase().trim();
    const idx = DEFAULT_USERS.findIndex(
      (u) => u.id === id || u.email.toLowerCase() === clean
    );
    if (idx >= 0) {
      DEFAULT_USERS.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: `Cuenta '${id}' eliminada exitosamente de Cloud Firestore.`,
      data: { id, deletedInFirestore },
    });
  } catch (error) {
    console.error("[API_USERS_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la cuenta de usuario", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
