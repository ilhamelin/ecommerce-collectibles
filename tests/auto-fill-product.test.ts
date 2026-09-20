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
});
