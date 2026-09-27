import { NextRequest, NextResponse } from "next/server";
import {
  deleteCustomCategoryFromFirestore,
  getCustomCategoriesFromFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

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
