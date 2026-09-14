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
  } catch (error: any) {
    console.error("[Alerts API] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno al registrar alerta" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ success: true, active: false });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userAlerts = await alertService.getUserAlerts(normalizedEmail);
  const hasAlert = userAlerts.some(
    (a) => (a.productId === params.id || a.productSku === params.id) && a.active !== false
  );

  return NextResponse.json({
    success: true,
    active: hasAlert,
  });
}
