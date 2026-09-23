import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_BRANDING_DATA, StoreBrandingData } from "@/lib/constants/brandingDefaults";
import {
  getBrandingSettingsFromFirestore,
  saveBrandingSettingsToFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

// In-memory fallback cache to ensure reactivity and fast response
let inMemoryBranding: StoreBrandingData = { ...DEFAULT_BRANDING_DATA };

export async function GET() {
  try {
    const firestoreBranding = await getBrandingSettingsFromFirestore();

    if (firestoreBranding && typeof firestoreBranding === "object") {
      inMemoryBranding = {
        ...DEFAULT_BRANDING_DATA,
        ...firestoreBranding,
      };
      return NextResponse.json({
        success: true,
        data: {
          branding: inMemoryBranding,
          source: "FIRESTORE",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        branding: inMemoryBranding,
        source: "DEFAULT_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[BRANDING_GET_ERROR]", error);
    return NextResponse.json({
      success: true,
      data: {
        branding: inMemoryBranding,
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
          error: "Acceso denegado: Se requieren privilegios de administrador para modificar la identidad de marca.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const incoming = body?.branding;

    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Estructura de branding inválida.",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Sanitizar SVG en caso de icono generado por IA
    let cleanSvg: string | undefined = undefined;
    if (incoming.customSvgIcon && typeof incoming.customSvgIcon === "string") {
      const rawSvg = incoming.customSvgIcon.trim();
      if (rawSvg.includes("<svg") && rawSvg.includes("</svg>")) {
        // Remover tags de script, handlers on* y javascript:
        cleanSvg = rawSvg
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
          .replace(/javascript:/gi, "");
      }
    }

    const updatedBranding: StoreBrandingData = {
      logoMode: incoming.logoMode === "image" ? "image" : "icon",
      logoImageUrl: incoming.logoImageUrl ? String(incoming.logoImageUrl).trim() : "",
      logoIcon: incoming.logoIcon ? String(incoming.logoIcon).trim() : "Sparkles",
      customSvgIcon: cleanSvg || (incoming.customSvgIcon ? String(incoming.customSvgIcon).trim() : undefined),
      logoBgGradient: incoming.logoBgGradient ? String(incoming.logoBgGradient).trim() : "from-[#FF6B35] to-[#1F3A5F]",
      titlePrefix: incoming.titlePrefix ? String(incoming.titlePrefix).trim() : "OMNI",
      titleHighlight: incoming.titleHighlight ? String(incoming.titleHighlight).trim() : "COLLECTOR",
      subtitle: incoming.subtitle ? String(incoming.subtitle).trim() : "Chile • Nicho Coleccionista",
      updatedAt: new Date().toISOString(),
    };

    // Update in-memory cache immediately
    inMemoryBranding = updatedBranding;

    // Persist to Firestore if available
    let persistedToFirestore = false;
    try {
      persistedToFirestore = await saveBrandingSettingsToFirestore(updatedBranding);
    } catch (fsErr) {
      console.warn("[BRANDING_POST_FIRESTORE_WARN] Saved in memory, Firestore skipped:", fsErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        branding: updatedBranding,
        persistedToFirestore,
      },
    });
  } catch (error: any) {
    console.error("[BRANDING_POST_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error interno al guardar la configuración de branding.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
