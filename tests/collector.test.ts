import { describe, expect, it } from "vitest";
import { collectorInput, parseCollectorEntries, type CollectorEntry } from "@/lib/collector/schema";
import { matchWantedPieces } from "@/lib/collector/matches";
import { collectorOwnerKey, updateCollectorEntries } from "@/lib/collector/storage";
import { buildNotifications } from "@/lib/services/customerNotifications";

const id = "550e8400-e29b-41d4-a716-446655440000";
const entry: CollectorEntry = { ...collectorInput.parse({ title: "Pokémon Pikachu", category: "FIGURE" }), id, kind: "WANTED", createdAt: "2026-10-03", updatedAt: "2026-10-03" };
const product = { id: "p1", sku: "FIG-1", name: "Pokemon Pikachu", type: "FIGURE", price: 10000, stockAvailable: 2, stockReserved: 0 };

describe("Collector validation, matching and mutation", () => {
  it("rejects unsafe photos, forged fields, fractional budgets and large notes", () => {
    const valid = collectorInput.parse({ title: "Link", category: "FIGURE" });
    for (const photoUrl of ["javascript:alert(1)", "data:image/png;base64,a", "http://example.com/photo", "//example.com/photo", "https://user:pass@example.com/photo"]) expect(collectorInput.safeParse({ ...valid, photoUrl }).success).toBe(false);
    expect(collectorInput.safeParse({ ...valid, photoUrl: "https://example.com/photo.png" }).success).toBe(true);
    expect(collectorInput.safeParse({ ...valid, photoUrl: "//example.com/photo" }).success).toBe(false);
    expect(collectorInput.safeParse({ ...valid, ownerId: "victim" }).success).toBe(false);
    expect(collectorInput.safeParse({ ...valid, maxBudget: 1.5 }).success).toBe(false);
    expect(collectorInput.safeParse({ ...valid, notes: "x".repeat(1501) }).success).toBe(false);
  });
  it("normalizes accents but requires every significant name and edition token", () => {
    expect(matchWantedPieces([entry], [product])[id]).toHaveLength(1);
    expect(matchWantedPieces([{ ...entry, edition: "Deluxe" }], [product])[id]).toEqual([]);
    expect(matchWantedPieces([{ ...entry, title: "Pikachu Charizard" }], [product])[id]).toEqual([]);
    expect(matchWantedPieces([{ ...entry, title: "Figura" }], [product])[id]).toEqual([]);
    expect(matchWantedPieces([{ ...entry, category: "VIDEO_GAME" }], [product])[id]).toEqual([]);
  });
  it("uses actual available stock, excludes preorder, and respects the budget", () => {
    for (const item of [{ ...product, stockReserved: 2 }, { ...product, calculatedAvailableStock: 0 }, { ...product, isPreOrder: true }]) expect(matchWantedPieces([entry], [item])[id]).toEqual([]);
    expect(matchWantedPieces([{ ...entry, maxBudget: 9999 }], [product])[id]).toEqual([]);
    expect(matchWantedPieces([{ ...entry, maxBudget: 10000 }], [product])[id]).toHaveLength(1);
  });
  it("exact linked product IDs do not match similarly named substitutes", () => {
    expect(matchWantedPieces([{ ...entry, title: "Nombre propio", productId: "p1" }], [product, { ...product, id: "p2" }])[id].map(item => item.id)).toEqual(["p1"]);
    expect(matchWantedPieces([{ ...entry, kind: "COLLECTION" }], [product])).toEqual({});
  });
  it("bounds suggestions and orders them by price", () => {
    const products = Array.from({ length: 12 }, (_, index) => ({ ...product, id: "p" + index, price: 12000 - index * 100 }));
    const matches = matchWantedPieces([entry], products)[id]; expect(matches).toHaveLength(6); expect(matches[0].price).toBe(10900);
  });
  it("moves wanted items without duplication and never updates unknown IDs", () => {
    expect(updateCollectorEntries([entry], "UPDATE", { ...entry, kind: "COLLECTION" })).toEqual([{ ...entry, kind: "COLLECTION" }]);
    expect(() => updateCollectorEntries([], "UPDATE", entry)).toThrow("no pertenece");
    expect(() => updateCollectorEntries([], "DELETE", { id })).toThrow("no pertenece");
    expect(updateCollectorEntries([entry], "DELETE", { id })).toEqual([]);
    expect(() => updateCollectorEntries([entry], "ADD", entry)).toThrow("ya existe");
  });
  it("limits each list independently and rejects corrupt persisted records", () => {
    const full = Array.from({ length: 60 }, (_, index) => ({ ...entry, id: "entry" + index }));
    expect(() => updateCollectorEntries(full, "ADD", entry)).toThrow("60 piezas");
    expect(updateCollectorEntries(full, "ADD", { ...entry, kind: "COLLECTION" })).toHaveLength(61);
    expect(parseCollectorEntries(undefined)).toEqual([]);
    expect(() => parseCollectorEntries([{ forged: true }])).toThrow();
  });
  it("keys are based on verified UID, with a separate namespace for server sessions", () => {
    expect(collectorOwnerKey({ uid: "one", email: "a@example.com" })).toBe(collectorOwnerKey({ uid: "one", email: "b@example.com" }));
    expect(collectorOwnerKey({ uid: "one", email: "a@example.com" })).not.toBe(collectorOwnerKey({ uid: "two", email: "a@example.com" }));
    expect(collectorOwnerKey({ uid: "", email: "one" })).not.toBe(collectorOwnerKey({ uid: "one", email: "" }));
  });
  it("creates stable wanted notices only for current available matches", () => {
    const first = buildNotifications([], [], [product], [], [entry]); expect(first[0]).toMatchObject({ kind: "WANTED", href: "/account?tab=wanted", read: false });
    expect(buildNotifications([], [], [product], [first[0].id], [entry])[0].read).toBe(true);
    expect(buildNotifications([], [], [{ ...product, stockAvailable: 0 }], [], [entry])).toEqual([]);
    expect(buildNotifications([], [], [product], [], [{ ...entry, kind: "COLLECTION" }])).toEqual([]);
  });
});
