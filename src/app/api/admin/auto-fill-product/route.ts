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
    gameType?: "CONSOLE" | "PC" | string;
    title?: string;
    developer?: string;
    publisher?: string;
    releaseYear?: string;
    genre?: string;
    gameModes?: string;
    gameEngine?: string;
    supportedPlatforms?: string;
    platform?: string;
    edition?: string;
    audioLanguages?: string;
    subtitleLanguages?: string;
    ageRating?: string;
    fileSize?: string;
    displayModes?: string;
    xboxSeriesSOptimization?: string;
    hardwareFeatures?: string;
    pcOs?: string;
    pcProcessor?: string;
    pcRam?: string;
    pcGpu?: string;
    pcStorage?: string;
    players?: string;
    resolution?: string;
    [key: string]: any;
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
    hardware?: any;
    apparel?: any;
    book?: any;
    merch?: any;
    audio?: any;
  };
  engine: "GEMINI_AI" | "SMART_KNOWLEDGE_ENGINE";
}

function mergeNonEmpty<T extends Record<string, any>>(fallback: T = {} as T, incoming: Partial<T> = {}): T {
  const result: any = { ...fallback };
  for (const [k, v] of Object.entries(incoming || {})) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      result[k] = v;
    }
  }
  return result as T;
}

function getCategoryTypeFromLabel(
  label?: string
): "CONSOLE" | "HARDWARE" | "GAMING_ACCESSORY" | "APPAREL" | "BOOK" | "MERCH" | "AUDIO" {
  const l = (label || "").toLowerCase();
  if (l.includes("consola")) return "CONSOLE";
  if (l.includes("hardware") || l.includes("componente") || l.includes("ssd") || l.includes("nvme") || l.includes("m.2") || l.includes("ram") || l.includes("gpu") || l.includes("tarjeta gr") || l.includes("procesador") || l.includes("placa")) return "HARDWARE";
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
      if (cat === "CONSOLE") customCategoryLabel = "Consola";
      else if (cat === "HARDWARE") customCategoryLabel = "Hardware & Componentes";
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
    } else if (lower.includes("consola") || lower.includes("playstation 5 slim") || lower.includes("switch oled") || lower.includes("xbox series x") || lower.includes("steam deck")) {
      type = "OTHER";
      customCategoryLabel = "Consola";
    } else if (lower.includes("hardware") || lower.includes("componente") || lower.includes("ssd") || lower.includes("nvme") || lower.includes("ram") || lower.includes("gpu") || lower.includes("tarjeta gr") || lower.includes("procesador") || lower.includes("geforce") || lower.includes("ryzen") || lower.includes("rtx")) {
      type = "OTHER";
      customCategoryLabel = "Hardware & Componentes";
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
    else if (cat === "HARDWARE") prefix = "HW";
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
    } else if (cat === "HARDWARE") {
      price = 149900;
      originalPrice = 179900;
      costPrice = 110000;
      isPreOrder = false;
      stockAvailable = 8;
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
      genres = "Accesorios Gaming, Mandos, Periféricos, Esports";
    } else if (customCategoryLabel === "Consola") {
      genres = "Consolas, Videojuegos, Sistemas, Ediciones Limitadas";
    } else if (customCategoryLabel === "Hardware & Componentes") {
      genres = "Hardware, Componentes, Almacenamiento SSD, Tarjetas Gráficas, PC Gaming";
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

  const isPcGame = lower.includes("pc") || lower.includes("steam") || lower.includes("epic") || lower.includes("gog");
  const gameType = isPcGame ? "PC" : "CONSOLE";
  const gameSpecs =
    type === "VIDEO_GAME"
      ? {
          gameType,
          title: name || "Título del Videojuego",
          developer: lower.includes("capcom")
            ? "Capcom"
            : lower.includes("fromsoftware") || lower.includes("elden")
            ? "FromSoftware"
            : lower.includes("square") || lower.includes("final fantasy")
            ? "Square Enix"
            : lower.includes("nintendo") || lower.includes("zelda") || lower.includes("mario")
            ? "Nintendo EPD"
            : lower.includes("cd projekt") || lower.includes("cyberpunk") || lower.includes("witcher")
            ? "CD Projekt RED"
            : lower.includes("game science") || lower.includes("wukong")
            ? "Game Science"
            : "Desarrolladora Oficial",
          publisher: lower.includes("nintendo")
            ? "Nintendo"
            : lower.includes("sony") || lower.includes("playstation")
            ? "Sony Interactive Entertainment"
            : lower.includes("capcom")
            ? "Capcom"
            : lower.includes("square")
            ? "Square Enix"
            : lower.includes("bandai")
            ? "Bandai Namco Entertainment"
            : lower.includes("valve")
            ? "Valve Corporation"
            : "Distribuidora Oficial",
          releaseYear: "2025",
          genre: lower.includes("rpg") || lower.includes("fantasy")
            ? "Acción / RPG / Aventura"
            : lower.includes("lucha") || lower.includes("tekken") || lower.includes("street fighter")
            ? "Lucha / Peleas Competitivo"
            : lower.includes("carreras") || lower.includes("forza") || lower.includes("gran turismo")
            ? "Carreras / Simulación"
            : "Acción / Aventura",
          gameModes: "Un jugador, Cooperativo online",
          gameEngine: lower.includes("wukong") || lower.includes("unreal")
            ? "Unreal Engine 5.4"
            : lower.includes("capcom") || lower.includes("resident")
            ? "RE Engine"
            : "Motor Gráfico Especializado Propietario",
          supportedPlatforms: isPcGame
            ? "Steam, Epic Games Store, GOG Galaxy"
            : "PlayStation 5, Xbox Series X|S, Nintendo Switch",
          platform: isPcGame
            ? "PC"
            : lower.includes("switch")
            ? "NINTENDO_SWITCH"
            : lower.includes("xbox")
            ? "XBOX_SERIES"
            : "PS5",
          edition: lower.includes("deluxe")
            ? "DELUXE"
            : lower.includes("collector")
            ? "COLLECTORS"
            : "STANDARD",
          audioLanguages: "Español Latino, Inglés, Japonés",
          subtitleLanguages: "Español Latino, Inglés, Portugués, Francés",
          ageRating: "ESRB Teen (13+) / PEGI 16",
          fileSize: isPcGame ? "85 GB en SSD NVMe" : "65 GB en SSD interno",
          players: "Un jugador, Cooperativo online",
          resolution: "Modo Rendimiento (1440p 60fps) / Modo Calidad (4K 30fps Ray Tracing)",
          // Consola: Rendimiento
          displayModes: "Modo Rendimiento (1440p 60fps) / Modo Calidad (4K 30fps Ray Tracing)",
          xboxSeriesSOptimization: "1080p 60fps con resolución dinámica optimizada",
          hardwareFeatures: "Gatillos adaptativos DualSense, retroalimentación háptica, Audio 3D Tempest, cargas ultrarrápidas SSD",
          // PC: Requisitos de Hardware
          pcOs: "Windows 11 / Windows 10 (64-bit)",
          pcProcessor: "Intel Core i7-12700K / AMD Ryzen 7 7800X3D",
          pcRam: "16 GB RAM (32 GB recomendado para 4K)",
          pcGpu: "NVIDIA GeForce RTX 4070 12GB / AMD Radeon RX 7800 XT 16GB",
          pcStorage: "85 GB de espacio disponible en SSD NVMe",
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
    } else if (matchedCategory === "HARDWARE") {
      let hwType: any = "TARJETA_DE_VIDEO";
      if (lower.includes("ssd") || lower.includes("nvme") || lower.includes("m.2") || lower.includes("990 pro") || lower.includes("kc3000") || lower.includes("sn850")) hwType = "SSD";
      else if (lower.includes("disco duro") || lower.includes("hdd") || lower.includes("barracuda") || lower.includes("ironwolf") || lower.includes("skyhawk") || lower.includes("wd blue")) hwType = "DISCO_DURO";
      else if (lower.includes("ram") || lower.includes("ddr") || lower.includes("dimm") || lower.includes("fury") || lower.includes("vengeance") || lower.includes("trident")) hwType = "RAM";
      else if (lower.includes("placa") || lower.includes("motherboard") || lower.includes("b650") || lower.includes("b550") || lower.includes("x670") || lower.includes("x870") || lower.includes("z790") || lower.includes("b760") || lower.includes("z890") || lower.includes("chipset")) hwType = "PLACA_MADRE";
      else if (lower.includes("procesador") || lower.includes("ryzen") || lower.includes("intel core") || lower.includes("core i") || lower.includes("cpu") || lower.includes("7800x3d") || lower.includes("9800x3d") || lower.includes("14700") || lower.includes("14900")) hwType = "PROCESADORES";
      else if (lower.includes("fuente") || lower.includes("power supply") || lower.includes("psu") || lower.includes("80 plus") || lower.includes("toughpower") || lower.includes("rm850") || lower.includes("rm750")) hwType = "FUENTE_DE_PODER";
      else if (lower.includes("cooler") || lower.includes("refrigeraci") || lower.includes("disipador") || lower.includes("aio") || lower.includes("kraken") || lower.includes("liquid") || lower.includes("peerless")) hwType = "COOLER_CPU";
      else if (lower.includes("gabinete") || lower.includes("case") || lower.includes("chassis") || lower.includes("mid tower") || lower.includes("4000d") || lower.includes("o11") || lower.includes("h5 flow") || lower.includes("h9 flow")) hwType = "GABINETE";
      else if (lower.includes("ventilador") || lower.includes("fan") || lower.includes("pwm fan") || lower.includes("argb fan")) hwType = "VENTILADORES";
      else if (lower.includes("rtx") || lower.includes("gtx") || lower.includes("geforce") || lower.includes("radeon") || lower.includes("rx ") || lower.includes("gpu") || lower.includes("tarjeta") || lower.includes("grafica") || lower.includes("video")) hwType = "TARJETA_DE_VIDEO";

      // VRAM detection for GPU
      const vramMatch = name.match(/\b(\d{1,2})\s*(?:g|gb)\b/i);
      const vramGb = vramMatch ? parseInt(vramMatch[1], 10) : (lower.includes("5090") || lower.includes("4090") ? 24 : lower.includes("5080") || lower.includes("4080") ? 16 : lower.includes("5070 ti") || lower.includes("4070 ti super") ? 16 : lower.includes("5070") || lower.includes("4070") ? 12 : 8);
      const is50Series = lower.includes("5090") || lower.includes("5080") || lower.includes("5070") || lower.includes("5060");
      const is40Series = lower.includes("4090") || lower.includes("4080") || lower.includes("4070") || lower.includes("4060");
      const vramType = is50Series ? "GDDR7" : is40Series ? "GDDR6X" : "GDDR6";

      // Motherboard Socket & Chipset Synchronization
      let mbSocket = "AM5";
      let mbChipset = "AMD B650";
      if (lower.includes("x870")) { mbSocket = "AM5"; mbChipset = "AMD X870"; }
      else if (lower.includes("x670")) { mbSocket = "AM5"; mbChipset = "AMD X670"; }
      else if (lower.includes("b650")) { mbSocket = "AM5"; mbChipset = "AMD B650"; }
      else if (lower.includes("a620")) { mbSocket = "AM5"; mbChipset = "AMD A620"; }
      else if (lower.includes("b550")) { mbSocket = "AM4"; mbChipset = "AMD B550"; }
      else if (lower.includes("x570")) { mbSocket = "AM4"; mbChipset = "AMD X570"; }
      else if (lower.includes("z890")) { mbSocket = "LGA1851"; mbChipset = "Intel Z890"; }
      else if (lower.includes("b860")) { mbSocket = "LGA1851"; mbChipset = "Intel B860"; }
      else if (lower.includes("z790")) { mbSocket = "LGA1700"; mbChipset = "Intel Z790"; }
      else if (lower.includes("b760")) { mbSocket = "LGA1700"; mbChipset = "Intel B760"; }
      else if (lower.includes("z690")) { mbSocket = "LGA1700"; mbChipset = "Intel Z690"; }
      else if (lower.includes("b660")) { mbSocket = "LGA1700"; mbChipset = "Intel B660"; }
      else if (lower.includes("intel") || lower.includes("lga1700")) { mbSocket = "LGA1700"; mbChipset = "Intel B760"; }
      else if (lower.includes("am5") || lower.includes("ryzen")) { mbSocket = "AM5"; mbChipset = "AMD B650"; }

      // CPU Socket & Details
      let cpuSocket = "AM5";
      let cpuCores = "8 Núcleos / 16 Hilos";
      let cpuBase = "3.8 GHz";
      let cpuTurbo = "5.3 GHz Turbo";
      let cpuCache = "32 MB L3 Cache";
      let cpuCoreArch = "Zen 4";
      let cpuProcess = "4 nm TSMC FinFET";
      let cpuTdp = "105 W";

      if (lower.includes("7800x3d")) {
        cpuSocket = "AM5"; cpuCores = "8 Núcleos / 16 Hilos"; cpuBase = "4.2 GHz"; cpuTurbo = "5.0 GHz Turbo"; cpuCache = "96 MB L3 3D V-Cache (104 MB total)"; cpuCoreArch = "Zen 4 (Raphael)"; cpuProcess = "5 nm TSMC FinFET"; cpuTdp = "120 W";
      } else if (lower.includes("9800x3d")) {
        cpuSocket = "AM5"; cpuCores = "8 Núcleos / 16 Hilos"; cpuBase = "4.7 GHz"; cpuTurbo = "5.2 GHz Turbo"; cpuCache = "96 MB L3 2nd Gen 3D V-Cache"; cpuCoreArch = "Zen 5 (Granite Ridge)"; cpuProcess = "4 nm TSMC FinFET"; cpuTdp = "120 W";
      } else if (lower.includes("7700x")) {
        cpuSocket = "AM5"; cpuCores = "8 Núcleos / 16 Hilos"; cpuBase = "4.5 GHz"; cpuTurbo = "5.4 GHz Turbo"; cpuCache = "32 MB L3 Cache"; cpuCoreArch = "Zen 4"; cpuProcess = "5 nm TSMC"; cpuTdp = "105 W";
      } else if (lower.includes("7600")) {
        cpuSocket = "AM5"; cpuCores = "6 Núcleos / 12 Hilos"; cpuBase = "3.8 GHz"; cpuTurbo = "5.1 GHz Turbo"; cpuCache = "32 MB L3 Cache"; cpuCoreArch = "Zen 4"; cpuProcess = "5 nm TSMC"; cpuTdp = "65 W";
      } else if (lower.includes("7950x")) {
        cpuSocket = "AM5"; cpuCores = "16 Núcleos / 32 Hilos"; cpuBase = "4.5 GHz"; cpuTurbo = "5.7 GHz Turbo"; cpuCache = "64 MB L3 Cache"; cpuCoreArch = "Zen 4"; cpuProcess = "5 nm TSMC"; cpuTdp = "170 W";
      } else if (lower.includes("14900")) {
        cpuSocket = "LGA1700"; cpuCores = "24 Núcleos (8P+16E) / 32 Hilos"; cpuBase = "3.2 GHz"; cpuTurbo = "6.0 GHz Thermal Velocity Boost"; cpuCache = "36 MB Intel Smart Cache"; cpuCoreArch = "Raptor Lake Refresh"; cpuProcess = "Intel 7 (10 nm)"; cpuTdp = "125 W (Base) / 253 W (Turbo)";
      } else if (lower.includes("14700")) {
        cpuSocket = "LGA1700"; cpuCores = "20 Núcleos (8P+12E) / 28 Hilos"; cpuBase = "3.4 GHz"; cpuTurbo = "5.6 GHz Turbo Max"; cpuCache = "33 MB Intel Smart Cache"; cpuCoreArch = "Raptor Lake Refresh"; cpuProcess = "Intel 7 (10 nm)"; cpuTdp = "125 W (Base) / 253 W (Turbo)";
      } else if (lower.includes("14600")) {
        cpuSocket = "LGA1700"; cpuCores = "14 Núcleos (6P+8E) / 20 Hilos"; cpuBase = "3.5 GHz"; cpuTurbo = "5.3 GHz Turbo"; cpuCache = "24 MB Intel Smart Cache"; cpuCoreArch = "Raptor Lake Refresh"; cpuProcess = "Intel 7 (10 nm)"; cpuTdp = "125 W / 181 W";
      } else if (lower.includes("5800x") || lower.includes("5700x") || lower.includes("5600")) {
        cpuSocket = "AM4"; cpuCores = "8 Núcleos / 16 Hilos"; cpuBase = "3.6 GHz"; cpuTurbo = "4.8 GHz Turbo"; cpuCache = "32 MB L3 Cache"; cpuCoreArch = "Zen 3"; cpuProcess = "7 nm TSMC"; cpuTdp = "105 W";
      }

      customSpecifications = {
        categoryType: "HARDWARE",
        hardware: {
          hardwareType: hwType,
          componentType: hwType === "SSD" ? "Almacenamiento (SSD NVMe M.2)"
            : hwType === "RAM" ? "Memoria RAM"
            : hwType === "TARJETA_DE_VIDEO" ? "Tarjeta Gráfica (GPU)"
            : hwType === "PROCESADORES" ? "Procesador (CPU)"
            : hwType === "PLACA_MADRE" ? "Placa Madre"
            : hwType === "FUENTE_DE_PODER" ? "Fuente de Poder"
            : hwType === "COOLER_CPU" ? "Cooler CPU"
            : hwType === "GABINETE" ? "Gabinete"
            : hwType === "VENTILADORES" ? "Ventiladores"
            : "Componente de Hardware",
          brand: lower.includes("samsung") ? "Samsung"
            : lower.includes("kingston") ? "Kingston"
            : lower.includes("corsair") ? "Corsair"
            : lower.includes("asus") ? "ASUS ROG"
            : lower.includes("msi") ? "MSI"
            : lower.includes("gigabyte") ? "Gigabyte"
            : lower.includes("asrock") ? "ASRock"
            : lower.includes("noctua") ? "Noctua"
            : lower.includes("lian li") ? "Lian Li"
            : lower.includes("nzxt") ? "NZXT"
            : lower.includes("thermalright") ? "Thermalright"
            : lower.includes("deepcool") ? "DeepCool"
            : lower.includes("nvidia") || lower.includes("rtx") || lower.includes("geforce") ? "NVIDIA"
            : lower.includes("amd") || lower.includes("ryzen") || lower.includes("radeon") ? "AMD"
            : lower.includes("intel") ? "Intel"
            : "Fabricante Oficial",
          model: name,
          interfaceOrSocket: hwType === "SSD" ? "PCIe 4.0 x4, NVMe 2.0 (M.2 2280)"
            : hwType === "RAM" ? "DDR5 DIMM 288-pin"
            : hwType === "PLACA_MADRE" ? `Socket ${mbSocket}, Chipset ${mbChipset}`
            : hwType === "PROCESADORES" ? `Socket ${cpuSocket}`
            : "PCIe 4.0 / 5.0",
          capacityOrSpeed: hwType === "RAM" ? "32 GB (2x16GB) 6000 MT/s"
            : hwType === "SSD" ? (lower.includes("2tb") ? "2 TB (7.450 MB/s)" : "1 TB (7.000 MB/s)")
            : hwType === "TARJETA_DE_VIDEO" ? `${vramGb} GB ${vramType}`
            : hwType === "PROCESADORES" ? `${cpuBase} / ${cpuTurbo}`
            : "Alto Rendimiento",
          formFactor: hwType === "SSD" ? "M.2 2280" : hwType === "PLACA_MADRE" ? "ATX" : "Estándar ATX",
          powerConsumptionTdp: hwType === "TARJETA_DE_VIDEO" ? `${vramGb >= 16 ? "285W a 320W" : "200W a 250W"} (Fuente rec. 750W)`
            : hwType === "PROCESADORES" ? `TDP: ${cpuTdp}`
            : "Eficiencia energética certificada",
          warrantyYears: "3 años de garantía oficial directa del fabricante",
          featuredHighlights: "Componente de alta fidelidad, excelente refrigeración y máximo rendimiento para gaming y creación de contenido",
          gpu: hwType === "TARJETA_DE_VIDEO" ? {
            manufacturer: lower.includes("msi") ? "MSI" : lower.includes("asus") ? "ASUS" : lower.includes("gigabyte") ? "Gigabyte" : "Fabricante Oficial",
            gpu: name,
            memory: `${vramGb} GB ${vramType}`,
            bus: vramGb >= 24 ? "384-bit" : vramGb === 16 ? "256-bit" : vramGb === 12 ? "192-bit" : "128-bit",
            coreFrequencies: lower.includes("5070 ti") ? "Base: 2160 MHz / Boost: 2550 MHz (OC: 2580 MHz)"
              : lower.includes("5080") ? "Base: 2295 MHz / Boost: 2610 MHz"
              : lower.includes("5070") ? "Base: 2160 MHz / Boost: 2505 MHz"
              : lower.includes("4070 ti") ? "Base: 2310 MHz / Boost: 2610 MHz"
              : lower.includes("4070") ? "Base: 1920 MHz / Boost: 2475 MHz"
              : "Base: 2160 MHz / Boost: 2550 MHz",
            memoryFrequency: is50Series ? "28 Gbps (1750 MHz)" : is40Series ? "21 Gbps (1313 MHz)" : "18 Gbps",
            core: lower.includes("5090") ? "GB202"
              : lower.includes("5080") ? "GB203-400"
              : lower.includes("5070 ti") ? "GB203-300 / AD103"
              : lower.includes("5070") ? "GB205 / AD104"
              : lower.includes("4090") ? "AD102"
              : lower.includes("4080") ? "AD103"
              : lower.includes("4070") ? "AD104"
              : "NVIDIA Blackwell / Ada Lovelace",
            profile: "Estándar ATX",
            cooling: lower.includes("slim") || lower.includes("trio") || lower.includes("triple") ? "Sistema térmico Tri Frozr 3 con ventiladores TORX Fan 5.0" : "Ventilación Dual / Triple Fan de alto flujo",
            slots: lower.includes("slim") ? "2.5 slots" : "3.0 slots",
            length: lower.includes("slim") ? "307 x 125 x 46 mm" : "320 x 135 x 62 mm",
            lighting: lower.includes("msi") ? "ARGB Mystic Light" : lower.includes("asus") ? "ASUS Aura Sync RGB" : "ARGB direccionable sincronizable",
            backplate: "Sí, metálico reforzado de aluminio con aberturas de flujo Flow-Through",
            powerConnectors: vramGb >= 12 ? "1x 16-pin (12V-2x6 / 12VHPWR PCIe 5.0)" : "2x 8-pin PCIe",
            videoPorts: "3x DisplayPort 2.1 / 1.4a, 1x HDMI 2.1a",
          } : undefined,
          cpu: hwType === "PROCESADORES" ? {
            frequency: cpuBase,
            turboFrequency: cpuTurbo,
            coresThreads: cpuCores,
            cache: cpuCache,
            socket: cpuSocket,
            core: cpuCoreArch,
            manufacturingProcess: cpuProcess,
            tdp: cpuTdp,
            cooler: "No incluido (se recomienda refrigeración líquida o disipador doble torre)",
            integratedGraphics: lower.includes("f") ? "No posee (requiere GPU dedicada)" : lower.includes("ryzen") ? "AMD Radeon Graphics (2 CUs, RDNA 2 a 2200 MHz)" : "Intel UHD Graphics 770",
          } : undefined,
          motherboard: hwType === "PLACA_MADRE" ? {
            manufacturer: lower.includes("asus") ? "ASUS" : lower.includes("msi") ? "MSI" : lower.includes("gigabyte") ? "Gigabyte" : lower.includes("asrock") ? "ASRock" : "Fabricante Oficial",
            socket: mbSocket,
            chipset: mbChipset,
            memorySlots: "4x DDR5 DIMM (hasta 192 GB)",
            memoryChannels: "Dual Channel",
            format: lower.includes("micro") || lower.includes("m-atx") ? "Micro-ATX" : lower.includes("itx") ? "Mini-ITX" : "ATX",
            rgbSupport: "3x 3-pin ARGB Gen 2 (5V) + 1x 4-pin RGB (12V)",
            videoPorts: "1x HDMI 2.1 (4K@60Hz), 1x DisplayPort 1.4",
            powerPorts: "1x 24-pin ATX, 2x 8-pin EPS 12V",
            sliSupport: "No compatible",
            crossfireSupport: "Compatible con 2-Way AMD CrossFireX",
            raidSupport: "RAID 0, RAID 1, RAID 10 para SATA y M.2 NVMe",
            connectors: "4x SATA 6Gb/s, 3x M.2 (1x PCIe 5.0 x4 + 2x PCIe 4.0 x4 con disipadores Shield Frozr), 1x Conector USB-C frontal 20Gbps, 4x Fan Headers PWM",
            ports: "1x USB 3.2 Gen 2x2 Type-C (20Gbps), 4x USB 3.2 Gen 2 Type-A, 4x USB 2.0, 1x 2.5G LAN, Wi-Fi 6E, Audio 7.1 HD",
            expansions: "1x PCIe 5.0 x16 (SafeSlot metálico reforzado), 1x PCIe 4.0 x16 (modo x4), 2x PCIe 4.0 x1",
          } : undefined,
          ram: hwType === "RAM" ? {
            capacity: lower.includes("64gb") ? "64 GB (2x32GB)" : lower.includes("16gb") ? "16 GB (2x8GB)" : "32 GB (2x16GB)",
            type: lower.includes("ddr4") ? "DDR4" : "DDR5",
            speed: lower.includes("6400") ? "6400 MT/s" : lower.includes("5600") ? "5600 MT/s" : "6000 MT/s",
            format: "DIMM 288-pin",
            voltage: "1.35 V (AMD EXPO / Intel XMP 3.0)",
            casLatency: lower.includes("cl32") ? "CL32" : lower.includes("cl36") ? "CL36" : "CL30",
            trcdLatency: "36",
            trpLatency: "36",
            trasLatency: "76",
            eccSupport: "On-Die ECC",
            fullBufferedSupport: "Unbuffered",
          } : undefined,
          hdd: hwType === "DISCO_DURO" ? {
            type: "Disco Duro Interno Mecánico HDD 3.5\"",
            line: lower.includes("ironwolf") ? "IronWolf NAS" : lower.includes("barracuda") ? "Barracuda Compute" : lower.includes("black") ? "WD Black Performance" : "Barracuda Compute",
            capacity: lower.includes("4tb") ? "4 TB" : lower.includes("8tb") ? "8 TB" : lower.includes("1tb") ? "1 TB" : "2 TB",
            rpm: lower.includes("5400") ? "5400 RPM" : "7200 RPM",
            size: "3.5 pulgadas",
            bus: "SATA III (6.0 Gb/s)",
            buffer: "256 MB Multi-Tier Caching (MTC)",
          } : undefined,
          ssd: hwType === "SSD" ? {
            line: lower.includes("990") ? "990 PRO Heatsink" : lower.includes("kc3000") ? "KC3000" : lower.includes("sn850") ? "Black SN850X" : "High Performance Gaming NVMe",
            capacity: lower.includes("2tb") ? "2 TB" : lower.includes("4tb") ? "4 TB" : "1 TB",
            format: "M.2 2280",
            bus: lower.includes("gen5") || lower.includes("pcie 5") ? "PCIe 5.0 x4 NVMe 2.0" : "PCIe 4.0 x4 NVMe 2.0",
            hasDram: "Sí, DRAM Caché LPDDR4 dedicada",
            nandType: "3D TLC NAND Flash (176 capas)",
            controller: "Samsung Pascal / Phison PS5018-E18",
            sequentialRead: "Hasta 7.450 MB/s",
            sequentialWrite: "Hasta 6.900 MB/s",
          } : undefined,
          powerSupply: hwType === "FUENTE_DE_PODER" ? {
            power: lower.includes("1000") ? "1000 W" : lower.includes("750") ? "750 W" : lower.includes("650") ? "650 W" : "850 W",
            certification: lower.includes("platinum") ? "80 Plus Platinum" : "80 Plus Gold (Eficiencia >90%)",
            size: "ATX Estándar (150 x 140 x 86 mm)",
            activePfc: "Sí, PFC Activo (>0.99)",
            modular: "100% Modular (Full Modular)",
            current12v: "70.8 A en riel único de +12V (850W continuos)",
            current5v: "20 A",
            current3v: "20 A",
            powerConnectors: "1x 24-pin ATX, 2x 8-pin EPS (4+4), 1x 16-pin 12V-2x6 (PCIe 5.0 600W), 4x 8-pin PCIe (6+2), 8x SATA, 4x Molex",
          } : undefined,
          coolerCpu: hwType === "COOLER_CPU" ? {
            brand: lower.includes("noctua") ? "Noctua" : lower.includes("corsair") ? "Corsair" : lower.includes("deepcool") ? "DeepCool" : lower.includes("nzxt") ? "NZXT" : lower.includes("thermalright") ? "Thermalright" : "Fabricante Oficial",
            type: lower.includes("liquid") || lower.includes("aio") || lower.includes("liquida") || lower.includes("kraken") ? "Refrigeración Líquida Todo en Uno (AIO 360mm)" : "Disipador de Aire Doble Torre con ventiladores duales",
            weight: "1.280 gramos",
            rpm: "500 - 2.000 RPM (PWM)",
            noise: "18.5 - 29.8 dBA",
            airflow: "72.5 CFM (Presión 2.45 mm-H2O)",
            height: "155 mm",
            fanSize: "3x 120 mm (o 2x 120 mm FDB)",
            hasHeatpipes: "6x Heatpipes de cobre sinterizado de 6 mm con base niquelada pulida",
            compatibleSockets: "Intel LGA1700 / LGA1200 / LGA1851, AMD AM5 / AM4",
          } : undefined,
          cabinet: hwType === "GABINETE" ? {
            brand: lower.includes("corsair") ? "Corsair" : lower.includes("lian li") ? "Lian Li" : lower.includes("nzxt") ? "NZXT" : lower.includes("montech") ? "Montech" : "Fabricante Oficial",
            model: name,
            format: "Mid Tower ATX",
            sidePanel: "Cristal templado tintado de 4 mm",
            bays: "2x 3.5\" HDD + 4x 2.5\" SSD",
            expansionSlots: "7 horizontales + 2 verticales",
            maxGpuLength: "Hasta 380 mm",
            maxCoolerHeight: "Hasta 170 mm",
            radiatorSupport: "Frontal hasta 360 mm, Superior hasta 360 mm, Trasero 120 mm",
            frontConnectors: "1x USB 3.2 Gen 2 Type-C, 2x USB 3.2 Gen 1 Type-A, 1x Combo Audio/Mic 3.5mm",
          } : undefined,
          fan: hwType === "VENTILADORES" ? {
            brand: lower.includes("corsair") ? "Corsair" : lower.includes("lian li") ? "Lian Li" : lower.includes("noctua") ? "Noctua" : lower.includes("arctic") ? "Arctic" : "Fabricante Oficial",
            size: lower.includes("140") ? "140 x 140 x 25 mm" : "120 x 120 x 25 mm",
            rpm: "500 - 1.850 RPM (PWM)",
            airflow: "65.5 CFM",
            noiseLevel: "16.0 - 27.5 dBA",
            connectorPins: "4-pin PWM + 3-pin 5V ARGB",
            lighting: "ARGB direccionable individualmente (Aura Sync, Mystic Light, RGB Fusion)",
            staticPressure: "2.5 mm-H2O",
            bearing: "Fluid Dynamic Bearing (FDB) de larga vida útil",
          } : undefined,
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

    const geminiApiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim();
    let lastErrorText = "";

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
NO cambies la categoría a VIDEO_GAME si es un accesorio como un control, volante o headset; si es "Accesorio Gaming" o "OTHER", genera el SKU con prefijo ACC- y redacta una descripción técnica/comercial enfocada en ergonomía, botones, latencia y compatibilidad.
Si es Hardware ("HARDWARE" o "Hardware & Componentes"), genera el SKU con prefijo HW- y DEBES llenar OBLIGATORIAMENTE tanto las Especificaciones Básicas como las Avanzadas del componente correspondiente.`
          : `Clasifica inteligentemente el producto entre "FIGURE", "VIDEO_GAME", "COLLECTIBLE" u "OTHER".`;

        const hardwareInstructions = `
REGLA CRÍTICA PARA HARDWARE & COMPONENTES:
Si el producto es un componente de hardware de PC (o si la categoría es HARDWARE o Hardware & Componentes):
1. Detecta en "hardwareType" cuál de los 10 tipos es: "TARJETA_DE_VIDEO" | "PROCESADORES" | "PLACA_MADRE" | "RAM" | "DISCO_DURO" | "SSD" | "GABINETE" | "FUENTE_DE_PODER" | "COOLER_CPU" | "VENTILADORES".
2. DEBES LLENAR TODOS Y CADA UNO DE LOS CAMPOS (Básicos y Avanzados) del objeto técnico que corresponda ("gpu", "cpu", "motherboard", "ram", "hdd", "ssd", "powerSupply", "coolerCpu", "cabinet", o "fan"). NO los dejes vacíos ni con cadenas genéricas.
   - Si es "TARJETA_DE_VIDEO": completa "gpu" con Fabricante (ej. MSI, ASUS, Gigabyte), GPU (modelo exacto), Memoria (revisa el nombre, ej. si dice 16G pon 16 GB GDDR7 o GDDR6X), Bus (ej. 256-bit o 192-bit), Frecuencias core (ej. Base: 2160 MHz / Boost: 2550 MHz), Frecuencia memorias (ej. 28 Gbps o 21 Gbps), Núcleo (ej. GB203, AD104, GB205), Perfil (ej. Estándar ATX), Refrigeración (ej. Sistema Tri Frozr 3 con ventiladores TORX Fan 5.0), Slots (ej. 2.5 slots), Largo (ej. 307 mm), Iluminación (ej. ARGB Mystic Light / Aura Sync), ¿Backplate? (ej. Sí, metálico reforzado Flow-Through), Conectores de poder (ej. 1x 16-pin 12V-2x6 o 2x 8-pin), Puertos de video (ej. 3x DisplayPort 2.1 / 1.4a, 1x HDMI 2.1a).
   - Si es "PROCESADORES": completa "cpu" con Frecuencia base (ej. 4.2 GHz), Frecuencia turbo (ej. 5.0 GHz Turbo), Núcleos / hilos (ej. 8 Núcleos / 16 Hilos), Caché (ej. 96 MB L3 3D V-Cache o 32 MB L3), Socket exacto (ej. AM5 para Ryzen 7000/8000/9000, LGA1700 para Intel 13/14va), Núcleo/arquitectura (ej. Zen 4, Zen 5, Raptor Lake Refresh), Proceso de manufactura (ej. 4 nm TSMC), TDP (ej. 120 W o 105 W o 65 W), Cooler (ej. No incluido), Gráficos integrados (ej. AMD Radeon Graphics 2 CUs o Intel UHD 770 o No posee).
   - Si es "PLACA_MADRE": completa "motherboard" asegurando coherencia ABSOLUTA entre Socket y Chipset (ej. si es AMD B650/X670/X870 el socket es AM5; si es Intel B760/Z790 el socket es LGA1700; NUNCA mezcles socket Intel con chipset AMD ni viceversa), Slots memorias (4x DDR5 DIMM), Canales (Dual Channel), Formato (ATX o Micro-ATX), Soporte RGB (ej. 3x 3-pin ARGB Gen 2 + 1x 4-pin RGB), Puertos de video (1x HDMI 2.1, 1x DisplayPort 1.4), Puertos de energía (1x 24-pin ATX, 2x 8-pin EPS 12V), Soporte SLI, Soporte CrossFire, Soporte RAID, Conectores internos, Puertos traseros, Expansiones PCIe.
   - Si es "RAM", "DISCO_DURO", "SSD", "FUENTE_DE_PODER", "COOLER_CPU", "GABINETE" o "VENTILADORES": completa todos sus atributos básicos y avanzados con valores técnicos coherentes.
`;

        const prompt = `Eres un experto catalogador de productos de colección y e-commerce de videojuegos, figuras de anime y componentes de hardware en Chile llamado OmniCollector.
Genera la ficha técnica completa en formato JSON para el siguiente producto: "${productName}".

${categoryConstraint}
${hardwareInstructions}

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin bloques de código tipo \`\`\`json) con esta estructura exacta:
{
  "sku": "Ej: FIG-MAKIMA-17 o VG-CYBERP-2077 o ACC-DUALS-001 o HW-RTX5070-01",
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
    "gameType": "CONSOLE" | "PC",
    "title": "Nombre oficial del juego",
    "developer": "Estudio desarrollador",
    "publisher": "Distribuidor o publisher",
    "releaseYear": "Año de lanzamiento ej. 2025",
    "genre": "Género del juego",
    "gameModes": "Modos de juego",
    "gameEngine": "Motor gráfico ej. Unreal Engine 5",
    "supportedPlatforms": "Plataformas compatibles",
    "platform": "PS5" | "NINTENDO_SWITCH" | "XBOX_SERIES" | "PC",
    "edition": "STANDARD" | "DELUXE" | "COLLECTORS",
    "audioLanguages": "Idiomas de audio",
    "subtitleLanguages": "Idiomas de subtítulos",
    "ageRating": "Clasificación ej. ESRB Teen (13+)",
    "fileSize": "Espacio en disco ej. 65 GB SSD",
    "displayModes": "Modos gráficos consola ej. Calidad 4K 30fps / Rendimiento 60fps",
    "xboxSeriesSOptimization": "Optimización Series S ej. 1080p 60fps dinámico",
    "hardwareFeatures": "Funciones DualSense / Audio 3D / SSD",
    "pcOs": "Windows 11 / Windows 10 64-bit",
    "pcProcessor": "Intel Core i7 / AMD Ryzen 7",
    "pcRam": "16 GB RAM (32 GB recomendado)",
    "pcGpu": "NVIDIA GeForce RTX 4070 / AMD Radeon RX 7800 XT",
    "pcStorage": "85 GB SSD NVMe"
  },
  "collectibleSpecs": {
    "category": "TCG" | "MEMORABILIA" | "COMIC",
    "condition": "GEM_MINT_10" | "MINT_9" | "NEAR_MINT_8",
    "authBody": "PSA" | "CGC" | "BGS",
    "language": "Japonés" | "Inglés",
    "serial": "Código serial de certificación"
  },
  "customSpecifications": {
    "categoryType": "GAMING_ACCESSORY" | "CONSOLE" | "HARDWARE" | "APPAREL" | "BOOK" | "MERCH" | "AUDIO",
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
    "hardware": {
      "hardwareType": "TARJETA_DE_VIDEO" | "PROCESADORES" | "PLACA_MADRE" | "RAM" | "DISCO_DURO" | "SSD" | "GABINETE" | "FUENTE_DE_PODER" | "COOLER_CPU" | "VENTILADORES",
      "componentType": "",
      "brand": "",
      "model": "",
      "interfaceOrSocket": "",
      "capacityOrSpeed": "",
      "formFactor": "",
      "powerConsumptionTdp": "",
      "warrantyYears": "",
      "featuredHighlights": "",
      "gpu": { "manufacturer": "", "gpu": "", "memory": "", "bus": "", "coreFrequencies": "", "memoryFrequency": "", "core": "", "profile": "", "cooling": "", "slots": "", "length": "", "lighting": "", "backplate": "", "powerConnectors": "", "videoPorts": "" },
      "cpu": { "frequency": "", "turboFrequency": "", "coresThreads": "", "cache": "", "socket": "", "core": "", "manufacturingProcess": "", "tdp": "", "cooler": "", "integratedGraphics": "" },
      "motherboard": { "manufacturer": "", "socket": "", "chipset": "", "memorySlots": "", "memoryChannels": "", "format": "", "rgbSupport": "", "videoPorts": "", "powerPorts": "", "sliSupport": "", "crossfireSupport": "", "raidSupport": "", "connectors": "", "ports": "", "expansions": "" },
      "ram": { "capacity": "", "type": "", "speed": "", "format": "", "voltage": "", "casLatency": "", "trcdLatency": "", "trpLatency": "", "trasLatency": "", "eccSupport": "", "fullBufferedSupport": "" },
      "hdd": { "type": "", "line": "", "capacity": "", "rpm": "", "size": "", "bus": "", "buffer": "" },
      "ssd": { "line": "", "capacity": "", "format": "", "bus": "", "hasDram": "", "nandType": "", "controller": "", "sequentialRead": "", "sequentialWrite": "" },
      "powerSupply": { "power": "", "certification": "", "size": "", "activePfc": "", "modular": "", "current12v": "", "current5v": "", "current3v": "", "powerConnectors": "" },
      "coolerCpu": { "brand": "", "type": "", "weight": "", "rpm": "", "noise": "", "airflow": "", "height": "", "fanSize": "", "hasHeatpipes": "", "compatibleSockets": "" },
      "cabinet": { "brand": "", "model": "", "format": "", "sidePanel": "", "bays": "", "expansionSlots": "", "maxGpuLength": "", "maxCoolerHeight": "", "radiatorSupport": "", "frontConnectors": "" },
      "fan": { "brand": "", "size": "", "rpm": "", "airflow": "", "noiseLevel": "", "connectorPins": "", "lighting": "", "staticPressure": "", "bearing": "" }
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

        const candidateModels = [
          "gemini-flash-lite-latest",
          "gemini-3.5-flash-lite",
          "gemini-3.6-flash",
          "gemini-flash-latest",
          "gemini-3-flash-preview",
        ];
        let geminiRes: Response | null = null;

        for (const model of candidateModels) {
          try {
            // Use header authentication (required for Google AI Studio API keys)
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-goog-api-key": geminiApiKey,
                },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                  },
                }),
              }
            );
            if (res.ok) {
              geminiRes = res;
              break;
            } else {
              lastErrorText = await res.text();
              console.warn(`[Auto-Fill API] Model ${model} returned ${res.status}:`, lastErrorText);
              if (res.status !== 404 && res.status !== 503 && res.status !== 429) {
                break;
              }
            }
          } catch (e: any) {
            lastErrorText = e.message || String(e);
            break;
          }
        }

        if (geminiRes && geminiRes.ok) {
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

            // Always guarantee full customSpecifications if OTHER or HARDWARE
            if (parsed.type === "OTHER" || parsed.type === "HARDWARE" || (parsed.customCategoryLabel && parsed.customCategoryLabel.toLowerCase().includes("hardware"))) {
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
              } else if (catType === "HARDWARE") {
                const incomingHw = parsed.customSpecifications.hardware || {};
                const fallbackHw = fallbackSpecs.hardware || {};
                const hwType = incomingHw.hardwareType || fallbackHw.hardwareType || "TARJETA_DE_VIDEO";

                parsed.customSpecifications.hardware = {
                  ...mergeNonEmpty(fallbackHw, incomingHw),
                  hardwareType: hwType,
                  gpu: hwType === "TARJETA_DE_VIDEO" ? mergeNonEmpty(fallbackHw.gpu || {}, incomingHw.gpu || {}) : undefined,
                  cpu: hwType === "PROCESADORES" ? mergeNonEmpty(fallbackHw.cpu || {}, incomingHw.cpu || {}) : undefined,
                  motherboard: hwType === "PLACA_MADRE" ? mergeNonEmpty(fallbackHw.motherboard || {}, incomingHw.motherboard || {}) : undefined,
                  ram: hwType === "RAM" ? mergeNonEmpty(fallbackHw.ram || {}, incomingHw.ram || {}) : undefined,
                  hdd: hwType === "DISCO_DURO" ? mergeNonEmpty(fallbackHw.hdd || {}, incomingHw.hdd || {}) : undefined,
                  ssd: hwType === "SSD" ? mergeNonEmpty(fallbackHw.ssd || {}, incomingHw.ssd || {}) : undefined,
                  powerSupply: hwType === "FUENTE_DE_PODER" ? mergeNonEmpty(fallbackHw.powerSupply || {}, incomingHw.powerSupply || {}) : undefined,
                  coolerCpu: hwType === "COOLER_CPU" ? mergeNonEmpty(fallbackHw.coolerCpu || {}, incomingHw.coolerCpu || {}) : undefined,
                  cabinet: hwType === "GABINETE" ? mergeNonEmpty(fallbackHw.cabinet || {}, incomingHw.cabinet || {}) : undefined,
                  fan: hwType === "VENTILADORES" ? mergeNonEmpty(fallbackHw.fan || {}, incomingHw.fan || {}) : undefined,
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

            if (parsed.type === "VIDEO_GAME") {
              const fallbackHeuristic = generateWithSmartEngine(productName, "VIDEO_GAME");
              parsed.gameSpecs = mergeNonEmpty(fallbackHeuristic.gameSpecs || {}, parsed.gameSpecs || {});
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
        }
      } catch (geminiErr: any) {
        console.warn("[Auto-Fill API] Gemini API call failed, using fallback engine:", geminiErr);
      }
    }

    let geminiErrorDetail: string | null = null;
    if (!geminiApiKey) {
      geminiErrorDetail = "Variable GEMINI_API_KEY no detectada en este entorno (ejecuta Redeploy en Vercel o agrégala a .env.local)";
    } else if (lastErrorText) {
      try {
        const p = JSON.parse(lastErrorText);
        geminiErrorDetail = p?.error?.message || lastErrorText.slice(0, 100);
      } catch {
        geminiErrorDetail = lastErrorText.slice(0, 100);
      }
    }

    // Fallback to Smart Heuristic Collector Engine (with admin selected category priority)
    const fallbackResult = generateWithSmartEngine(productName, selectedType, customCategoryLabel);
    return NextResponse.json({
      success: true,
      data: {
        ...fallbackResult,
        geminiErrorDetail,
      },
    });
  } catch (error: any) {
    console.error("[Auto-Fill API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error al procesar la solicitud de autocompletado." },
      { status: 500 }
    );
  }
}
