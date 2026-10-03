import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DEFAULT_HOME_HERO } from "@/lib/constants/homeHeroDefaults";

const mocks = vi.hoisted(() => ({ authorization: vi.fn(), get: vi.fn(), set: vi.fn(), doc: vi.fn(), collection: vi.fn(), products: vi.fn(), revalidate: vi.fn(), database: { available: true } }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mocks.authorization }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/firebase/admin", () => ({ get adminDb() { return mocks.database.available ? { collection: mocks.collection } : null; } }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: mocks.products }));
vi.mock("@/lib/services/CatalogRepository", () => ({ CatalogRepository: { getInstance: () => ({ getAll: () => [] }) } }));

import { GET, POST } from "@/app/api/admin/home-hero/route";
import { getStorefrontHomeHeroSettings } from "@/lib/firebase/homeHeroSettings";

function request(body: unknown = { settings: DEFAULT_HOME_HERO }) {
  return new NextRequest("http://localhost/api/admin/home-hero", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks(); mocks.database.available = true;
  mocks.authorization.mockResolvedValue({ authorized: true });
  mocks.collection.mockReturnValue({ doc: mocks.doc }); mocks.doc.mockReturnValue({ get: mocks.get, set: mocks.set });
  mocks.get.mockReset().mockResolvedValue({ exists: false }); mocks.set.mockReset().mockResolvedValue(undefined);
  mocks.products.mockReset().mockResolvedValue([]);
});

describe("Protected and durable home hero configuration", () => {
  it("blocks anonymous reads and writes even with client role headers", async () => {
    mocks.authorization.mockResolvedValue({ authorized: false });
    const forged = new NextRequest("http://localhost/api/admin/home-hero", { headers: { "x-user-role": "ADMIN" } });
    expect((await GET(forged)).status).toBe(403); expect((await POST(request())).status).toBe(403);
    expect(mocks.get).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
  });
  it("returns original defaults when the settings document does not exist", async () => {
    const response = await GET(request()); const json = await response.json();
    expect(response.status).toBe(200); expect(json.data.settings).toEqual(DEFAULT_HOME_HERO); expect(json.data.canPersist).toBe(true);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("completes the database write, invalidates the homepage, and reloads the saved content", async () => {
    const settings = { ...DEFAULT_HOME_HERO, heading: "Una nueva colección", primaryHref: "/catalog?category=FIGURE" };
    let stored: unknown;
    mocks.set.mockImplementation(async payload => { stored = payload.settings; });
    mocks.get.mockImplementation(async () => ({ exists: stored !== undefined, data: () => ({ settings: stored }) }));
    const response = await POST(request({ settings })); expect(response.status).toBe(200);
    expect(mocks.collection).toHaveBeenCalledWith("branding_settings"); expect(mocks.doc).toHaveBeenCalledWith("home_hero");
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
    const reloaded = await GET(request()); expect((await reloaded.json()).data.settings).toEqual(settings);
    expect(await getStorefrontHomeHeroSettings()).toEqual(settings);
  });
  it("cannot claim a successful save after a failed write", async () => {
    mocks.set.mockRejectedValue(new Error("offline")); const response = await POST(request());
    expect(response.status).toBe(503); expect((await response.json()).success).toBe(false); expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("permits preview without local credentials but blocks saving", async () => {
    mocks.database.available = false;
    expect((await (await GET(request())).json()).data.canPersist).toBe(false);
    expect((await POST(request())).status).toBe(503); expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects unsafe URLs, snapshots and malformed JSON before writing", async () => {
    expect((await POST(request({ settings: { ...DEFAULT_HOME_HERO, primaryHref: "javascript:alert(1)" } }))).status).toBe(400);
    expect((await POST(request({ settings: { ...DEFAULT_HOME_HERO, productName: "Deleted" } }))).status).toBe(400);
    const malformed = new NextRequest("http://localhost/api/admin/home-hero", { method: "POST", body: "{" });
    expect((await POST(malformed)).status).toBe(400); expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rejects products deleted between loading and saving", async () => {
    expect((await POST(request({ settings: { ...DEFAULT_HOME_HERO, featuredProductId: "deleted" } }))).status).toBe(400);
    expect(mocks.products).toHaveBeenCalledWith(true); expect(mocks.set).not.toHaveBeenCalled();
  });
  it("does not replace a failed catalog check with an in-memory product", async () => {
    mocks.products.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(503);
    expect((await POST(request({ settings: { ...DEFAULT_HOME_HERO, featuredProductId: "old" } }))).status).toBe(503);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("saves only the chosen ID rather than a product snapshot", async () => {
    mocks.products.mockResolvedValue([{ id: "real", sku: "VG-REAL", name: "Actual", price: 59900, costPrice: 10000, stockAvailable: 2, stockReserved: 0, isPreOrder: false, imageUrl: "https://example.com/real.jpg" }]);
    const response = await POST(request({ settings: { ...DEFAULT_HOME_HERO, featuredProductId: "real" } })); expect(response.status).toBe(200);
    const payload = mocks.set.mock.calls[0][0]; expect(payload.settings.featuredProductId).toBe("real"); expect(payload.settings).not.toHaveProperty("price");
    const get = await GET(request()); expect((await get.json()).data.products[0]).not.toHaveProperty("costPrice");
  });
  it("preserves the storefront defaults but surfaces database failure to the editor", async () => {
    mocks.get.mockRejectedValue(new Error("offline"));
    expect(await getStorefrontHomeHeroSettings()).toEqual(DEFAULT_HOME_HERO); expect((await GET(request())).status).toBe(503);
  });
});
