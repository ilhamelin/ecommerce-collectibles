import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const cloud = vi.hoisted(() => ({ categories: vi.fn().mockResolvedValue([]), deleted: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/firebase/client-firestore", () => ({ getCustomCategoriesFromFirestoreClient: cloud.categories, getDeletedNativeCategoriesFromFirestoreClient: cloud.deleted }));
vi.mock("@/lib/auth/security", () => ({ getAdminHeaders: () => ({}) }));
const category = { id: "custom", name: "Categoría vigente", slug: "vigente", availableSubtypes: [], basicSpecFields: [], advancedSpecFields: [], createdAt: "2026-10-03", updatedAt: "2026-10-03" };
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });
afterEach(() => vi.unstubAllGlobals());
describe("Category cache follows confirmed server persistence", () => {
  it("reads published settings without calling protected admin GET endpoints", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true, data: { categories: [category], deletedNativeCategories: [] } })); vi.stubGlobal("fetch", fetcher);
    const { categoryClient } = await import("@/lib/services/categoryClient");
    expect(await categoryClient.getCategories(true)).toEqual([category]);
    expect(fetcher.mock.calls[0][0]).toBe("/api/storefront/categories");
  });
  it("keeps existing custom categories when deletion fails", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ success: true, data: { categories: [category], deletedNativeCategories: [] } })).mockResolvedValue(Response.json({ success: false }, { status: 503 })); vi.stubGlobal("fetch", fetcher);
    const { categoryClient } = await import("@/lib/services/categoryClient");
    await categoryClient.getCategories(true);
    expect(await categoryClient.deleteCategory("custom")).toBe(false);
    expect(await categoryClient.getCategories()).toEqual([category]);
  });
  it("does not hide or restore native categories when the server refuses the change", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ success: true, data: { categories: [], deletedNativeCategories: ["BOOK"] } })).mockResolvedValue(Response.json({ success: false }, { status: 403 })); vi.stubGlobal("fetch", fetcher);
    const { categoryClient } = await import("@/lib/services/categoryClient");
    expect(await categoryClient.getDeletedNativeCategories(true)).toEqual(["BOOK"]);
    expect(await categoryClient.deleteCategory("CONSOLE")).toBe(false);
    expect(await categoryClient.restoreNativeCategory("BOOK")).toBe(false);
    expect(await categoryClient.getDeletedNativeCategories()).toEqual(["BOOK"]);
  });
});
