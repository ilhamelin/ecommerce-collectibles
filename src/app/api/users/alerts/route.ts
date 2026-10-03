import { requestIdentity } from "@/lib/auth/requestIdentity";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { createProductReferenceIndex } from "@/lib/services/productReferences";
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

    const identity = await requestIdentity(req);
    if (!identity) return NextResponse.json({ success: false, error: "Sesión requerida." }, { status: 401 });
    if (!identity.admin && email && email.toLowerCase().trim() !== identity.email) return NextResponse.json({ success: false, error: "Acceso denegado." }, { status: 403 });
    const allAlerts = await alertService.getAllAlerts();
    const cleanEmail = identity.admin ? email?.toLowerCase().trim() || "" : identity.email;
    const cleanUserId = identity.admin ? userId?.trim() || "" : identity.uid;

    const products = await getProductsFromFirestore(true);
    const index = products === null ? null : createProductReferenceIndex(products);
    const alerts = allAlerts.filter((a) => {
      if (index && !index.has(a)) return false;
      if (a.active === false) return false;
      if (cleanEmail && a.email && a.email.toLowerCase().trim() === cleanEmail) return true;
      if (cleanUserId && a.userId && a.userId === cleanUserId) return true;
      return false;
    });

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
    const email = searchParams.get("email");
    const sku = searchParams.get("sku");
    const productId = searchParams.get("productId");

    const identity = await requestIdentity(req);
    if (!identity) return NextResponse.json({ success: false, error: "Sesión requerida." }, { status: 401 });
    const owned = (alert: { email?: string; userId?: string | null }) => identity.admin || (!!identity.email && alert.email?.toLowerCase() === identity.email) || (!!identity.uid && alert.userId === identity.uid);
    if (alertId) {
      const target = (await alertService.getAllAlerts()).find(alert => alert.id === alertId);
      if (!target || !owned(target)) return NextResponse.json({ success: false, error: "Alerta no disponible." }, { status: 403 });
      const deleted = await alertService.deleteAlert(alertId);
      if (!deleted) return NextResponse.json({ success: false, error: "La alerta no se eliminó." }, { status: 503 });
      return NextResponse.json({
        success: true,
        message: "Alerta cancelada exitosamente",
      });
    }

    if (email && (sku || productId)) {
      const allAlerts = await alertService.getAllAlerts();
      const normEmail = email.toLowerCase().trim();
      const match = allAlerts.find(
        (a) =>
          a.active !== false &&
          a.email &&
          a.email.toLowerCase().trim() === normEmail &&
          (a.productId === (productId || sku) || a.productSku === (sku || productId))
      );
      if (match) {
        if (!owned(match)) return NextResponse.json({ success: false, error: "Acceso denegado." }, { status: 403 });
        const deleted = await alertService.deleteAlert(match.id);
        if (!deleted) return NextResponse.json({ success: false, error: "La alerta no se eliminó." }, { status: 503 });
        return NextResponse.json({
          success: true,
          message: "Alerta cancelada exitosamente",
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "ID de alerta no especificado" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al cancelar alerta" },
      { status: 500 }
    );
  }
}
