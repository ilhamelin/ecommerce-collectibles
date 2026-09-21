import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_ANNOUNCEMENT_DATA, StoreAnnouncementData } from "@/lib/constants/announcementDefaults";
import {
  getAnnouncementSettingsFromFirestore,
  saveAnnouncementSettingsToFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

// In-memory cache for ultra-fast response and instant reactivity
let inMemoryAnnouncement: StoreAnnouncementData = { ...DEFAULT_ANNOUNCEMENT_DATA };

export async function GET() {
  try {
    const firestoreData = await getAnnouncementSettingsFromFirestore();

    if (firestoreData && typeof firestoreData === "object") {
      inMemoryAnnouncement = {
        ...DEFAULT_ANNOUNCEMENT_DATA,
        ...firestoreData,
      };
      return NextResponse.json({
        success: true,
        data: {
          announcement: inMemoryAnnouncement,
          source: "FIRESTORE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        announcement: inMemoryAnnouncement,
        source: "DEFAULT_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[ANNOUNCEMENT_GET_ERROR]", error);
    return NextResponse.json({
      success: true,
      data: {
        announcement: inMemoryAnnouncement,
        source: "IN_MEMORY_FALLBACK",
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren privilegios de administrador para modificar la barra de anuncios.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const incoming = body?.announcement;

    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Estructura de datos inválida para la barra de anuncios.",
        },
        { status: 400 }
      );
    }

    const sanitizedAnnouncement: StoreAnnouncementData = {
      enabled: incoming.enabled !== false,
      shippingText: String(incoming.shippingText || DEFAULT_ANNOUNCEMENT_DATA.shippingText).trim(),
      shippingHighlight: String(incoming.shippingHighlight || DEFAULT_ANNOUNCEMENT_DATA.shippingHighlight).trim(),
      shippingLink: String(incoming.shippingLink || DEFAULT_ANNOUNCEMENT_DATA.shippingLink).trim(),
      shippingEnabled: incoming.shippingEnabled !== false,

      paymentText: String(incoming.paymentText || DEFAULT_ANNOUNCEMENT_DATA.paymentText).trim(),
      paymentHighlight: String(incoming.paymentHighlight || DEFAULT_ANNOUNCEMENT_DATA.paymentHighlight).trim(),
      paymentEnabled: incoming.paymentEnabled !== false,

      guaranteeText: String(incoming.guaranteeText || DEFAULT_ANNOUNCEMENT_DATA.guaranteeText).trim(),
      guaranteeHighlight: String(incoming.guaranteeHighlight || DEFAULT_ANNOUNCEMENT_DATA.guaranteeHighlight).trim(),
      guaranteeEnabled: incoming.guaranteeEnabled !== false,

      whatsappLabel: String(incoming.whatsappLabel || DEFAULT_ANNOUNCEMENT_DATA.whatsappLabel).trim(),
      whatsappPhone: String(incoming.whatsappPhone || DEFAULT_ANNOUNCEMENT_DATA.whatsappPhone).trim(),
      whatsappLink: String(incoming.whatsappLink || DEFAULT_ANNOUNCEMENT_DATA.whatsappLink).trim(),
      whatsappPulse: incoming.whatsappPulse !== false,
      whatsappEnabled: incoming.whatsappEnabled !== false,

      backgroundColor: String(incoming.backgroundColor || DEFAULT_ANNOUNCEMENT_DATA.backgroundColor).trim(),
      textColor: String(incoming.textColor || DEFAULT_ANNOUNCEMENT_DATA.textColor).trim(),
      accentColor: String(incoming.accentColor || DEFAULT_ANNOUNCEMENT_DATA.accentColor).trim(),
    };

    inMemoryAnnouncement = sanitizedAnnouncement;

    // Persist in Firestore
    const savedToFirestore = await saveAnnouncementSettingsToFirestore(sanitizedAnnouncement);

    return NextResponse.json({
      success: true,
      message: "Barra superior de anuncios actualizada exitosamente",
      data: {
        announcement: sanitizedAnnouncement,
        persisted: savedToFirestore,
      },
    });
  } catch (error) {
    console.error("[ANNOUNCEMENT_POST_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al guardar la configuración de la barra de anuncios.",
      },
      { status: 500 }
    );
  }
}
