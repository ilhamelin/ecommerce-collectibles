import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
  SideBannerItem,
} from "@/lib/constants/sideBannersDefaults";
import {
  getSideBannersSettingsFromFirestore,
  saveSideBannersSettingsToFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";

let inMemoryConfig: SideBannersConfig = { ...DEFAULT_SIDE_BANNERS };

/**
 * Sanitizes a side banner item to ensure valid safe properties.
 */
function sanitizeBannerItem(
  item: Partial<SideBannerItem> | undefined,
  fallback: SideBannerItem
): SideBannerItem {
  if (!item || typeof item !== "object") {
    return { ...fallback };
  }
  return {
    enabled: typeof item.enabled === "boolean" ? item.enabled : fallback.enabled,
    title: typeof item.title === "string" ? item.title.trim().slice(0, 50) : fallback.title,
    subtitle: typeof item.subtitle === "string" ? item.subtitle.trim().slice(0, 100) : fallback.subtitle,
    badge: typeof item.badge === "string" ? item.badge.trim().slice(0, 30) : fallback.badge,
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl.trim() ? item.imageUrl.trim() : fallback.imageUrl,
    targetUrl: typeof item.targetUrl === "string" && item.targetUrl.trim() ? item.targetUrl.trim() : fallback.targetUrl,
    ctaText: typeof item.ctaText === "string" ? item.ctaText.trim().slice(0, 40) : fallback.ctaText,
    accentColor: typeof item.accentColor === "string" && item.accentColor.trim() ? item.accentColor.trim() : fallback.accentColor,
  };
}

export async function GET(request: NextRequest) {
  try {
    const firestoreConfig = await getSideBannersSettingsFromFirestore();

    if (firestoreConfig && typeof firestoreConfig === "object" && "leftBanner" in firestoreConfig) {
      inMemoryConfig = firestoreConfig as SideBannersConfig;
      return NextResponse.json({
        success: true,
        data: {
          config: firestoreConfig,
          source: "FIRESTORE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        config: inMemoryConfig,
        source: "DEFAULT_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[SIDE_BANNERS_GET_ERROR]", error);
    return NextResponse.json({
      success: true,
      data: {
        config: inMemoryConfig,
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
          error: "Acceso denegado: Se requieren privilegios de administrador para configurar banners laterales.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body.action === "RESET") {
      inMemoryConfig = { ...DEFAULT_SIDE_BANNERS };
      await saveSideBannersSettingsToFirestore(DEFAULT_SIDE_BANNERS);
      return NextResponse.json({
        success: true,
        message: "Banners laterales restablecidos a los valores por defecto.",
        data: {
          config: DEFAULT_SIDE_BANNERS,
        },
      });
    }

    const { config } = body as { config: Partial<SideBannersConfig> };
    if (!config || typeof config !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Debes enviar un objeto de configuración de banners laterales válido.",
          code: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    const sanitizedConfig: SideBannersConfig = {
      enabled: typeof config.enabled === "boolean" ? config.enabled : true,
      leftBanner: sanitizeBannerItem(config.leftBanner, DEFAULT_SIDE_BANNERS.leftBanner),
      rightBanner: sanitizeBannerItem(config.rightBanner, DEFAULT_SIDE_BANNERS.rightBanner),
    };

    inMemoryConfig = sanitizedConfig;
    const firestoreSuccess = await saveSideBannersSettingsToFirestore(sanitizedConfig);

    return NextResponse.json({
      success: true,
      message: "Configuración de banners laterales guardada exitosamente.",
      data: {
        config: sanitizedConfig,
        persistedInFirestore: firestoreSuccess,
      },
    });
  } catch (error) {
    console.error("[SIDE_BANNERS_POST_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al guardar los banners laterales.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
