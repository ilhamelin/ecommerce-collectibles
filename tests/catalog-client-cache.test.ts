import { describe, it, expect, vi, beforeEach } from "vitest";
import { catalogClient } from "../src/lib/services/catalogClient";
import type { ProductDomainEntity } from "../src/lib/types/domain";

const mockProducts: ProductDomainEntity[] = [
  {
    id: "prod-1",
    sku: "VG-FORZAH6-PS5",
    name: "Forza Horizon 6 [PS5]",
    description: "Juego de carreras",
    type: "VIDEO_GAME",
    price: 69900,
    costPrice: 45000,
    stockAvailable: 10,
    stockReserved: 0,
    isPreOrder: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    sku: "TCG-SLWPSY-01",
    name: "Slowpoke & Psyduck GX",
    description: "Carta Pokémon TCG",
    type: "COLLECTIBLE",
    price: 180000,
    costPrice: 120000,
    stockAvailable: 1,
    stockReserved: 0,
    isPreOrder: false,
    createdAt: new Date().toISOString(),
  },
];

describe("Catalog Client Micro-Cache & Deduplication", () => {
  beforeEach(() => {
    catalogClient.invalidateCache();
    vi.restoreAllMocks();
  });

  it("serves repeated requests from memory cache without triggering extra fetch calls", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { products: mockProducts } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    // First call: executes fetch
    const firstResult = await catalogClient.getCatalog();
    expect(firstResult).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call: served from memory cache
    const secondResult = await catalogClient.getCatalog();
    expect(secondResult).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // No new network call!
  });

  it("deduplicates concurrent in-flight requests into a single network call", async () => {
    let resolveNetwork: (value: unknown) => void;
    const networkPromise = new Promise((resolve) => {
      resolveNetwork = resolve;
    });

    const fetchSpy = vi.fn().mockImplementation(() =>
      networkPromise.then(() => ({
        ok: true,
        json: async () => ({ success: true, data: { products: mockProducts } }),
      }))
    );
    vi.stubGlobal("fetch", fetchSpy);

    // Trigger 4 concurrent requests at the same millisecond
    const p1 = catalogClient.getCatalog();
    const p2 = catalogClient.getCatalog();
    const p3 = catalogClient.getCatalog();
    const p4 = catalogClient.getCatalog();

    // Resolve network
    resolveNetwork!(null);

    const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);

    expect(r1).toHaveLength(2);
    expect(r2).toHaveLength(2);
    expect(r3).toHaveLength(2);
    expect(r4).toHaveLength(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Deduplicated into 1 request!
  });

  it("forces fresh fetch when invalidateCache is called", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { products: mockProducts } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await catalogClient.getCatalog();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Invalidate
    catalogClient.invalidateCache();

    await catalogClient.getCatalog();
    expect(fetchSpy).toHaveBeenCalledTimes(2); // Fetches again after invalidation
  });

  it("finds a product by SKU or ID from the cache without extra network roundtrips", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { products: mockProducts } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    // Prime cache
    await catalogClient.getCatalog();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Search by SKU
    const itemBySku = await catalogClient.getProductByIdentifier("TCG-SLWPSY-01");
    expect(itemBySku).not.toBeNull();
    expect(itemBySku?.name).toBe("Slowpoke & Psyduck GX");

    // Search by ID
    const itemById = await catalogClient.getProductByIdentifier("prod-1");
    expect(itemById).not.toBeNull();
    expect(itemById?.sku).toBe("VG-FORZAH6-PS5");

    // No extra fetch should have been made
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
