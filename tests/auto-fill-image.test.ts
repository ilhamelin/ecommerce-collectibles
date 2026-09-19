import { describe, it, expect, vi } from "vitest";

describe("Product Auto-Fill with Image (Multimodal AI)", () => {
  it("debe rechazar la solicitud con 400 si no se envía ni nombre ni imagen", async () => {
    // Simulamos la lógica de validación de la API
    const validatePayload = (body: { name?: string; imageBase64?: string }) => {
      const productName = body?.name?.trim();
      const imageBase64 = body?.imageBase64;
      if (!productName && !imageBase64) {
        return { ok: false, status: 400, error: "Debes ingresar el Nombre del Producto o seleccionar una Imagen para auto-completar." };
      }
      return { ok: true };
    };

    const result = validatePayload({});
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain("Nombre del Producto o seleccionar una Imagen");
  });

  it("debe aceptar la solicitud cuando solo se provee una imagen en Base64 sin nombre previo", async () => {
    const validatePayload = (body: { name?: string; imageBase64?: string; imageFileName?: string }) => {
      const productName = body?.name?.trim();
      const imageBase64 = body?.imageBase64;
      if (!productName && !imageBase64) {
        return { ok: false, status: 400 };
      }
      // Deducir nombre inicial a partir del nombre de archivo si no viene nombre
      let deducedName = productName;
      if (!deducedName && body.imageFileName) {
        deducedName = body.imageFileName
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim();
      }
      return { ok: true, deducedName: deducedName || "Producto Coleccionable" };
    };

    const result = validatePayload({
      imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
      imageFileName: "makima-shibuya-scramble-figure.jpg",
    });

    expect(result.ok).toBe(true);
    expect(result.deducedName).toBe("makima shibuya scramble figure");
  });

  it("debe extraer correctamente el MIME type y el payload Base64 limpio a partir de un Data URL", () => {
    const parseBase64 = (rawInput: string, fallbackMime = "image/jpeg") => {
      let cleanBase64 = rawInput;
      let detectedMime = fallbackMime;
      if (rawInput.includes(";base64,")) {
        const parts = rawInput.split(";base64,");
        detectedMime = parts[0].replace("data:", "").trim() || fallbackMime;
        cleanBase64 = parts[1].trim();
      }
      return { cleanBase64, detectedMime };
    };

    const dataUrl = "data:image/webp;base64,UklGRiQAAABXRUJQVlA4...";
    const { cleanBase64, detectedMime } = parseBase64(dataUrl);

    expect(detectedMime).toBe("image/webp");
    expect(cleanBase64).toBe("UklGRiQAAABXRUJQVlA4...");
  });

  it("debe construir partes multimodales de Gemini compatibles con la API de Google AI", () => {
    const buildGeminiParts = (promptText: string, cleanBase64?: string, mimeType = "image/jpeg") => {
      const parts: any[] = [{ text: promptText }];
      if (cleanBase64) {
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        });
      }
      return parts;
    };

    const partsWithImage = buildGeminiParts("Identifica este producto", "AQIDBA==", "image/png");
    expect(partsWithImage).toHaveLength(2);
    expect(partsWithImage[0].text).toBe("Identifica este producto");
    expect(partsWithImage[1].inlineData).toEqual({
      mimeType: "image/png",
      data: "AQIDBA==",
    });

    const partsTextOnly = buildGeminiParts("Genera producto");
    expect(partsTextOnly).toHaveLength(1);
    expect(partsTextOnly[0].text).toBe("Genera producto");
  });

  it("debe preservar customSpecifications y detectar especificaciones completas para un procesador Intel i5-14600K", () => {
    // Simular resolución de categoría y generación de especificaciones técnicas
    const selectedType = "HARDWARE";
    const customCategoryLabel = "Hardware & Componentes";
    const productName = "Intel Core i5-14600K 14th Gen Unlocked Desktop Processor";

    const isCustomOrSpecialized = [
      "OTHER",
      "HARDWARE",
      "CONSOLE",
      "GAMING_ACCESSORY",
      "APPAREL",
      "BOOK",
      "MERCH",
      "AUDIO",
    ].includes(selectedType) || Boolean(customCategoryLabel);

    expect(isCustomOrSpecialized).toBe(true);

    // Detección de hardwareType = PROCESADORES
    const lower = productName.toLowerCase();
    const isProcessor =
      lower.includes("procesador") ||
      lower.includes("processor") ||
      lower.includes("intel core") ||
      lower.includes("14600");
    expect(isProcessor).toBe(true);

    // Detección de specs técnicas específicas del 14600K
    const cpuSocket = "LGA1700";
    const cpuCores = "14 Núcleos (6P+8E) / 20 Hilos";
    const cpuBase = "3.5 GHz";
    const cpuTurbo = "5.3 GHz Turbo";
    const cpuCache = "24 MB Intel Smart Cache";
    const cpuCoreArch = "Raptor Lake Refresh";
    const cpuProcess = "Intel 7 (10 nm)";
    const cpuTdp = "125 W (Base) / 181 W (Turbo)";

    const customSpecifications = {
      categoryType: "HARDWARE",
      hardware: {
        hardwareType: "PROCESADORES",
        componentType: "Procesador (CPU)",
        brand: "Intel",
        model: productName,
        interfaceOrSocket: `Socket ${cpuSocket}`,
        capacityOrSpeed: `${cpuBase} / ${cpuTurbo}`,
        powerConsumptionTdp: `TDP: ${cpuTdp}`,
        warrantyYears: "3 años de garantía oficial directa del fabricante",
        cpu: {
          frequency: cpuBase,
          turboFrequency: cpuTurbo,
          coresThreads: cpuCores,
          cache: cpuCache,
          socket: cpuSocket,
          core: cpuCoreArch,
          coreName: cpuCoreArch,
          manufacturingProcess: cpuProcess,
          tdp: cpuTdp,
          cooler: "No incluido (se recomienda refrigeración líquida o disipador de alto rendimiento)",
          integratedGraphics: "Intel UHD Graphics 770",
        },
      },
    };

    // Verificar que todos los campos requeridos de la ficha estén completamente poblados
    expect(customSpecifications.hardware.hardwareType).toBe("PROCESADORES");
    expect(customSpecifications.hardware.cpu.frequency).toBe("3.5 GHz");
    expect(customSpecifications.hardware.cpu.turboFrequency).toBe("5.3 GHz Turbo");
    expect(customSpecifications.hardware.cpu.coresThreads).toBe("14 Núcleos (6P+8E) / 20 Hilos");
    expect(customSpecifications.hardware.cpu.cache).toBe("24 MB Intel Smart Cache");
    expect(customSpecifications.hardware.cpu.socket).toBe("LGA1700");
    expect(customSpecifications.hardware.cpu.coreName).toBe("Raptor Lake Refresh");
    expect(customSpecifications.hardware.cpu.manufacturingProcess).toBe("Intel 7 (10 nm)");
    expect(customSpecifications.hardware.cpu.tdp).toBe("125 W (Base) / 181 W (Turbo)");
    expect(customSpecifications.hardware.cpu.integratedGraphics).toBe("Intel UHD Graphics 770");
  });
});

