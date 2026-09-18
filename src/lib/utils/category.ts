import type { ProductDomainEntity } from "@/lib/types/domain";

export interface ProductCategoryInfo {
  key: string;
  label: string;
  href: string;
  defaultTags: string[];
  formatLabel: string;
  brand: string;
  bracketTag: string;
}

/**
 * Resolves the canonical category information, breadcrumbs hierarchy, and display tags
 * for a given product, preventing false-positive classification (e.g. video games or accessories
 * being misclassified as consoles due to platform mentions like PS5, Xbox or Switch in their title).
 *
 * @param product - The product entity or partial product object
 * @returns Canonical ProductCategoryInfo for breadcrumbs, metadata, and badges
 */
export function getProductCategoryInfo(
  product: Partial<ProductDomainEntity> | null | undefined
): ProductCategoryInfo {
  if (!product) {
    return {
      key: "ALL",
      label: "Catálogo",
      href: "/catalog",
      defaultTags: ["Coleccionable", "Oficial"],
      formatLabel: "Producto Oficial",
      brand: "Fabricante Oficial",
      bracketTag: "Producto Oficial",
    };
  }

  const type = (product.type || "").toUpperCase();
  const specCat = (product.customSpecifications?.categoryType || "").toUpperCase();
  const catLabel = (product.customCategoryLabel || "").toLowerCase();
  const sku = (product.sku || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // 1. CANONICAL: VIDEO_GAME
  // Check canonical type, sku, or game keywords first
  if (
    type === "VIDEO_GAME" ||
    specCat === "VIDEO_GAME" ||
    sku.startsWith("vg-") ||
    catLabel === "videojuegos" ||
    catLabel === "videojuego" ||
    catLabel === "juegos" ||
    catLabel === "juego" ||
    name.includes("[juego") ||
    name.includes("juego ps") ||
    name.includes("juego xbox") ||
    name.includes("juego switch") ||
    name.includes("edicion especial juego")
  ) {
    const isPc =
      product.gameMetadata?.gameType === "PC" ||
      product.gameMetadata?.platform === "PC";
    const tagPlatform = isPc
      ? "PC Gaming"
      : product.gameMetadata?.platform?.replace(/_/g, " ") ||
        (name.includes("ps5")
          ? "PS5"
          : name.includes("ps4")
          ? "PS4"
          : name.includes("switch")
          ? "Nintendo Switch"
          : name.includes("xbox")
          ? "Xbox"
          : "Consola");

    return {
      key: "VIDEO_GAME",
      label: "Videojuegos",
      href: "/catalog?category=VIDEO_GAME",
      defaultTags: isPc
        ? ["PC Gaming", "Steam", "Videojuegos"]
        : ["Consola", tagPlatform, "Videojuegos"],
      formatLabel: product.gameMetadata?.isDigital
        ? "Digital (Código Oficial)"
        : "Físico (Disco / Cartucho Sellado)",
      brand:
        product.gameMetadata?.developer ||
        product.gameMetadata?.publisher ||
        "Publisher Oficial",
      bracketTag: isPc ? "Juego PC" : `Juego ${tagPlatform}`,
    };
  }

  // 2. CANONICAL: FIGURE
  if (
    type === "FIGURE" ||
    specCat === "FIGURE" ||
    sku.startsWith("fig-") ||
    catLabel === "figuras" ||
    catLabel === "figura" ||
    catLabel.includes("figura") ||
    name.includes("figura") ||
    name.includes("nendoroid") ||
    name.includes("scale figure") ||
    name.includes("pop up parade")
  ) {
    return {
      key: "FIGURE",
      label: "Figuras",
      href: "/catalog?category=FIGURE",
      defaultTags: ["Colección", "Anime", "Escala"],
      formatLabel: `Figura Coleccionable ${
        product.figureMetadata?.scale?.replace("SCALE_", "Escala ") || "1/7"
      }`,
      brand:
        product.figureMetadata?.manufacturer?.replace(/_/g, " ") ||
        "Fabricante Oficial",
      bracketTag: `Figura ${
        product.figureMetadata?.scale?.replace("SCALE_", "1/") || "1/7"
      }`,
    };
  }

  // 3. CANONICAL: COLLECTIBLE / TCG
  if (
    type === "COLLECTIBLE" ||
    specCat === "COLLECTIBLE" ||
    sku.startsWith("tcg-") ||
    sku.startsWith("col-") ||
    catLabel.includes("tcg") ||
    catLabel.includes("carta") ||
    catLabel.includes("rarezas") ||
    catLabel.includes("booster")
  ) {
    const certOrg = product.collectibleMetadata?.authenticationBody || "PSA";
    return {
      key: "COLLECTIBLE",
      label: "TCG & Rarezas",
      href: "/catalog?category=COLLECTIBLE",
      defaultTags: ["TCG", "Graduada", "Coleccionable"],
      formatLabel: `Carta Certificada ${certOrg}`,
      brand: certOrg || "Certificación Oficial",
      bracketTag: `Carta ${certOrg}`,
    };
  }

  // 4. CANONICAL: BUNDLE
  if (
    type === "BUNDLE" ||
    specCat === "BUNDLE" ||
    sku.startsWith("bun-") ||
    catLabel.includes("bundle") ||
    catLabel.includes("pack")
  ) {
    return {
      key: "BUNDLE",
      label: "Bundles",
      href: "/catalog?category=BUNDLE",
      defaultTags: ["Bundle", "Pack Especial", "Ahorro"],
      formatLabel: "Bundle Especial Compuesto",
      brand: "OmniCollector",
      bracketTag: "Bundle Especial",
    };
  }

  // 5. CANONICAL: GAMING_ACCESSORY
  // Must check accessories before consoles so that "Mando PS5" or "Funda Switch" isn't misclassified as a console
  const isAccessory =
    type === "GAMING_ACCESSORY" ||
    type === "ACCESSORY" ||
    specCat === "GAMING_ACCESSORY" ||
    sku.startsWith("acc-") ||
    catLabel.includes("accesorio") ||
    catLabel.includes("periferico") ||
    name.includes("mouse") ||
    name.includes("teclado") ||
    name.includes("audifono") ||
    name.includes("headset") ||
    name.includes("mando") ||
    name.includes("joystick") ||
    name.includes("control");

  if (isAccessory) {
    const accType =
      product.customSpecifications?.gamingAccessory?.accessoryType;
    const accTypeName =
      accType === "MOUSE"
        ? "Mouse Gamer"
        : accType === "KEYBOARD"
        ? "Teclado Mecánico"
        : accType === "HEADSET"
        ? "Audífonos Gamer"
        : accType === "CONTROLLER"
        ? "Mando / Control"
        : name.includes("headset") || name.includes("audifono")
        ? "Audífonos Gamer"
        : name.includes("mouse") || name.includes("raton")
        ? "Mouse Gamer"
        : name.includes("teclado") || name.includes("keyboard")
        ? "Teclado Gamer"
        : "Accesorio Gamer";

    const brand =
      product.customSpecifications?.gamingAccessory?.mouse?.brand ||
      product.customSpecifications?.gamingAccessory?.keyboard?.brand ||
      product.customSpecifications?.gamingAccessory?.controller?.brand ||
      (name.includes("razer")
        ? "Razer"
        : name.includes("logitech")
        ? "Logitech G"
        : name.includes("hyperx")
        ? "HyperX"
        : name.includes("corsair")
        ? "Corsair"
        : name.includes("steelseries")
        ? "SteelSeries"
        : name.includes("redragon")
        ? "Redragon"
        : "Fabricante Oficial");

    return {
      key: "GAMING_ACCESSORY",
      label: "Accesorios",
      href: "/catalog?category=GAMING_ACCESSORY",
      defaultTags: [accTypeName, brand, "Periféricos"],
      formatLabel: product.customCategoryLabel || "Accesorio Gaming Oficial",
      brand,
      bracketTag: accTypeName,
    };
  }

  // 6. CANONICAL: HARDWARE
  const isHardware =
    type === "HARDWARE" ||
    specCat === "HARDWARE" ||
    sku.startsWith("hw-") ||
    catLabel.includes("hardware") ||
    catLabel.includes("componente") ||
    catLabel.includes("tarjeta de video") ||
    catLabel.includes("procesador") ||
    catLabel.includes("placa madre") ||
    catLabel.includes("fuente de poder") ||
    catLabel.includes("memoria ram") ||
    catLabel.includes("gabinete");

  if (isHardware) {
    const hwType = product.customSpecifications?.hardware?.hardwareType;
    const hwTypeName =
      hwType === "TARJETA_DE_VIDEO"
        ? "Tarjeta Gráfica"
        : hwType === "PROCESADORES"
        ? "Procesador"
        : hwType === "PLACA_MADRE"
        ? "Placa Madre"
        : hwType === "RAM"
        ? "Memoria RAM"
        : hwType === "SSD"
        ? "Almacenamiento SSD"
        : hwType === "DISCO_DURO"
        ? "Disco Duro"
        : hwType === "FUENTE_DE_PODER"
        ? "Fuente de Poder"
        : hwType === "COOLER_CPU"
        ? "Cooler CPU"
        : hwType === "GABINETE"
        ? "Gabinete"
        : hwType === "VENTILADORES"
        ? "Ventilador"
        : product.customSpecifications?.hardware?.componentType ||
          "Componente Hardware";

    const brand =
      product.customSpecifications?.hardware?.brand ||
      product.customSpecifications?.hardware?.gpu?.manufacturer ||
      product.customSpecifications?.hardware?.motherboard?.manufacturer ||
      (name.includes("msi")
        ? "MSI"
        : name.includes("asus")
        ? "ASUS"
        : name.includes("gigabyte")
        ? "Gigabyte"
        : name.includes("corsair")
        ? "Corsair"
        : name.includes("kingston")
        ? "Kingston"
        : name.includes("samsung")
        ? "Samsung"
        : name.includes("nvidia")
        ? "NVIDIA"
        : name.includes("amd")
        ? "AMD"
        : "Fabricante Oficial");

    return {
      key: "HARDWARE",
      label: "Hardware",
      href: "/catalog?category=HARDWARE",
      defaultTags: [hwTypeName, brand, "Hardware PC"],
      formatLabel:
        product.customSpecifications?.hardware?.componentType ||
        "Componente Hardware Oficial",
      brand,
      bracketTag: hwTypeName,
    };
  }

  // 7. CANONICAL: CONSOLE
  // NOTE: Strict check. Must be an actual console hardware, not a game or accessory!
  const isConsole =
    type === "CONSOLE" ||
    specCat === "CONSOLE" ||
    sku.startsWith("con-") ||
    catLabel === "consolas" ||
    catLabel === "consola" ||
    (catLabel.includes("consola") &&
      !catLabel.includes("accesorio") &&
      !catLabel.includes("juego")) ||
    (name.includes("consola") &&
      !name.includes("juego") &&
      !name.includes("accesorio") &&
      !name.includes("mando") &&
      !name.includes("funda"));

  if (isConsole) {
    const brand =
      name.includes("sony") ||
      name.includes("playstation") ||
      name.includes("ps5") ||
      name.includes("ps4")
        ? "Sony PlayStation"
        : name.includes("nintendo") || name.includes("switch")
        ? "Nintendo"
        : name.includes("xbox") || name.includes("microsoft")
        ? "Microsoft Xbox"
        : "Fabricante Oficial";

    return {
      key: "CONSOLE",
      label: "Consolas",
      href: "/catalog?category=CONSOLE",
      defaultTags: ["Consolas", "Gaming", "Sistemas"],
      formatLabel:
        product.customSpecifications?.console?.format || "Consola Oficial Sellada",
      brand,
      bracketTag: "Consola Oficial",
    };
  }

  // 8. APPAREL
  const isApparel =
    specCat === "APPAREL" ||
    catLabel.includes("ropa") ||
    catLabel.includes("estilo") ||
    catLabel.includes("poleron") ||
    catLabel.includes("polera") ||
    catLabel.includes("hoodie");

  if (isApparel) {
    return {
      key: "APPAREL",
      label: "Ropa & Estilo",
      href: "/catalog?category=APPAREL",
      defaultTags: ["Moda Gamer", "Ropa Urbana", "Streetwear"],
      formatLabel: "Indumentaria Oficial Sellada",
      brand:
        product.customSpecifications?.apparel?.license || "OmniCollector Estilo",
      bracketTag: "Ropa & Estilo",
    };
  }

  // 9. BOOK
  const isBook =
    specCat === "BOOK" ||
    catLabel.includes("manga") ||
    catLabel.includes("artbook") ||
    catLabel.includes("libro") ||
    catLabel.includes("comic") ||
    catLabel.includes("tomo");

  if (isBook) {
    return {
      key: "BOOK",
      label: "Manga & Artbooks",
      href: "/catalog?category=BOOK",
      defaultTags: ["Manga", "Artbook", "Lectura"],
      formatLabel:
        product.customSpecifications?.book?.binding ||
        "Tomo Manga / Libro Oficial",
      brand:
        product.customSpecifications?.book?.publisher || "Editorial Oficial",
      bracketTag: "Manga / Artbook",
    };
  }

  // 10. MERCH
  const isMerch =
    specCat === "MERCH" ||
    catLabel.includes("merch") ||
    catLabel.includes("peluche") ||
    catLabel.includes("llavero") ||
    catLabel.includes("taza") ||
    catLabel.includes("decoraci");

  if (isMerch) {
    return {
      key: "MERCH",
      label: "Merchandising",
      href: "/catalog?category=MERCH",
      defaultTags: ["Merchandising", "Coleccionables", "Oficial"],
      formatLabel: "Artículo Coleccionable Oficial",
      brand: product.customSpecifications?.merch?.franchise || "Licencia Oficial",
      bracketTag: "Merchandising",
    };
  }

  // 11. AUDIO
  const isAudio =
    specCat === "AUDIO" ||
    catLabel.includes("audio") ||
    catLabel.includes("ost") ||
    catLabel.includes("soundtrack") ||
    catLabel.includes("vinilo");

  if (isAudio) {
    return {
      key: "AUDIO",
      label: "Audio / OST",
      href: "/catalog?category=AUDIO",
      defaultTags: ["Audio", "Banda Sonora", "Vinilo / CD"],
      formatLabel: "Álbum / Edición Musical Oficial",
      brand:
        product.customSpecifications?.audio?.recordLabel || "Sello Musical Oficial",
      bracketTag: "Audio / OST",
    };
  }

  return {
    key: "ALL",
    label: "Catálogo",
    href: "/catalog",
    defaultTags: ["Coleccionable", "Oficial"],
    formatLabel: product.customCategoryLabel || "Producto Oficial",
    brand: "Fabricante Oficial",
    bracketTag: product.customCategoryLabel || "Producto Oficial",
  };
}
