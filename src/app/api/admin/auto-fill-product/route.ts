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
  customSpecifications?: {
    categoryType?: string;
    gamingAccessory?: {
      accessoryType: "MOUSE" | "KEYBOARD" | "HEADSET" | "CONTROLLER" | string;
      mouse?: any;
      keyboard?: any;
      headset?: any;
      controller?: any;
    };
    console?: any;
    apparel?: any;
    book?: any;
    merch?: any;
    audio?: any;
  };
  engine: "GEMINI_AI" | "SMART_KNOWLEDGE_ENGINE";
}

function getCategoryTypeFromLabel(
  label?: string
): "CONSOLE" | "GAMING_ACCESSORY" | "APPAREL" | "BOOK" | "MERCH" | "AUDIO" {
  const l = (label || "").toLowerCase();
  if (l.includes("consola") || l.includes("hardware")) return "CONSOLE";
  if (l.includes("manga") || l.includes("artbook") || l.includes("libro") || l.includes("comic") || l.includes("tomo"))
    return "BOOK";
  if (
    l.includes("ropa") ||
    l.includes("estilo") ||
    l.includes("poleron") ||
    l.includes("polera") ||
    l.includes("hoodie") ||
    l.includes("apparel")
  )
    return "APPAREL";
  if (
    l.includes("merch") ||
    l.includes("peluche") ||
    l.includes("llavero") ||
    l.includes("taza") ||
    l.includes("decoraci") ||
    l.includes("figpin")
  )
    return "MERCH";
  if (l.includes("audio") || l.includes("ost") || l.includes("soundtrack") || l.includes("vinilo") || l.includes("disco"))
    return "AUDIO";
  return "GAMING_ACCESSORY";
}

