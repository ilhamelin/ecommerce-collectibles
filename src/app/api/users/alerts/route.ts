import { NextRequest, NextResponse } from "next/server";
import { alertService } from "@/lib/services/alertService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (!email && !userId) {
      return NextResponse.json(
        { success: false, error: "Debes especificar email o userId" },
        { status: 400 }
      );
    }

    const query = email || userId || "";
    const alerts = await alertService.getUserAlerts(query);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
      },
    });
  } catch (error: any) {
    console.error("[User Alerts API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener alertas de usuario" },
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
        { success: false, error: "ID de alerta no especificado" },
        { status: 400 }
      );
    }

    await alertService.deleteAlert(alertId);

    return NextResponse.json({
      success: true,
      message: "Alerta cancelada exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al cancelar alerta" },
      { status: 500 }
    );
  }
}
