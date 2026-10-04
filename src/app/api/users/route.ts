import { adminDb } from "@/lib/firebase/admin";
import { collectorOwnerKey } from "@/lib/collector/storage";
import { requestIdentity } from "@/lib/auth/requestIdentity";
import { ProfileUpdateSchema } from "@/lib/auth/profileSchema";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { cleanupPersistedProductReferences } from "@/lib/firebase/productReferenceCleanup";
import { pruneOrderProductReferences } from "@/lib/services/productReferences";
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
      const identity = await requestIdentity(request);
      if (!identity) return NextResponse.json({ success: false, error: "Inicia sesión para consultar tu cuenta." }, { status: 401 });
      // 1. Try Firestore first
      const firestoreUser = await getUserFromFirestore(identifier);
      if (firestoreUser) {
        if (!identity.admin && identity.uid !== firestoreUser.id && (!identity.email || identity.email !== firestoreUser.email.toLowerCase())) return NextResponse.json({ success: false, error: "Acceso denegado." }, { status: 403 });
        const products = await getProductsFromFirestore(true);
        if (products !== null) {
          const ids = new Set(products.map(product => product.id));
          firestoreUser.wishlist = (firestoreUser.wishlist || []).filter(id => ids.has(id));
          firestoreUser.orders = pruneOrderProductReferences(firestoreUser.orders || [], products);
          await cleanupPersistedProductReferences(products, firestoreUser.id);
        }
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
        if (!identity.admin && identity.uid !== fallbackUser.id && (!identity.email || identity.email !== fallbackUser.email.toLowerCase())) return NextResponse.json({ success: false, error: "Acceso denegado." }, { status: 403 });
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
    const authCheck = await verifyAdminAuthorization(request);
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
    const identity = await requestIdentity(request);
    if (!identity) return NextResponse.json({ success: false, error: "Inicia sesión para guardar tu cuenta." }, { status: 401 });
    const parsed = ProfileUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Perfil inválido." }, { status: 400 });
    const body = parsed.data;
    const { id, email, fullName, phone, rut, addresses, paymentMethods, wishlist, role } = body;

    if (!id && !email) {
      return NextResponse.json(
        { success: false, error: "Identificador (id o email) requerido", code: "MISSING_IDENTIFIER" },
        { status: 400 }
      );
    }

    // Lookup existing or create
    const cleanEmail = (email || "").toLowerCase().trim();
    const existingById = await getUserFromFirestore(id || cleanEmail);
    const existing = existingById || (identity.email && identity.email === cleanEmail ? await getUserFromFirestore(cleanEmail) : null);
    if (!identity.admin && ((existing && existing.id !== identity.uid && (!identity.email || existing.email.toLowerCase() !== identity.email)) || (email && cleanEmail !== identity.email) || (!existing && id && id !== identity.uid))) return NextResponse.json({ success: false, error: "No puedes modificar otra cuenta." }, { status: 403 });

    // Only allow setting role if authorized admin
    let resolvedRole: "ADMIN" | "CUSTOMER" = existing?.role || "CUSTOMER";
    if (role && (role === "ADMIN" || role === "CUSTOMER")) {
      const authCheck = await verifyAdminAuthorization(request);
      if (authCheck.authorized) {
        resolvedRole = role;
      }
    }
    if (identity.admin && isConfiguredAdminEmail(cleanEmail || existing?.email)) {
      resolvedRole = "ADMIN";
    }

    const userToSave: UserAccount = {
      id: existing?.id || (identity.admin ? id || identity.uid : identity.uid),
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
    if (!saved) return NextResponse.json({ success: false, error: "No se guardó el perfil. La base de datos no está disponible." }, { status: 503 });

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
    const authCheck = await verifyAdminAuthorization(request);
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

    const identity = await requestIdentity(request);
    if (!identity) return NextResponse.json({ success: false, error: "Sesión requerida." }, { status: 401 });
    const target = await getUserFromFirestore(id);
    if (!identity.admin && (!target || (target.id !== identity.uid && (!identity.email || target.email.toLowerCase() !== identity.email)))) return NextResponse.json({ success: false, error: "Acceso denegado." }, { status: 403 });
    // Remove both Firebase-owner and signed-session variants before deleting the profile.
    if (adminDb && target) {
      const keys = new Set([
        collectorOwnerKey({ uid: target.id, email: target.email }),
        collectorOwnerKey({ uid: "", email: target.email.toLowerCase().trim() }),
      ]);
      if (!identity.admin && identity.uid) keys.add(collectorOwnerKey(identity));
      const batch = adminDb.batch();
      for (const key of keys) batch.delete(adminDb.collection("collector_profiles").doc(key));
      await batch.commit();
    }
    const deletedInFirestore = await deleteUserFromFirestore(target?.id || id);
    if (!deletedInFirestore) return NextResponse.json({ success: false, error: "La cuenta no se eliminó de la base de datos." }, { status: 503 });

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
