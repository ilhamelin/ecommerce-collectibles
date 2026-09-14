import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AutoFillResponse {
  sku: string;
  name: string;
  type: "FIGURE" | "VIDEO_GAME" | "COLLECTIBLE" | "OTHER";
  customCategoryLabel?: string;
  description: string;
  price: number;
  originalPrice?: number;
  costPrice: number;
  stockAvailable: number;
  isPreOrder: boolean;
  ageRating: string;
  genres: string;
  imageUrl?: string;
  trailerUrl?: string;
  figureSpecs?: {
    scale: string;
    manufacturer: string;
    material: string;
    dimensions: string;
    sculptor: string;
    boxCondition: string;
    arrivalDate: string;
    depositPercent: number;
  };
  gameSpecs?: {
    platform: string;
    edition: string;
    publisher: string;
    audioLanguages: string;
    subtitleLanguages: string;
    players: string;
    fileSize: string;
    resolution: string;
  };
  collectibleSpecs?: {
    category: string;
    condition: string;
    authBody: string;
    language: string;
    serial: string;
  };
  engine: "GEMINI_AI" | "SMART_KNOWLEDGE_ENGINE";
}

// Smart Heuristic Engine (Dual-Engine Fallback)
function generateWithSmartEngine(rawName: string): AutoFillResponse {
  const name = rawName.trim();
  const lower = name.toLowerCase();

  // Detect Type
  let type: "FIGURE" | "VIDEO_GAME" | "COLLECTIBLE" | "OTHER" = "FIGURE";
  let customCategoryLabel: string | undefined = undefined;

  if (
    lower.includes("ps5") ||
    lower.includes("switch") ||
    lower.includes("nintendo") ||
    lower.includes("xbox") ||
    lower.includes("game") ||
    lower.includes("juego") ||
    lower.includes("edition") ||
    lower.includes("remake") ||
    lower.includes("zelda") ||
    lower.includes("mario") ||
    lower.includes("cyberpunk") ||
    lower.includes("halo") ||
    lower.includes("forza") ||
    lower.includes("persona") ||
    lower.includes("elden ring") ||
    lower.includes("resident evil") ||
    lower.includes("final fantasy")
  ) {
    if (lower.includes("consola") || lower.includes("oled") || lower.includes("hardware")) {
      type = "OTHER";
      customCategoryLabel = "Consola / Hardware";
    } else {
      type = "VIDEO_GAME";
    }
  } else if (
    lower.includes("psa") ||
    lower.includes("cgc") ||
    lower.includes("bgs") ||
    lower.includes("tcg") ||
    lower.includes("carta") ||
    lower.includes("charizard") ||
    lower.includes("pikachu") ||
    lower.includes("pokemon") ||
    lower.includes("magic") ||
    lower.includes("yugioh") ||
    lower.includes("one piece card") ||
    lower.includes("gem mint")
  ) {
    type = "COLLECTIBLE";
  } else if (
    lower.includes("mouse") ||
    lower.includes("teclado") ||
    lower.includes("headset") ||
    lower.includes("audifono")
  ) {
    type = "OTHER";
    customCategoryLabel = "Accesorio Gaming";
  } else if (lower.includes("poleron") || lower.includes("hoodie") || lower.includes("polera")) {
    type = "OTHER";
    customCategoryLabel = "Ropa & Estilo";
  } else if (lower.includes("manga") || lower.includes("artbook") || lower.includes("tomo")) {
    type = "OTHER";
    customCategoryLabel = "Manga / Artbook";
  } else if (lower.includes("vinilo") || lower.includes("ost") || lower.includes("soundtrack")) {
    type = "OTHER";
    customCategoryLabel = "Audio / OST";
  } else if (lower.includes("peluche") || lower.includes("figpin") || lower.includes("lampara")) {
    type = "OTHER";
    customCategoryLabel = "Merchandising";
  }

  // Generate SKU prefix
  let prefix = "FIG";
  if (type === "VIDEO_GAME") prefix = "VG";
  else if (type === "COLLECTIBLE") prefix = "COL";
  else if (type === "OTHER") {
    prefix = customCategoryLabel === "Consola / Hardware" ? "CON" : "ACC";
  }

  const cleanSlugPart = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .split("-")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .join("-");

  const randomNum = Math.floor(100 + Math.random() * 900);
  const sku = `${prefix}-${cleanSlugPart || "PROD"}-${randomNum}`;

  // Pricing logic
  let price = 129900;
  let originalPrice = 149900;
  let costPrice = 89000;
  let isPreOrder = true;
  let stockAvailable = 6;

  if (type === "VIDEO_GAME") {
    price = 49900;
    originalPrice = 59900;
    costPrice = 36000;
    isPreOrder = lower.includes("preventa") || lower.includes("preorder") || lower.includes("2026") || lower.includes("2025");
    stockAvailable = 15;
  } else if (type === "COLLECTIBLE") {
    price = 89900;
    originalPrice = 99900;
    costPrice = 55000;
    isPreOrder = false;
    stockAvailable = 1;
  } else if (type === "OTHER" && customCategoryLabel === "Consola / Hardware") {
    price = 429900;
    originalPrice = 469900;
    costPrice = 350000;
    isPreOrder = false;
    stockAvailable = 4;
  }

  // Description
  let description = `Edición auténtica de ${name} con certificación oficial y garantía de coleccionista. Despacho nacional blindado contra impactos a todo Chile.`;
  if (type === "FIGURE") {
    description = `Figura oficial importada directamente de Japón de ${name}. Esculpida con altísima fidelidad al arte conceptual original, acabados en degradé de pintura multicapa y base temática de exhibición. Viene en su caja sellada de fábrica con sellos holográficos de autenticidad y protección para coleccionistas Mint in Box (MIB).`;
  } else if (type === "VIDEO_GAME") {
    description = `Título oficial ${name} en edición física garantizada con carátula en perfecto estado. Incluye todos los códigos de contenido adicional sellados de fábrica y soporte oficial para las últimas características de la plataforma.`;
  } else if (type === "COLLECTIBLE") {
    description = `Carta de colección ${name} encapsulada y sellada por ultrasonido con protección anti-rayas y filtro UV al 99%. Ejemplar auditado en centrado, esquinas, bordes y superficie para máxima conservación de valor patrimonial.`;
  }

  // Specs
  const figureSpecs =
    type === "FIGURE"
      ? {
          scale: lower.includes("1/4") ? "SCALE_1_4" : lower.includes("1/6") ? "SCALE_1_6" : "SCALE_1_7",
          manufacturer: lower.includes("alter")
            ? "ALTER"
            : lower.includes("kotobukiya")
            ? "KOTOBUKIYA"
            : lower.includes("bandai")
            ? "BANDAI_SPIRITS"
            : lower.includes("max factory")
            ? "MAX_FACTORY"
            : "GOOD_SMILE_COMPANY",
          material: "PVC & ABS de alta densidad pintado a mano",
          dimensions: "Aprox. 26 a 30 cm de altura con base",
          sculptor: "Escultor oficial de estudio japonés",
          boxCondition: "Caja sellada impecable de fábrica (Mint in Box 10/10)",
          arrivalDate: "Diciembre 2026",
          depositPercent: 0.2,
        }
      : undefined;

  const gameSpecs =
    type === "VIDEO_GAME"
      ? {
          platform: lower.includes("switch")
            ? "NINTENDO_SWITCH"
            : lower.includes("xbox")
            ? "XBOX_SERIES"
            : lower.includes("pc")
            ? "PC"
            : "PS5",
          edition: lower.includes("deluxe")
            ? "DELUXE"
            : lower.includes("collector")
            ? "COLLECTORS"
            : "STANDARD",
          publisher: lower.includes("nintendo")
            ? "Nintendo"
            : lower.includes("sony")
            ? "Sony Interactive Entertainment"
            : lower.includes("capcom")
            ? "Capcom"
            : lower.includes("square")
            ? "Square Enix"
            : "Publisher Oficial",
          audioLanguages: "Español Latino, Inglés, Japonés",
          subtitleLanguages: "Español Latino, Inglés",
          players: "1 Jugador (Modo Online disponible)",
          fileSize: "Aprox. 45 a 70 GB",
          resolution: "4K Dinámico 60fps / Soporte HDR",
        }
      : undefined;

  const collectibleSpecs =
    type === "COLLECTIBLE"
      ? {
          category: "TCG",
          condition: lower.includes("9") ? "MINT_9" : "GEM_MINT_10",
          authBody: lower.includes("cgc") ? "CGC" : lower.includes("bgs") ? "BGS" : "PSA",
          language: lower.includes("jap") ? "Japonés" : "Inglés",
          serial: `PSA-${Math.floor(10000000 + Math.random() * 89999999)}`,
        }
      : undefined;

  return {
    sku,
    name,
    type,
    customCategoryLabel,
    description,
    price,
    originalPrice,
    costPrice,
    stockAvailable,
    isPreOrder,
    ageRating: lower.includes("m18") || lower.includes("cyberpunk") ? "M18" : "TE",
    genres: type === "FIGURE" ? "Anime, Escala, Coleccionismo" : type === "VIDEO_GAME" ? "Acción, Aventura, RPG" : "TCG, Rareza, Inversión",
    imageUrl:
      type === "FIGURE"
        ? "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80"
        : type === "COLLECTIBLE"
        ? "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    figureSpecs,
    gameSpecs,
    collectibleSpecs,
    engine: "SMART_KNOWLEDGE_ENGINE",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productName = body?.name?.trim();

    if (!productName) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar al menos el Nombre del Producto para auto-completar los datos." },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiApiKey) {
      try {
        const prompt = `Eres un experto catalogador de productos de colección y e-commerce de videojuegos, figuras de anime y cartas TCG en Chile llamado OmniCollector.
Genera la ficha técnica completa en formato JSON para el siguiente producto: "${productName}".

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código tipo \`\`\`json) con esta estructura exacta:
{
  "sku": "Ej: FIG-MAKIMA-17 o VG-CYBERP-2077 o COL-CHARIZ-001",
  "name": "${productName}",
  "type": "FIGURE" | "VIDEO_GAME" | "COLLECTIBLE" | "OTHER",
  "customCategoryLabel": "Si type es OTHER, indicar categoría como Consola / Hardware, Accesorio Gaming, Ropa & Estilo, Manga / Artbook, Merchandising, Audio / OST",
  "description": "Descripción comercial y técnica detallada en español para coleccionistas en Chile (2 párrafos)",
  "price": precio_en_pesos_chilenos_CLP_entero,
  "originalPrice": precio_normal_ligeramente_mayor_en_CLP_entero,
  "costPrice": costo_estimado_en_CLP_entero,
  "stockAvailable": numero_entre_3_y_15,
  "isPreOrder": true_o_false,
  "ageRating": "TE" | "M18" | "ALL" | "ESRB_T" | "ESRB_M",
  "genres": "Palabras clave separadas por coma",
  "figureSpecs": {
    "scale": "SCALE_1_7" | "SCALE_1_4" | "SCALE_1_6" | "SCALE_1_8" | "NON_SCALE",
    "manufacturer": "GOOD_SMILE_COMPANY" | "ALTER" | "KOTOBUKIYA" | "MAX_FACTORY" | "MEGAHOUSE" | "BANDAI_SPIRITS" | "FREEING",
    "material": "Materiales (ej. PVC & ABS pintado a mano)",
    "dimensions": "Dimensiones en cm",
    "sculptor": "Nombre escultor o taller",
    "boxCondition": "Caja sellada impecable de fábrica (Mint in Box)",
    "arrivalDate": "Mes y año estimado de arribo (ej. Noviembre 2026)",
    "depositPercent": 0.2
  },
  "gameSpecs": {
    "platform": "PS5" | "NINTENDO_SWITCH" | "XBOX_SERIES" | "PC",
    "edition": "STANDARD" | "DELUXE" | "COLLECTORS",
    "publisher": "Distribuidor o desarrollador",
    "audioLanguages": "Idiomas de audio",
    "subtitleLanguages": "Idiomas de subtítulos",
    "players": "Cantidad de jugadores",
    "fileSize": "Tamaño estimado",
    "resolution": "Resolución y framerate"
  },
  "collectibleSpecs": {
    "category": "TCG" | "MEMORABILIA" | "COMIC",
    "condition": "GEM_MINT_10" | "MINT_9" | "NEAR_MINT_8",
    "authBody": "PSA" | "CGC" | "BGS",
    "language": "Japonés" | "Inglés",
    "serial": "Código serial de certificación"
  }
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

          if (rawText) {
            const parsed = JSON.parse(rawText);
            return NextResponse.json({
              success: true,
              data: {
                ...parsed,
                engine: "GEMINI_AI",
              },
            });
          }
        }
      } catch (geminiErr) {
        console.warn("[Auto-Fill API] Gemini API call failed, using fallback engine:", geminiErr);
      }
    }

    // Fallback to Smart Heuristic Collector Engine
    const fallbackResult = generateWithSmartEngine(productName);
    return NextResponse.json({
      success: true,
      data: fallbackResult,
    });
  } catch (error: any) {
    console.error("[Auto-Fill API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error al procesar la solicitud de autocompletado." },
      { status: 500 }
    );
  }
}
