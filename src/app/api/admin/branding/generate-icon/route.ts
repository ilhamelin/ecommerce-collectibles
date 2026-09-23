import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuthorization } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

/**
 * Catálogo de iconos SVG vectoriales de alta precisión para el nicho de OmniCollector.
 * Sirven como diseño base o fallback garantizado ante cualquier falla de red.
 */
const HIGH_RES_VECTOR_PRESETS: Record<string, { title: string; svg: string }> = {
  mando_retro: {
    title: "Mando Gamer Cyberpunk",
    svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="6" width="20" height="12" rx="4" />
  <path d="M6 12h4" />
  <path d="M8 10v4" />
  <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
  <circle cx="17.5" cy="12.5" r="1" fill="currentColor" />
  <circle cx="15.5" cy="14.5" r="1" fill="currentColor" />
  <circle cx="13.5" cy="12.5" r="1" fill="currentColor" />
  <path d="M9 18l-1.5 3h9.5L15 18" />
</svg>`,
  },
  mascara_kitsune: {
    title: "Máscara Kitsune Japonesa",
    svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3l-6 4v5c0 5 6 9 6 9s6-4 6-9V7l-6-4z" />
  <path d="M8 10c1-1 3-1 4 0" />
  <path d="M12 10c1-1 3-1 4 0" />
  <circle cx="9.5" cy="12.5" r="1" fill="currentColor" />
  <circle cx="14.5" cy="12.5" r="1" fill="currentColor" />
  <path d="M12 15v2" />
  <path d="M6 7l-2-3 4 1" />
  <path d="M18 7l2-3-4 1" />
</svg>`,
  },
  espada_legendaria: {
    title: "Espada Maestra Legendaria",
    svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2l2.5 3.5L12 18l-2.5-12.5L12 2z" />
  <path d="M8 16h8" />
  <path d="M12 18v4" />
  <circle cx="12" cy="22" r="1" fill="currentColor" />
  <path d="M7 14l1.5 2-1.5 2" />
  <path d="M17 14l-1.5 2 1.5 2" />
</svg>`,
  },
  gema_psa: {
    title: "Gema Certificada PSA Gem Mint",
    svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
  <path d="M2 9h20" />
  <path d="M12 21L7.5 9 10 3" />
  <path d="M12 21l4.5-12L14 3" />
</svg>`,
  },
  cofre_tesoro: {
    title: "Cofre del Coleccionista",
    svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
  <path d="M3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z" />
  <circle cx="12" cy="14" r="1.5" fill="currentColor" />
  <path d="M12 15.5V18" />
  <path d="M7 4v18" />
  <path d="M17 4v18" />
</svg>`,
  },
  dragon_mecha: {
    title: "Dragón Mecha Shogun",
    svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2l4 4-2 4 4 1-5 11-2-5-4 3 1-8-3-2 5-1-1-4 2-3z" />
  <circle cx="13" cy="7" r="1" fill="currentColor" />
  <path d="M15 11l3 1-2 3" />
</svg>`,
  },
};

/**
 * Sanitiza una cadena SVG para evitar inyecciones XSS y asegurar compatibilidad de estilo.
 */
