import { NextRequest, NextResponse } from "next/server";
import {
  deleteCustomCategoryFromFirestore,
  getDeletedNativeCategoriesFromFirestore,
  saveDeletedNativeCategoriesToFirestore,
} from "@/lib/firebase/firestore";
import {
  deleteCategoryFromDisk,
  deleteNativeCategoryOnDisk,
  restoreNativeCategoryOnDisk,
  readDeletedNativeCategoriesFromDisk,
} from "@/lib/services/categoryDiskService";
import { verifyAdminAuthorization } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

const NATIVE_CATEGORY_IDS = [
  "FIGURE",
  "VIDEO_GAME",
  "COLLECTIBLE",
  "CONSOLE",
  "HARDWARE",
  "GAMING_ACCESSORY",
  "APPAREL",
  "BOOK",
  "MERCH",
  "AUDIO",
  "BUNDLE",
];

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren credenciales de administrador.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de categoría no especificado." },
        { status: 400 }
      );
    }

    const upperId = id.toUpperCase();
    const isNative = NATIVE_CATEGORY_IDS.includes(upperId);

    const isRestore = request.nextUrl.searchParams.get("restore") === "true";

    if (isNative) {
      // 1. Fetch current list from Firestore + disk fallback
      const [firestoreDeleted, diskDeleted] = await Promise.all([
        getDeletedNativeCategoriesFromFirestore().catch(() => [] as string[]),
        Promise.resolve(readDeletedNativeCategoriesFromDisk()),
      ]);

      const currentDeleted = Array.from(new Set([...firestoreDeleted, ...diskDeleted]));

      if (isRestore) {
        const nextDeleted = currentDeleted.filter((item) => item !== upperId);
        restoreNativeCategoryOnDisk(upperId);
        await saveDeletedNativeCategoriesToFirestore(nextDeleted);

        return NextResponse.json({
          success: true,
          message: `Categoría predeterminada ${upperId} restaurada exitosamente.`,
          data: { deletedNativeCategories: nextDeleted },
        });
      }

      const nextDeleted = Array.from(new Set([...currentDeleted, upperId]));
      deleteNativeCategoryOnDisk(upperId);
      await saveDeletedNativeCategoriesToFirestore(nextDeleted);

      return NextResponse.json({
        success: true,
        message: `Categoría predeterminada ${upperId} eliminada exitosamente.`,
        data: { deletedNativeCategories: nextDeleted },
      });
    }

    // Custom category deletion
    deleteCategoryFromDisk(id);
    await deleteCustomCategoryFromFirestore(id);

    return NextResponse.json({
      success: true,
      message: `Categoría ${id} eliminada exitosamente.`,
    });
  } catch (error) {
    console.error("[CATEGORY_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al eliminar la categoría." },
      { status: 500 }
    );
  }
}

