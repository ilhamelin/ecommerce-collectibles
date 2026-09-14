import { NextRequest, NextResponse } from "next/server";
import { productRequestService } from "@/lib/services/productRequestService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const requests = await productRequestService.getAllRequests();
    const pendingCount = requests.filter((r) => r.status === "PENDING").length;
    const reviewingCount = requests.filter((r) => r.status === "REVIEWING").length;
    const addedCount = requests.filter((r) => r.status === "ADDED").length;

    return NextResponse.json({
      success: true,
      data: {
        requests,
        total: requests.length,
        pendingCount,
        reviewingCount,
        addedCount,
      },
    });
  } catch (error: any) {
    console.error("[Admin Product Requests GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "ID y estado son requeridos" },
        { status: 400 }
      );
    }

    const updated = await productRequestService.updateStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Estado actualizado a ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar estado" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de solicitud no proporcionado" },
        { status: 400 }
      );
    }

    await productRequestService.deleteRequest(id);

    return NextResponse.json({
      success: true,
      message: "Solicitud eliminada exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar solicitud" },
      { status: 500 }
    );
  }
}
