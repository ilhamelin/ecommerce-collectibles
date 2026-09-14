import { NextRequest, NextResponse } from "next/server";
import { sendProductAlertEmail } from "@/lib/services/emailService";
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

    const alertRecord = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId,
      productSku,
      productName,
      email: email.toLowerCase().trim(),
      userId: userId || null,
      alertType,
      createdAt: new Date().toISOString(),
      active: true,
    };

    // Save to Firestore if configured
    if (adminDb) {
      try {
        await adminDb.collection("product_alerts").doc(alertRecord.id).set(alertRecord);
      } catch (dbErr) {
        console.warn("[Alerts API] Could not save to Firestore, saving in memory:", dbErr);
        inMemoryAlerts.push(alertRecord);
      }
    } else {
      inMemoryAlerts.push(alertRecord);
    }

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
  const hasAlert = inMemoryAlerts.some(
    (a) => a.productId === params.id && a.email === normalizedEmail && (a as any).active !== false
  );

  return NextResponse.json({
    success: true,
    active: hasAlert,
  });
}
