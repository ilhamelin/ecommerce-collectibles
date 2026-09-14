import { NextRequest, NextResponse } from "next/server";
import { alertService } from "@/lib/services/alertService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const alerts = await alertService.getAllAlerts();
    const guestCount = alerts.filter((a) => a.isGuest).length;
    const registeredCount = alerts.filter((a) => !a.isGuest).length;
    const outOfStockCount = alerts.filter((a) => a.isOutOfStock).length;
    const priceDropCount = alerts.filter((a) => !a.isOutOfStock).length;

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        guestCount,
        registeredCount,
        outOfStockCount,
        priceDropCount,
      },
    });
  } catch (error: any) {
    console.error("[Admin Alerts API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener alertas" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: "ID de alerta no proporcionado" },
        { status: 400 }
      );
    }

    await alertService.deleteAlert(alertId);

    return NextResponse.json({
      success: true,
      message: "Alerta eliminada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al eliminar alerta" },
      { status: 500 }
    );
  }
}
