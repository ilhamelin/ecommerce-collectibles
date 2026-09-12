import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromFirestore,
  deleteUserFromFirestore,
  syncUserProfileToFirestore,
  getUsersFromFirestore,
} from "@/lib/firebase/firestore";
import { DEFAULT_USERS } from "@/lib/store/authStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("id") || searchParams.get("email");

    if (identifier) {
      // 1. Try Firestore first
      const firestoreUser = await getUserFromFirestore(identifier);
      if (firestoreUser) {
        return NextResponse.json({
          success: true,
          data: { user: firestoreUser, source: "FIRESTORE_CLOUD" },
        });
      }

      // 2. Fallback to default users list
      const clean = identifier.toLowerCase().trim();
      const fallbackUser = DEFAULT_USERS.find(
        (u) => u.id === identifier || u.email.toLowerCase() === clean
      );

      if (fallbackUser) {
        return NextResponse.json({
          success: true,
          data: { user: fallbackUser, source: "LOCAL_FALLBACK" },
        });
      }

      return NextResponse.json(
        { success: false, error: "Usuario no encontrado", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // List all users from Firestore or fallback
    const firestoreUsers = await getUsersFromFirestore();
    const users = firestoreUsers.length > 0 ? firestoreUsers : DEFAULT_USERS;

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: users.length,
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
    const body = await request.json();
    const { id, email, fullName, phone, rut, addresses, paymentMethods, wishlist } = body;

    if (!id && !email) {
      return NextResponse.json(
        { success: false, error: "Identificador (id o email) requerido", code: "MISSING_IDENTIFIER" },
        { status: 400 }
      );
    }

    // Lookup existing or create
    const existing = await getUserFromFirestore(id || email);
    const userToSave: any = {
      id: id || existing?.id || `usr-${Date.now()}`,
      email: (email || existing?.email || "").toLowerCase().trim(),
      fullName: fullName !== undefined ? fullName.trim() : (existing?.fullName || ""),
      phone: phone !== undefined ? phone.trim() : (existing?.phone || ""),
      rut: rut !== undefined ? rut.trim() : (existing?.rut || ""),
      role: existing?.role || "CUSTOMER",
      addresses: addresses !== undefined ? addresses : (existing?.addresses || []),
      paymentMethods: paymentMethods !== undefined ? paymentMethods : (existing?.paymentMethods || []),
      orders: existing?.orders || [],
      wishlist: wishlist !== undefined ? wishlist : (existing?.wishlist || []),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      data: { user: userToSave, syncedToFirestore: saved },
    });
  } catch (error) {
    console.error("[API_USERS_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar cuenta de usuario", code: "INTERNAL_ERROR" },
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
