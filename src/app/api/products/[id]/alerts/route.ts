import { NextRequest, NextResponse } from "next/server";
import { sendProductAlertEmail } from "@/lib/services/emailService";
import { alertService } from "@/lib/services/alertService";
import { adminDb } from "@/lib/firebase/admin";

// In-memory fallback storage for product alerts
const inMemoryAlerts: Array<{
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  email: string;
  userId?: string;
  alertType: string;
  createdAt: string;
}> = [];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const body = await req.json();
    const {
      email,
      userId,
      alertType = "BOTH",
      productName = "Producto OmniCollector",
      productSku = "",
      price = 0,
      originalPrice = null,
      isOutOfStock = false,
      productUrl = "",
    } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Debes proporcionar un correo electrónico válido." },
        { status: 400 }
      );
    }

    const isGuest = !userId;
    const alertRecord = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId,
      productSku,
      productName,
      productPrice: Number(price) || 0,
      productOriginalPrice: originalPrice ? Number(originalPrice) : undefined,
      productImageUrl: body.productImageUrl || undefined,
      email: email.toLowerCase().trim(),
      userId: userId || null,
      userName: body.userName || (isGuest ? "Invitado Web" : email.split("@")[0]),
      isGuest,
      alertType: alertType as any,
      isOutOfStock: Boolean(isOutOfStock),
      createdAt: new Date().toISOString(),
      active: true,
    };

    // Save to shared alertService (Firestore + Memory)
    await alertService.saveAlert(alertRecord);

    // Send formal confirmation email to recipient
    const emailResult = await sendProductAlertEmail({
      recipientEmail: email.trim(),
      recipientName: email.split("@")[0],
      productName,
      productSku,
      productPrice: Number(price) || 0,
      productOriginalPrice: originalPrice ? Number(originalPrice) : undefined,
      isOutOfStock: Boolean(isOutOfStock),
      alertType: "CONFIRMATION",
      productUrl: productUrl || `https://omnicollector.cl/product/${productSku || productId}`,
    });

    return NextResponse.json({
      success: true,
      message: isOutOfStock
        ? "¡Alerta de stock activada con éxito! Te hemos enviado un correo de confirmación."
        : "¡Alerta de ofertas y stock activada! Te hemos enviado un correo de confirmación.",
      data: {
        alertId: alertRecord.id,
        emailSent: emailResult.success,
        previewUrl: emailResult.previewUrl,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error interno al registrar alerta";
    console.error("[Alerts API] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const sku = searchParams.get("sku");
    const userId = searchParams.get("userId");

    if (!email && !userId) {
      return NextResponse.json({ success: true, active: false });
    }

    const allAlerts = await alertService.getAllAlerts();
    const normalizedEmail = email ? email.toLowerCase().trim() : "";
    const normalizedUserId = userId ? userId.trim() : "";
    const targetId = params.id;

    const foundAlert = allAlerts.find((a) => {
      if (a.active === false) return false;

      // Check user match
      const matchesUser =
        (normalizedEmail && a.email && a.email.toLowerCase().trim() === normalizedEmail) ||
        (normalizedUserId && a.userId && a.userId === normalizedUserId);

      if (!matchesUser) return false;

      // Check product match (by id or sku)
      const matchesProduct =
        a.productId === targetId ||
        a.productSku === targetId ||
        (sku && (a.productSku === sku || a.productId === sku));

      return Boolean(matchesProduct);
    });

    return NextResponse.json({
      success: true,
      active: Boolean(foundAlert),
      alert: foundAlert || null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ success: false, error: errorMsg, active: false }, { status: 500 });
  }
}