function sanitizeSvg(rawSvg: string): string {
  let cleaned = rawSvg
    .replace(/```xml/gi, "")
    .replace(/```svg/gi, "")
    .replace(/```/gi, "")
    .trim();

  // Extraer el tag <svg>...</svg> si viene rodeado de texto
  const match = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (match) {
    cleaned = match[0];
  }

  // Eliminar scripts, handlers on*, y javascript:
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  // Asegurar atributos estándar para diseño responsivo
  if (!cleaned.includes("viewBox")) {
    cleaned = cleaned.replace(/<svg/i, '<svg viewBox="0 0 24 24"');
  }
  if (!cleaned.includes("fill=")) {
    cleaned = cleaned.replace(/<svg/i, '<svg fill="none"');
  }
  if (!cleaned.includes("stroke=")) {
    cleaned = cleaned.replace(/<svg/i, '<svg stroke="currentColor"');
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = verifyAdminAuthorization(req);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          error: "Acceso denegado: Se requieren permisos de administrador para generar iconos.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { prompt = "", presetId = "" } = body;

    const userPrompt = String(prompt).trim();
    const cleanPresetId = String(presetId).trim();

    // Si coincide con un preset nativo y no hay prompt personalizado extenso
    if (cleanPresetId && HIGH_RES_VECTOR_PRESETS[cleanPresetId] && (!userPrompt || userPrompt.length < 5)) {
      const preset = HIGH_RES_VECTOR_PRESETS[cleanPresetId];
      return NextResponse.json({
        success: true,
        data: {
          svg: preset.svg,
          title: preset.title,
          source: "PRESET_VECTOR",
        },
      });
    }

    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    // Si no hay API key de Gemini configurada, usar el preset solicitado o el mando gamer
    if (!geminiApiKey || geminiApiKey.includes("YOUR_") || geminiApiKey.length < 15) {
      const fallbackPreset = HIGH_RES_VECTOR_PRESETS[cleanPresetId] || HIGH_RES_VECTOR_PRESETS.mando_retro;
      return NextResponse.json({
        success: true,
        data: {
          svg: fallbackPreset.svg,
          title: fallbackPreset.title,
          source: "PRESET_FALLBACK",
          note: "Icono generado mediante catálogo vectorial maestro (Gemini API Key opcional).",
        },
      });
    }

    // Prompt de sistema estricto para diseño vectorial
    const systemInstruction = `Eres un diseñador gráfico senior y maestro de iconografía vectorial SVG (estilo Lucide Icons, Feather Icons, Heroicons).
Tu especialidad es diseñar isotipos y símbolos vectoriales minimalistas para "OmniCollector Chile", una tienda de alta gama de videojuegos, anime, figuras japonesas y cartas coleccionables PSA.

REGLAS DE DISEÑO:
1. El SVG debe tener viewBox="0 0 24 24".
2. Debe ser escalable y tener width="100%" height="100%".
3. Utiliza stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round", fill="none" (o fill="currentColor" solo en pequeños detalles como gemas o círculos).
4. El diseño debe ser limpio, centrado, estético y con pocos trazos (paths y shapes geométricos armónicos).
5. NO incluyas <script>, ni CSS inline con color fijo (#fff, #000, etc.), siempre usa "currentColor".
6. Devuelve EXCLUSIVAMENTE el código XML <svg>...</svg> sin texto adicional ni bloques markdown.`;

    const fullUserInstruction = `Diseña un icono vectorial minimalista para el isotipo de la tienda con la siguiente temática:
"${userPrompt || "Un símbolo gamer y coleccionista icónico y elegante"}"

Devuelve únicamente el tag <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">...</svg>.`;

    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ];

    let generatedSvg = "";
    let modelUsed = "";

    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": geminiApiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: fullUserInstruction }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const json = await geminiRes.json();
          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.includes("<svg") && candidateText.includes("</svg>")) {
            generatedSvg = sanitizeSvg(candidateText);
            modelUsed = model;
            break;
          }
        }
      } catch (geminiError) {
        console.warn(`[GenerateIcon] Intento fallido con modelo ${model}:`, geminiError);
      }
    }

    // Si Gemini generó un SVG válido
    if (generatedSvg) {
      return NextResponse.json({
        success: true,
        data: {
          svg: generatedSvg,
          title: userPrompt || "Icono Personalizado IA",
          source: `GEMINI_${modelUsed.toUpperCase()}`,
        },
      });
    }

    // Fallback elegante en caso de timeout o formato imprevisto
    const fallbackPreset = HIGH_RES_VECTOR_PRESETS[cleanPresetId] || HIGH_RES_VECTOR_PRESETS.mando_retro;
    return NextResponse.json({
      success: true,
      data: {
        svg: fallbackPreset.svg,
        title: fallbackPreset.title,
        source: "PRESET_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[GenerateIcon POST] Excepción general:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error generando icono con IA.",
      },
      { status: 500 }
    );
  }
}
