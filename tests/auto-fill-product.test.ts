import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/admin/auto-fill-product/route";

describe("AI & Smart Knowledge Engine Auto-Fill Product Test Suite", () => {
  it("should reject requests without product name and without image", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("Debes ingresar el Nombre del Producto o seleccionar una Imagen");
  });

  it("should accurately classify and auto-fill a Video Game product with complete gameSpecs", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Final Fantasy VII Rebirth Deluxe Edition PS5",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    const data = json.data;

    expect(data.type).toBe("VIDEO_GAME");
    expect(data.sku).toMatch(/^(VG-|PROD-)/);
    expect(data.name).toContain("Final Fantasy VII");
    expect(typeof data.price).toBe("number");
    expect(data.price).toBeGreaterThan(10000); // CLP currency
    expect(data.description).toBeTruthy();
    expect(data.gameSpecs).toBeDefined();
    expect(data.gameSpecs.platform).toBe("PS5");
  });

  it("should accurately classify and auto-fill a Collectible / TCG card with collectibleSpecs", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Charizard Base Set 1st Edition Shadowless Holo PSA 10",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    const data = json.data;

    expect(data.type).toBe("COLLECTIBLE");
    expect(data.sku).toMatch(/^(TCG-|COL-|PROD-)/);
    expect(data.collectibleSpecs).toBeDefined();
    expect(data.collectibleSpecs.condition).toBe("GEM_MINT_10");
    expect(data.collectibleSpecs.authBody).toBe("PSA");
  });

  it("should accurately classify and auto-fill a PC Hardware component with complete hardware specs", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Tarjeta de Video ASUS ROG Strix GeForce RTX 4070 Ti SUPER 16GB GDDR6X",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    const data = json.data;

    expect(["HARDWARE", "OTHER"]).toContain(data.type);
    expect(data.sku).toMatch(/^(HW-|PROD-)/);
    expect(data.customSpecifications).toBeDefined();
    expect(data.customSpecifications.hardware).toBeDefined();
    expect(data.customSpecifications.hardware.hardwareType).toBe("TARJETA_DE_VIDEO");
  });

  it("should identify and infer category from image file name when no raw name is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageFileName: "playstation_5_slim_console_edition.jpg",
        imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    const data = json.data;

    expect(data.name).toBeTruthy();
    expect(data.name.toLowerCase()).toContain("playstation");
    expect(["CONSOLE", "OTHER"]).toContain(data.type);
    expect(data.sku).toMatch(/^(CON-|HW-|PROD-)/);
  });

  it("should respect explicit category override when selectedType is provided by admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Chainsaw Man Pochita Cosplay Hoodie",
        selectedType: "APPAREL",
        customCategoryLabel: "Ropa & Estilo",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    const data = json.data;

    expect(data.type).toBe("APPAREL");
    expect(data.customCategoryLabel).toBe("Ropa & Estilo");
  });

  it("should populate trailerUrl with an official YouTube link and assign regulatory product ageRating", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Elden Ring: Shadow of the Erdtree Deluxe Edition",
        selectedType: "VIDEO_GAME",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const data = json.data;

    // Verify official YouTube trailer URL is populated
    expect(data.trailerUrl).toBeDefined();
    expect(data.trailerUrl).toMatch(/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//);

    // Verify product age rating is regulatory for the game (ESRB M or 18+), not a video restriction
    expect(["ESRB M", "18+"]).toContain(data.ageRating);

    // Verify gameSpecs contains complete fields
    expect(data.gameSpecs).toBeDefined();
    expect(data.gameSpecs.title).toBeTruthy();
    expect(data.gameSpecs.genre).toBeTruthy();
    expect(data.gameSpecs.platform).toBeTruthy();
    expect(data.gameSpecs.developer).toBeTruthy();
    expect(data.gameSpecs.publisher).toBeTruthy();
    expect(data.gameSpecs.fileSize).toBeTruthy();
    expect(data.gameSpecs.audioLanguages).toBeTruthy();
    expect(data.gameSpecs.subtitleLanguages).toBeTruthy();
  });

  it("should populate figureSpecs completely and assign appropriate collector age rating", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Makima 1/7 Scale Shibuya Scramble Figure Chainsaw Man",
        selectedType: "FIGURE",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const data = json.data;

    expect(data.type).toBe("FIGURE");
    expect(data.trailerUrl).toBeDefined();
    expect(data.trailerUrl).toMatch(/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//);

    // Collector anime figures have 14+ or 18+ regulatory seal
    expect(["14+", "18+", "TE"]).toContain(data.ageRating);

    // Verify figureSpecs completeness
    expect(data.figureSpecs).toBeDefined();
    expect(data.figureSpecs.scale).toBeDefined();
    expect(data.figureSpecs.manufacturer).toBeDefined();
    expect(data.figureSpecs.material).toBeDefined();
    expect(data.figureSpecs.height).toBeDefined();
    expect(data.figureSpecs.sculptor).toBeDefined();
    expect(data.figureSpecs.boxCondition).toBeDefined();
    expect(data.figureSpecs.boxDimensions).toBeDefined();
  });

  it("should assign EXEMPT age rating for PC Hardware and populate all hardware specs", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Procesador AMD Ryzen 7 7800X3D AM5",
        selectedType: "HARDWARE",
        customCategoryLabel: "Hardware & Componentes",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const data = json.data;

    // Hardware has EXEMPT regulatory seal
    expect(data.ageRating).toBe("EXEMPT");
    expect(data.customSpecifications).toBeDefined();
    expect(data.customSpecifications.hardware).toBeDefined();
    expect(data.customSpecifications.hardware.hardwareType).toBe("PROCESADORES");
    expect(data.customSpecifications.hardware.cpu).toBeDefined();
    expect(data.customSpecifications.hardware.cpu.socket).toBeDefined();
  });

  it("should populate powerSupply technical specifications completely with activePfc and rail currents", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/auto-fill-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Corsair RMe Series RM750e 2025 (CP-9020295-NA) (750 W)",
        selectedType: "HARDWARE",
        customCategoryLabel: "Fuente de Poder",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const data = json.data;

    expect(data.customSpecifications).toBeDefined();
    expect(data.customSpecifications.hardware).toBeDefined();
    expect(data.customSpecifications.hardware.hardwareType).toBe("FUENTE_DE_PODER");

    const psu = data.customSpecifications.hardware.powerSupply;
    expect(psu).toBeDefined();
    expect(psu.power).toBe("750 W");
    expect(psu.certification).toBeDefined();
    expect(psu.size).toBeDefined();
    expect(psu.activePfc).toBeDefined();
    expect(psu.modular).toBeDefined();
    expect(psu.rail12vCurrent).toBeDefined();
    expect(psu.rail5vCurrent).toBeDefined();
    expect(psu.rail33vCurrent).toBeDefined();
    expect(psu.powerConnectors).toBeDefined();
  });
});

