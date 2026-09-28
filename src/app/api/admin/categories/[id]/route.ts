import { NextRequest, NextResponse } from "next/server";
import { deleteCustomCategoryFromFirestore } from "@/lib/firebase/firestore";
import {
  deleteCategoryFromDisk,
  deleteNativeCategoryOnDisk,
  restoreNativeCategoryOnDisk,
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
    const authCheck = verifyAdminAuthorization(request);
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
      if (isRestore) {
        restoreNativeCategoryOnDisk(upperId);
        return NextResponse.json({
          success: true,
          message: `Categoría predeterminada ${upperId} restaurada exitosamente.`,
        });
      }

      deleteNativeCategoryOnDisk(upperId);
      return NextResponse.json({
        success: true,
        message: `Categoría predeterminada ${upperId} eliminada exitosamente.`,
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