// Smart Heuristic Engine (Dual-Engine Fallback)
function generateWithSmartEngine(
  rawName: string,
  userSelectedType?: "FIGURE" | "VIDEO_GAME" | "COLLECTIBLE" | "OTHER",
  userCustomCategoryLabel?: string
): AutoFillResponse {
  const name = rawName.trim();
  const lower = name.toLowerCase();

  // 1. Detect / Respect Type
  let type: "FIGURE" | "VIDEO_GAME" | "COLLECTIBLE" | "OTHER";
  let customCategoryLabel: string | undefined = userCustomCategoryLabel?.trim() || undefined;

  if (userSelectedType) {
    // Strictly respect the admin's chosen category!
    type = userSelectedType;
    if (type === "OTHER" && !customCategoryLabel) {
      const cat = getCategoryTypeFromLabel(name);
      if (cat === "CONSOLE") customCategoryLabel = "Consola / Hardware";
      else if (cat === "BOOK") customCategoryLabel = "Manga / Artbook";
      else if (cat === "APPAREL") customCategoryLabel = "Ropa & Estilo";
      else if (cat === "MERCH") customCategoryLabel = "Merchandising";
      else if (cat === "AUDIO") customCategoryLabel = "Audio / OST";
      else customCategoryLabel = "Accesorio Gaming";
    }
  } else {
    // Inferred if not specified by the admin
    if (
      lower.includes("dualsense") ||
      lower.includes("control") ||
      lower.includes("mando") ||
      lower.includes("mouse") ||
      lower.includes("teclado") ||
      lower.includes("headset") ||
      lower.includes("joy-con") ||
      lower.includes("joycon") ||
      lower.includes("audifono") ||
      lower.includes("gamepad") ||
      lower.includes("arcade stick") ||
      lower.includes("volante")
    ) {
      type = "OTHER";
      customCategoryLabel = "Accesorio Gaming";
    } else if (lower.includes("consola") || lower.includes("oled") || lower.includes("hardware")) {
      type = "OTHER";
      customCategoryLabel = "Consola / Hardware";
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
      type = "VIDEO_GAME";
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
    } else {
      type = "FIGURE";
    }
  }

  // Generate SKU prefix according to category
  let prefix = "FIG";
  if (type === "VIDEO_GAME") prefix = "VG";
  else if (type === "COLLECTIBLE") prefix = "COL";
  else if (type === "OTHER") {
    const cat = getCategoryTypeFromLabel(customCategoryLabel);
    if (cat === "CONSOLE") prefix = "CON";
    else if (cat === "APPAREL") prefix = "APP";
    else if (cat === "BOOK") prefix = "MNG";
    else if (cat === "MERCH") prefix = "MERCH";
    else if (cat === "AUDIO") prefix = "OST";
    else prefix = "ACC"; // Accesorio Gaming
  }

  const cleanSlugPart = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .split("-")
    .filter((w) => w.length > 1)
    .slice(0, 3)
    .join("-");

  const randomNum = Math.floor(100 + Math.random() * 900);
  const sku = `${prefix}-${cleanSlugPart || "PROD"}-${randomNum}`;

  // Pricing logic
  let price = 69900;
  let originalPrice = 79900;
  let costPrice = 45000;
  let isPreOrder = false;
  let stockAvailable = 10;

  if (type === "FIGURE") {
    price = 129900;
    originalPrice = 149900;
    costPrice = 89000;
    isPreOrder = true;
    stockAvailable = 6;
  } else if (type === "VIDEO_GAME") {
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
  } else if (type === "OTHER") {
    const cat = getCategoryTypeFromLabel(customCategoryLabel);
    if (cat === "CONSOLE") {
      price = 429900;
      originalPrice = 469900;
      costPrice = 350000;
      isPreOrder = false;
      stockAvailable = 4;
    } else if (cat === "BOOK") {
      price = 18900;
      originalPrice = 22900;
      costPrice = 11000;
      isPreOrder = false;
      stockAvailable = 20;
    } else if (cat === "APPAREL") {
      price = 29900;
      originalPrice = 34900;
      costPrice = 16000;
      isPreOrder = false;
      stockAvailable = 15;
    } else if (cat === "MERCH") {
      price = 24900;
      originalPrice = 29900;
      costPrice = 13000;
      isPreOrder = false;
      stockAvailable = 15;
    } else if (cat === "AUDIO") {
      price = 39900;
      originalPrice = 45900;
      costPrice = 24000;
      isPreOrder = false;
      stockAvailable = 8;
    } else {
      price = lower.includes("edge") ? 199900 : lower.includes("dualsense") ? 69900 : 49900;
      originalPrice = Math.round(price * 1.15);
      costPrice = Math.round(price * 0.65);
      isPreOrder = false;
      stockAvailable = 12;
    }
  }

  // Description strictly matched to the category
  let description = `Edición auténtica de ${name} con certificación oficial y garantía de coleccionista. Despacho nacional blindado contra impactos a todo Chile.`;
  if (type === "FIGURE") {
    description = `Figura oficial importada directamente de Japón de ${name}. Esculpida con altísima fidelidad al arte conceptual original, acabados en degradé de pintura multicapa y base temática de exhibición. Viene en su caja sellada de fábrica con sellos holográficos de autenticidad y protección para coleccionistas Mint in Box (MIB).`;
  } else if (type === "VIDEO_GAME") {
    description = `Título oficial ${name} en edición física garantizada con carátula en perfecto estado. Incluye todos los códigos de contenido adicional sellados de fábrica y soporte oficial para las últimas características de la plataforma.`;
  } else if (type === "COLLECTIBLE") {
    description = `Carta de colección ${name} encapsulada y sellada por ultrasonido con protección anti-rayas y filtro UV al 99%. Ejemplar auditado en centrado, esquinas, bordes y superficie para máxima conservación de valor patrimonial.`;
  } else if (type === "OTHER") {
    const cat = getCategoryTypeFromLabel(customCategoryLabel);
    if (cat === "BOOK") {
      description = `Tomo oficial de arte y lectura ${name} en papel satinado de alta resolución con sobrecubierta a todo color y encuadernación de lujo para biblioteca de coleccionistas.`;
    } else if (cat === "CONSOLE") {
      description = `Consola y sistema de entretenimiento oficial ${name}. Incluye todos los componentes de fábrica, cables de alta velocidad, garantía oficial y despacho prioritario protegido a todo Chile.`;
    } else if (cat === "APPAREL") {
      description = `Prenda de colección oficial ${name} confeccionada en algodón premium con costuras reforzadas y estampado de alta durabilidad resistente a lavados continuos.`;
    } else if (cat === "MERCH") {
      description = `Artículo conmemorativo oficial de ${name} con licencia directa. Ideal para exhibición en vitrina, repisa o colecciones temáticas con acabados de alta fidelidad.`;
    } else if (cat === "AUDIO") {
      description = `Edición musical oficial de ${name} con masterización acústica de alta fidelidad. Presentación en formato físico con arte conmemorativo para amantes de las bandas sonoras.`;
    } else {
      description = `Accesorio oficial de alta fidelidad ${name}. Diseñado ergonómicamente con materiales de grado profesional, componentes de respuesta ultra-rápida, baja latencia y máxima durabilidad para sesiones intensivas de juego. Totalmente compatible con la plataforma y garantizado con soporte oficial en Chile.`;
    }
  }

  // Age Rating & Genres
  let ageRating = "TE";
  let genres = "Anime, Escala, Coleccionismo";

  if (type === "FIGURE") {
    ageRating = "TE";
    genres = "Anime, Escala, Coleccionismo, Importación Japón";
  } else if (type === "VIDEO_GAME") {
    ageRating = lower.includes("m18") || lower.includes("cyberpunk") ? "M18" : "TE";
    genres = "Acción, Aventura, RPG, Videojuegos";
  } else if (type === "COLLECTIBLE") {
    ageRating = "ALL";
    genres = "TCG, Rareza, Inversión, Coleccionables";
  } else if (type === "OTHER") {
    ageRating = "ALL";
    if (customCategoryLabel === "Accesorio Gaming") {
      genres = "Accesorios Gaming, Mandos, Periféricos, Hardware, PlayStation";
    } else if (customCategoryLabel === "Consola / Hardware") {
      genres = "Consolas, Hardware, Gaming, Sistemas";
    } else if (customCategoryLabel === "Ropa & Estilo") {
      genres = "Moda Gamer, Ropa Urbana, Accesorios";
    } else if (customCategoryLabel === "Manga / Artbook") {
      genres = "Lectura, Manga, Artbook, Ilustraciones";
    } else {
      genres = "Coleccionables, Merchandising, Especial";
    }
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

  // Custom Category Specifications (Section 6)
  let customSpecifications: any = undefined;
  if (type === "OTHER") {
    const matchedCategory = getCategoryTypeFromLabel(customCategoryLabel);
    if (matchedCategory === "GAMING_ACCESSORY") {
      // Determine accessory subtype from name
      let accSubtype: "MOUSE" | "KEYBOARD" | "HEADSET" | "CONTROLLER" = "MOUSE";
      if (
        lower.includes("control") ||
        lower.includes("mando") ||
        lower.includes("joystick") ||
        lower.includes("gamepad") ||
        lower.includes("dualsense") ||
        lower.includes("dualshock") ||
        lower.includes("joy-con") ||
        lower.includes("joycon") ||
        lower.includes("elite") ||
        lower.includes("edge")
      ) {
        accSubtype = "CONTROLLER";
      } else if (
        lower.includes("teclado") ||
        lower.includes("keyboard") ||
        lower.includes("switch") && lower.includes("mecanico")
      ) {
        accSubtype = "KEYBOARD";
      } else if (
        lower.includes("audifono") ||
        lower.includes("headset") ||
        lower.includes("auricular") ||
        lower.includes("cascos") ||
        lower.includes("headphone")
      ) {
        accSubtype = "HEADSET";
      } else {
        accSubtype = "MOUSE";
      }

      // Infer brand from product name
      let inferredBrand = "Omni Gaming / Fabricante Oficial";
      if (lower.includes("primus")) inferredBrand = "Primus Gaming";
      else if (lower.includes("razer")) inferredBrand = "Razer";
      else if (lower.includes("logitech")) inferredBrand = "Logitech G";
      else if (lower.includes("sony") || lower.includes("playstation")) inferredBrand = "Sony PlayStation";
      else if (lower.includes("xbox") || lower.includes("microsoft")) inferredBrand = "Microsoft Xbox";
      else if (lower.includes("nintendo")) inferredBrand = "Nintendo";
      else if (lower.includes("hyperx")) inferredBrand = "HyperX";
      else if (lower.includes("steelseries")) inferredBrand = "SteelSeries";
      else if (lower.includes("corsair")) inferredBrand = "Corsair";
      else if (lower.includes("redragon")) inferredBrand = "Redragon";
      else if (lower.includes("8bitdo")) inferredBrand = "8BitDo";

      customSpecifications = {
        categoryType: "GAMING_ACCESSORY",
        gamingAccessory: {
          accessoryType: accSubtype,
          controller:
            accSubtype === "CONTROLLER"
              ? {
                  brand: inferredBrand,
                  platformCompatibility: lower.includes("ps5") || lower.includes("dualsense")
                    ? "PS5, PC Windows 11, Mac, iOS, Android"
                    : lower.includes("xbox")
                    ? "Xbox Series X|S, Xbox One, Windows 10/11, Cloud Gaming"
                    : lower.includes("switch")
                    ? "Nintendo Switch / Switch OLED, PC"
                    : "Multiplataforma (PC, PS5/PS4, Xbox Series X|S, Bluetooth)",
                  connectionType: "Inalámbrico Bluetooth + Conexión USB-C de baja latencia",
                  feedbackHaptic: "Motores dobles de vibración háptica y gatillos de respuesta dinámica",
                  weight: "280 gramos (Ergonomía pro balanceada)",
                  color: "Negro Mate / Blanco Glaciar / Edición Especial",
                  layout: lower.includes("ps5") || lower.includes("sony")
                    ? "Simétrico PlayStation Style (D-Pad, sticks paralelos y touchpad capacitivo)"
                    : "Asimétrico Xbox Style (Palancas escalonadas ergonómicas)",
                  batteryLife: "Hasta 12 a 15 horas continuas de juego",
                  rechargeableBattery: "Batería de litio recargable integrada de 1560 mAh",
                  programmableBackPaddles: lower.includes("edge") || lower.includes("elite") || lower.includes("pro")
                    ? "4 palancas traseras de acero reasignables"
                    : "2 botones traseros personalizables remapeables",
                  triggerStops: lower.includes("edge") || lower.includes("elite") || lower.includes("pro")
                    ? "Topes ajustables de 3 posiciones para disparo instantáneo"
                    : "Respuesta de recorrido ultra-rápido en gatillos",
                  audioJack: "Conector Jack estéreo de 3.5 mm para audífonos con micrófono",
                  hallEffectSticks: "Sensores magnéticos Hall Effect anti-drift de precisión micrométrica",
                  lighting: "Barra luminosa LED interactiva y retroiluminación sutil",
                  softwareCustomization: "Configuración integral de zonas muertas, mapeo de botones y perfiles en memoria",
                }
              : undefined,
          mouse:
            accSubtype === "MOUSE"
              ? {
                  brand: inferredBrand,
                  tracking: "Sensor Óptico PixArt de alta precisión",
                  buttonCount: lower.includes("mmo") ? 12 : 6,
                  maxDpi: lower.includes("30k") ? 30000 : 16000,
                  wiring: lower.includes("wireless") || lower.includes("inalambrico")
                    ? "Inalámbrico 2.4GHz HyperSpeed + Bluetooth + USB-C"
                    : "Cable Speedflex mallado de ultra baja fricción",
                  weight: "65 gramos (Chasis ultraligero)",
                  dimensions: "127 x 65 x 43 mm",
                  adjustableDpi: "Sí, 5 perfiles configurables con botón dedicado",
                  color: "Negro Mate con acabados texturizados",
                  pollingRate: "1000 Hz / 1 ms (Compatible con 4000 Hz / 8000 Hz)",
                  adjustableWeight: "No (Estructura fija ultraligera para eSports)",
                  handedness: "Diestro Ergonómico",
                  technology: "Switches Ópticos mecánicos de 90 millones de clics",
                  lighting: "Iluminación RGB personalizable con perfiles en memoria",
                  powerSource: "Batería recargable vía USB-C (hasta 90 hrs de autonomía)",
                }
              : undefined,
          keyboard:
            accSubtype === "KEYBOARD"
              ? {
                  brand: inferredBrand,
                  partNumber: `KB-${cleanSlugPart}-PRO`,
                  type: "Mecánico",
                  category: lower.includes("60") ? "60% Compacto" : lower.includes("tkl") ? "TKL (Tenkeyless)" : "100% Tamaño Completo",
                  backlight: "RGB por tecla personalizable 16.8M colores",
                  switchType: "Switches Mecánicos Lineales / Táctiles intercambiables (Hot-Swap)",
                  wiring: "Cable USB-C desmontable trenzado",
                  connectionTechnology: "Conexión alámbrica de ultra baja latencia",
                  macroKeys: "Totalmente programable vía software",
                  hasWristRest: "Sí, reposamuñecas ergonómico magnético acolchado",
                  hasMediaKeys: "Rueda de volumen multifunción y controles multimedia",
                }
              : undefined,
          headset:
            accSubtype === "HEADSET"
              ? {
                  type: "Over-Ear Circumauricular Cerrado",
                  microphone: "Micrófono desmontable cardioide con cancelación de ruido",
                  frequencyResponse: "12 Hz - 28.000 Hz (Hi-Res Audio)",
                  color: "Negro con almohadillas viscoelásticas transpirables",
                  lighting: "RGB sutil en copas laterales",
                  connectivity: "Inalámbrico 2.4GHz sin pérdidas + Bluetooth 5.2 + Jack 3.5mm",
                  activeNoiseCancelling: "Cancelación de ruido pasiva avanzada con aislamiento acústico",
                  inLineControls: "Controles de volumen y silenciador de micrófono integrados en copa",
                  driverSize: "Drivers de 50 mm de Titanio",
                  impedance: "32 Ohms @ 1 kHz",
                  cableLength: "Cable desmontable de 1.8 m + cable de carga USB-C",
                }
              : undefined,
        },
      };
    } else if (matchedCategory === "CONSOLE") {
      customSpecifications = {
        categoryType: "CONSOLE",
        console: {
          baseModel: name,
          capacity: lower.includes("2tb") ? "2 TB SSD NVMe" : lower.includes("512") ? "512 GB SSD" : "1 TB SSD NVMe Ultrarrápido",
          format: lower.includes("digital") ? "Digital Edition (Sin lector óptico)" : "Físico (Lector Ultra HD Blu-ray 4K)",
          controllersIncluded: "1 Control Oficial Inalámbrico de última generación",
          bundleIncluded: "Consola, Mando, Cable HDMI 2.1 Ultra High Speed, Cable de poder, Cable USB-C y base",
          ports: "1x HDMI 2.1, 2x USB-A SuperSpeed 10Gbps, 2x USB-C, Puerto Gigabit Ethernet LAN",
          gameCompatibility: "Catálogo completo de la generación y retrocompatibilidad garantizada",
          featuredHighlights: "Audio 3D inmersivo, Ray Tracing por hardware, salida 4K 120Hz / HDR y tiempos de carga instantáneos",
        },
      };
    } else if (matchedCategory === "BOOK") {
      // Inferred Manga metadata
      let inferredPublisher = "Panini Manga / Norma Editorial";
      if (lower.includes("ivrea")) inferredPublisher = "Editorial Ivrea";
      else if (lower.includes("panini")) inferredPublisher = "Panini Manga";
      else if (lower.includes("norma")) inferredPublisher = "Norma Editorial";
      else if (lower.includes("viz")) inferredPublisher = "VIZ Media";
      else if (lower.includes("shueisha")) inferredPublisher = "Shueisha (Importación Japón)";
      else if (lower.includes("solo leveling") || lower.includes("d&c")) inferredPublisher = "Norma Editorial / D&C Media";

      customSpecifications = {
        categoryType: "BOOK",
        book: {
          publisher: inferredPublisher,
          language: lower.includes("jap") ? "Japonés Original" : lower.includes("eng") || lower.includes("ingles") ? "Inglés" : "Español Neutro",
          pages: lower.includes("artbook") ? "192 páginas a todo color papel couché" : "200 a 240 páginas b/n con páginas a color",
          binding: lower.includes("tapa dura") || lower.includes("hardcover") ? "Tapa Dura de Lujo (Hardcover)" : "Rústica con Sobrecubierta (Tankōbon B6)",
          dimensions: "13 x 18 cm (Formato Tankōbon)",
          hasColorPages: "Sí, incluye páginas a todo color exclusivas de apertura",
          isbn: `978-4-${Math.floor(10000000 + Math.random() * 89999999)}`,
        },
      };
    } else if (matchedCategory === "APPAREL") {
      customSpecifications = {
        categoryType: "APPAREL",
        apparel: {
          apparelType: lower.includes("poleron") || lower.includes("hoodie") ? "Polerón / Hoodie Oversize" : "Polera Estampada Manga Corta",
          size: "S, M, L, XL (Corte Regular Unisex)",
          gender: "Unisex Streetwear",
          material: "100% Algodón Peinado 240g / Felpa perchada premium",
          careInstructions: "Lavar con agua fría del revés, no secar en secadora, no planchar sobre estampado",
          license: `Licencia Oficial Conmemorativa ${name.split(" ")[0] || "Anime"}`,
        },
      };
    } else if (matchedCategory === "MERCH") {
      customSpecifications = {
        categoryType: "MERCH",
        merch: {
          itemType: lower.includes("taza") ? "Taza Cerámica" : lower.includes("peluche") ? "Peluche Felpa" : "Artículo de Vitrina / Exhibición",
          material: "Materiales de alta durabilidad grado coleccionista",
          dimensions: "Dimensiones proporcionales a escala de escritorio",
          franchise: name.split(" ")[0] || "Franquicia Oficial",
        },
      };
    } else if (matchedCategory === "AUDIO") {
      customSpecifications = {
        categoryType: "AUDIO",
        audio: {
          format: lower.includes("vinilo") ? "Disco de Vinilo LP 180g" : "CD de Audio Edición Deluxe",
          discCount: "2 Discos",
          recordLabel: "Sony Music / Sello Oficial Soundtrack",
          includesArtbook: "Sí, incluye libreto con partituras y notas de producción",
          featuredTracks: "Soundtrack original completo con temas principales y créditos",
        },
      };
    }
  }

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
    ageRating,
    genres,
    figureSpecs,
    gameSpecs,
    collectibleSpecs,
    customSpecifications,
    engine: "SMART_KNOWLEDGE_ENGINE",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productName = body?.name?.trim();
    const selectedType = body?.selectedType as "FIGURE" | "VIDEO_GAME" | "COLLECTIBLE" | "OTHER" | undefined;
    const customCategoryLabel = body?.customCategoryLabel?.trim();

    if (!productName) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar al menos el Nombre del Producto para auto-completar los datos." },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiApiKey) {
      try {
        const categoryConstraint = selectedType
          ? `REGLA OBLIGATORIA DE CATEGORÍA:
El administrador ha seleccionado explícitamente la categoría: "${selectedType}" ${
              selectedType === "OTHER" && customCategoryLabel
                ? `(Subcategoría personalizada: "${customCategoryLabel}")`
                : ""
            }.
DEBES OBLIGATORIAMENTE respetar esta categoría ("type": "${selectedType}", "customCategoryLabel": "${customCategoryLabel || ""}").
NO cambies la categoría a VIDEO_GAME si es un accesorio como un control, volante o headset; si es "Accesorio Gaming" o "OTHER", genera el SKU con prefijo ACC- y redacta una descripción técnica/comercial enfocada en ergonomía, botones, latencia y compatibilidad.`
          : `Clasifica inteligentemente el producto entre "FIGURE", "VIDEO_GAME", "COLLECTIBLE" u "OTHER".`;

        const prompt = `Eres un experto catalogador de productos de colección y e-commerce de videojuegos, figuras de anime y cartas TCG en Chile llamado OmniCollector.
Genera la ficha técnica completa en formato JSON para el siguiente producto: "${productName}".

${categoryConstraint}

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código tipo \`\`\`json) con esta estructura exacta:
{
  "sku": "Ej: FIG-MAKIMA-17 o VG-CYBERP-2077 o ACC-DUALS-001 o COL-CHARIZ-001",
  "name": "${productName}",
  "type": "${selectedType || "FIGURE"}",
  "customCategoryLabel": "${customCategoryLabel || ""}",
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
  },
  "customSpecifications": {
    "categoryType": "GAMING_ACCESSORY" | "CONSOLE" | "APPAREL" | "BOOK" | "MERCH" | "AUDIO",
    "gamingAccessory": {
      "accessoryType": "CONTROLLER" | "MOUSE" | "KEYBOARD" | "HEADSET",
      "controller": { "brand": "", "platformCompatibility": "", "connectionType": "", "feedbackHaptic": "", "weight": "", "color": "", "layout": "", "batteryLife": "", "rechargeableBattery": "", "programmableBackPaddles": "", "triggerStops": "", "audioJack": "", "hallEffectSticks": "", "lighting": "", "softwareCustomization": "" },
      "mouse": { "brand": "", "tracking": "", "buttonCount": 6, "maxDpi": 16000, "wiring": "", "weight": "", "dimensions": "", "adjustableDpi": "", "color": "", "pollingRate": "", "adjustableWeight": "", "handedness": "", "technology": "", "lighting": "", "powerSource": "" },
      "keyboard": { "brand": "", "partNumber": "", "type": "", "category": "", "backlight": "", "switchType": "", "wiring": "", "connectionTechnology": "", "macroKeys": "", "hasWristRest": "", "hasMediaKeys": "" },
      "headset": { "type": "", "microphone": "", "frequencyResponse": "", "color": "", "lighting": "", "connectivity": "", "activeNoiseCancelling": "", "inLineControls": "", "driverSize": "", "impedance": "", "cableLength": "" }
    },
    "book": {
      "publisher": "Editorial (ej. Panini Manga / Ivrea / Norma / VIZ)",
      "language": "Español Neutro / Japonés",
      "pages": "N° de páginas (ej. 200 páginas)",
      "binding": "Rústica con Sobrecubierta (Tankōbon) / Tapa Dura",
      "dimensions": "13 x 18 cm",
      "hasColorPages": "Sí / No",
      "isbn": "Código ISBN"
    },
    "console": {
      "baseModel": "", "capacity": "", "format": "", "controllersIncluded": "", "bundleIncluded": "", "ports": "", "gameCompatibility": "", "featuredHighlights": ""
    },
    "apparel": {
      "apparelType": "", "size": "", "gender": "", "material": "", "careInstructions": "", "license": ""
    },
    "merch": {
      "itemType": "", "material": "", "dimensions": "", "franchise": ""
    },
    "audio": {
      "format": "", "discCount": "", "recordLabel": "", "includesArtbook": "", "featuredTracks": ""
    }
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
            let cleanText = rawText;
            if (cleanText.includes("```json")) {
              cleanText = cleanText.split("```json")[1].split("```")[0].trim();
            } else if (cleanText.includes("```")) {
              cleanText = cleanText.split("```")[1].split("```")[0].trim();
            }

            const parsed = JSON.parse(cleanText);
            if (selectedType) {
              parsed.type = selectedType;
              if (selectedType === "OTHER") {
                parsed.customCategoryLabel =
                  customCategoryLabel || parsed.customCategoryLabel || "Accesorio Gaming";
              }
            }

            // Always guarantee full customSpecifications if OTHER
            if (parsed.type === "OTHER") {
              const fallbackHeuristic = generateWithSmartEngine(productName, parsed.type, parsed.customCategoryLabel);
              const fallbackSpecs = fallbackHeuristic.customSpecifications || {};
              const catType = fallbackSpecs.categoryType || getCategoryTypeFromLabel(parsed.customCategoryLabel);

              parsed.customSpecifications = {
                categoryType: catType,
                ...fallbackSpecs,
                ...(parsed.customSpecifications || {}),
              };

              if (catType === "BOOK") {
                parsed.customSpecifications.book = {
                  ...(fallbackSpecs.book || {}),
                  ...(parsed.customSpecifications.book || {}),
                };
              } else if (catType === "CONSOLE") {
                parsed.customSpecifications.console = {
                  ...(fallbackSpecs.console || {}),
                  ...(parsed.customSpecifications.console || {}),
                };
              } else if (catType === "APPAREL") {
                parsed.customSpecifications.apparel = {
                  ...(fallbackSpecs.apparel || {}),
                  ...(parsed.customSpecifications.apparel || {}),
                };
              } else if (catType === "MERCH") {
                parsed.customSpecifications.merch = {
                  ...(fallbackSpecs.merch || {}),
                  ...(parsed.customSpecifications.merch || {}),
                };
              } else if (catType === "AUDIO") {
                parsed.customSpecifications.audio = {
                  ...(fallbackSpecs.audio || {}),
                  ...(parsed.customSpecifications.audio || {}),
                };
              } else if (catType === "GAMING_ACCESSORY") {
                parsed.customSpecifications.gamingAccessory = {
                  ...(fallbackSpecs.gamingAccessory || {}),
                  ...(parsed.customSpecifications.gamingAccessory || {}),
                };
              }
            }

            // Remove any image auto-generation so "4. Galería de Fotos & Portada" is NOT touched
            delete parsed.imageUrl;
            delete parsed.images;

            return NextResponse.json({
              success: true,
              data: {
                ...parsed,
                engine: "GEMINI_AI",
              },
            });
          }
        } else {
          const errBody = await geminiRes.text();
          console.warn(`[Auto-Fill API] Gemini API error (${geminiRes.status}):`, errBody);
        }
      } catch (geminiErr) {
        console.warn("[Auto-Fill API] Gemini API call failed, using fallback engine:", geminiErr);
      }
    }

    // Fallback to Smart Heuristic Collector Engine (with admin selected category priority)
    const fallbackResult = generateWithSmartEngine(productName, selectedType, customCategoryLabel);
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
