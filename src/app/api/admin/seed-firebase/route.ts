import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { seedProductsToFirestore, seedUsersToFirestore } from "@/lib/firebase/firestore";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { DEFAULT_USERS } from "@/lib/store/authStore";

export async function GET() {
  const clientConfigured = isFirebaseConfigured();
  const adminConfigured = isFirebaseAdminConfigured();

  return NextResponse.json({
    success: true,
    status: {
      firebaseClientConfigured: clientConfigured,
      firebaseAdminConfigured: adminConfigured,
      mode: (clientConfigured || adminConfigured) ? "FIREBASE_CLOUD" : "LOCAL_FALLBACK",
      message: (clientConfigured || adminConfigured)
        ? "Conexión a Firebase activa y disponible."
        : "Operando en modo local (fallback). Para conectar a Firebase real, ingresa tus credenciales en .env.local",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const repo = CatalogRepository.getInstance();
    const products = repo.getAll();

    const clientConfigured = isFirebaseConfigured();
    const adminConfigured = isFirebaseAdminConfigured();

    if (!clientConfigured && !adminConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase aún no tiene credenciales configuradas en .env.local",
          hint: "Crea tu proyecto en https://console.firebase.google.com/ y completa los valores en .env.local",
          mode: "LOCAL_FALLBACK",
          totalProductsReadyToSync: products.length,
        },
        { status: 400 }
      );
    }

    // Seed products
    const productResult = await seedProductsToFirestore(products);

    // Seed users
    const userResult = await seedUsersToFirestore(DEFAULT_USERS);

    return NextResponse.json({
      success: true,
      message: "Sincronización a Cloud Firestore completada con éxito.",
      productsSynced: productResult.count,
      usersSynced: userResult.count,
      details: {
        products: productResult,
        users: userResult,
      },
    });
  } catch (error: any) {
    console.error("[API_SEED_FIREBASE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al sincronizar con Firebase",
      },
      { status: 500 }
    );
  }
}
