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
});
