import { describe, it, expect, beforeEach } from "vitest";
import { CatalogRepository } from "../src/lib/services/CatalogRepository";
import { MemoryTransactionalStore } from "../src/lib/db/memory-db";
import { StockReservationService } from "../src/lib/services/StockReservationService";
import { CreateProductSchema } from "../src/lib/validations/schemas";
import { ValidationError } from "../src/lib/errors/DomainErrors";

describe("Catalog Repository & Product Creation Domain Suite", () => {
  let repo: CatalogRepository;
  let store: MemoryTransactionalStore;
  let reservationService: StockReservationService;

  beforeEach(() => {
    store = MemoryTransactionalStore.getInstance();
    repo = CatalogRepository.getInstance();
    reservationService = new StockReservationService(store);
  });

  it("should validate a valid Figure pre-order payload via CreateProductSchema", () => {
    const payload = {
      sku: "fig-gojo-17",
      name: "Satoru Gojo 1/7 Scale PVC Figure",
      description: "Figura premium con efectos translúcidos y base diorama.",
      type: "FIGURE",
      price: 189990,
      costPrice: 115000,
      stockAvailable: 20,
      isPreOrder: true,
      figureMetadata: {
        scale: "SCALE_1_7",
        manufacturer: "GOOD_SMILE_COMPANY",
        estimatedArrivalDate: "Noviembre 2026",
        allowsPartialDeposit: true,
        minimumDepositPercent: 0.2,
      },
    };

    const parsed = CreateProductSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sku).toBe("FIG-GOJO-17"); // uppercase transform
      expect(parsed.data.price).toBe(189990);
    }
  });

  it("should reject negative or zero price in CreateProductSchema", () => {
    const invalidPayload = {
      sku: "VG-INVALID",
      name: "Invalid Game",
      description: "Invalid price test",
      type: "VIDEO_GAME",
      price: -5000,
      costPrice: 1000,
      stockAvailable: 10,
    };

    const parsed = CreateProductSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it("should successfully add a new product to the catalog repository and retrieve it by SKU or Slug", () => {
    const testSku = `FIG-TEST-${Date.now()}`;
    const newProduct = repo.addProduct({
      sku: testSku,
      name: "Test scale figure",
      description: "Test figure description for repository test",
      type: "FIGURE",
      price: 149990,
      costPrice: 90000,
      stockAvailable: 15,
      isPreOrder: true,
      figureMetadata: {
        id: "meta-test-fig",
        productId: "",
        scale: "SCALE_1_7",
        manufacturer: "GOOD_SMILE_COMPANY",
        estimatedArrivalDate: "Diciembre 2026",
        allowsPartialDeposit: true,
        minimumDepositPercent: 0.2,
      },
    });

    expect(newProduct.id).toBeDefined();
    expect(newProduct.sku).toBe(testSku);

    // Retrieve by SKU
    const retrievedBySku = repo.getBySlugOrSku(testSku);
    expect(retrievedBySku).not.toBeNull();
    expect(retrievedBySku?.name).toBe("Test scale figure");

    // Retrieve by lower-case slug
    const retrievedBySlug = repo.getBySlugOrSku(testSku.toLowerCase());
    expect(retrievedBySlug).not.toBeNull();
    expect(retrievedBySlug?.price).toBe(149990);
  });

  it("should throw ValidationError if adding a product with duplicate SKU", () => {
    const duplicateSku = "DUPLICATE-SKU-TEST";
    repo.addProduct({
      sku: duplicateSku,
      name: "First Item",
      description: "First Item Description",
      type: "VIDEO_GAME",
      price: 59990,
      costPrice: 40000,
      stockAvailable: 10,
      isPreOrder: false,
    });

    expect(() => {
      repo.addProduct({
        sku: duplicateSku,
        name: "Second Item Same SKU",
        description: "Second Item Description",
        type: "VIDEO_GAME",
        price: 69990,
        costPrice: 45000,
        stockAvailable: 5,
        isPreOrder: false,
      });
    }).toThrow(ValidationError);
  });

  it("should allow immediate stock reservation on a newly created product", async () => {
    const reserveSku = `VG-RESERVE-${Date.now()}`;
    const product = repo.addProduct({
      sku: reserveSku,
      name: "Reservable Game",
      description: "High demand game for reservation",
      type: "VIDEO_GAME",
      price: 69990,
      costPrice: 50000,
      stockAvailable: 10,
      isPreOrder: false,
    });

    // Reserve 3 units
    const batch = await reservationService.reserveStockAtomic("cart-session-test-01", [
      { productId: product.id, quantity: 3 },
    ]);
    expect(batch.reservations).toHaveLength(1);
    expect(batch.reservations[0].status).toBe("PENDING");
    expect(batch.reservations[0].quantity).toBe(3);

    // Verify repository product stockReserved has updated to 3
    const refreshed = repo.getBySlugOrSku(reserveSku);
    expect(refreshed?.stockReserved).toBe(3);
    expect(refreshed?.stockAvailable).toBe(10);
  });

  it("should validate a Collectible/TCG payload with all 14 specification fields", () => {
    const tcgPayload = {
      sku: "TCG-CHARIZARD-01",
      name: "Charizard Base Set 1st Edition Holo",
      description: "Carta de colección encapsulada en slab con certificación PSA 10.",
      type: "COLLECTIBLE",
      price: 25000000,
      costPrice: 18000000,
      stockAvailable: 1,
      isPreOrder: false,
      collectibleMetadata: {
        category: "TCG",
        condition: "GEM_MINT_10",
        authenticationBody: "PSA",
        cardLanguage: "Japonés",
        serialNumber: "PSA-99201482",
        gradeScore: "10",
        slabType: "Carta Individual Graduada (Slab Acrílico)",

        // 1. Información General
        productName: "Charizard Base Set Holo 1st Edition",
        franchise: "Pokémon",
        gameSystem: "Pokémon TCG",
        language: "Japonés",

        // 2. Edición y Rareza
        setExpansion: "Base Set (1st Edition)",
        releaseYear: "1996",
        cardNumber: "4/102",
        rarity: "Holo Rare (1st Edition)",
        finishVariant: "Holográfica (Foil Cosmos)",

        // 3. Condición
        gradingCondition: "GEM_MINT_10",
        wearDetails: "Sin blanqueamiento en bordes, esquinas 10/10, centrado 55/45",
        certification: "PSA",

        // 4. Presentación
        productType: "Carta Individual Graduada (Slab Acrílico)",
        itemQuantity: "1 Carta en Slab Certificado",
        includesProtection: "Sí - Slab Acrílico Hermético con Filtro UV 99%",
      },
    };

    const parsed = CreateProductSchema.safeParse(tcgPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.collectibleMetadata?.productName).toBe("Charizard Base Set Holo 1st Edition");
      expect(parsed.data.collectibleMetadata?.setExpansion).toBe("Base Set (1st Edition)");
      expect(parsed.data.collectibleMetadata?.gradingCondition).toBe("GEM_MINT_10");
      expect(parsed.data.collectibleMetadata?.includesProtection).toBe("Sí - Slab Acrílico Hermético con Filtro UV 99%");
    }
  });

  it("should gracefully preprocess natural language condition and certification ('Near Mint' and 'Sin Certificación')", () => {
    const naturalLangPayload = {
      sku: "TCG-PIKACHU-RAW",
      name: "Pikachu Promo Raw",
      description: "Carta individual sin certificar en condición Near Mint.",
      type: "COLLECTIBLE",
      price: 15000,
      costPrice: 8000,
      stockAvailable: 5,
      collectibleMetadata: {
        category: "TCG",
        condition: "Near Mint",
        authenticationBody: "Sin Certificación",
        cardLanguage: "Inglés",
      },
    };

    const parsed = CreateProductSchema.safeParse(naturalLangPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.collectibleMetadata?.condition).toBe("NEAR_MINT_8");
      expect(parsed.data.collectibleMetadata?.authenticationBody).toBe("NONE");
    }
  });
});

