import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), save: vi.fn(), remove: vi.fn(), hide: vi.fn(), diskSave: vi.fn(), diskRemove: vi.fn(), diskHide: vi.fn(), diskRestore: vi.fn() }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mocks.auth }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null, isFirebaseAdminConfigured: () => true }));
vi.mock("@/lib/firebase/firestore", () => ({ saveCustomCategoryToFirestore: mocks.save, deleteCustomCategoryFromFirestore: mocks.remove,
  saveDeletedNativeCategoriesToFirestore: mocks.hide, getDeletedNativeCategoriesFromFirestore: async () => [], getCustomCategoriesFromFirestore: async () => [] }));
vi.mock("@/lib/services/categoryDiskService", () => ({ saveCategoryToDisk: mocks.diskSave, deleteCategoryFromDisk: mocks.diskRemove, deleteNativeCategoryOnDisk: mocks.diskHide,
  restoreNativeCategoryOnDisk: mocks.diskRestore, readDeletedNativeCategoriesFromDisk: () => [], readCategoriesFromDisk: () => [], writeCategoriesToDisk: vi.fn(), writeDeletedNativeCategoriesToDisk: vi.fn() }));
import { POST } from "@/app/api/admin/categories/route";
import { DELETE } from "@/app/api/admin/categories/[id]/route";
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ authorized: true, actor: "admin@example.com" }); mocks.save.mockResolvedValue(false); mocks.remove.mockResolvedValue(false); mocks.hide.mockResolvedValue(false); });
describe("Category mutations require confirmed persistence", () => {
  it("rejects unauthorized creation and deletion before touching storage", async () => {
    mocks.auth.mockResolvedValue({ authorized: false });
    expect((await POST(new NextRequest("http://localhost/api/admin/categories", { method: "POST", body: JSON.stringify({ name: "Test" }) }))).status).toBe(403);
    expect((await DELETE(new NextRequest("http://localhost/api/admin/categories/custom", { method: "DELETE" }), { params: { id: "custom" } })).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("does not create local phantom categories when the database refuses a save", async () => {
    expect((await POST(new NextRequest("http://localhost/api/admin/categories", { method: "POST", body: JSON.stringify({ name: "Test" }) }))).status).toBe(503);
    expect(mocks.diskSave).not.toHaveBeenCalled();
    mocks.save.mockResolvedValue(true);
    expect((await POST(new NextRequest("http://localhost/api/admin/categories", { method: "POST", body: JSON.stringify({ name: "Test" }) }))).status).toBe(200);
    expect(mocks.diskSave).toHaveBeenCalledOnce();
  });
  it("does not delete, hide or restore local categories after a failed database mutation", async () => {
    for (const path of ["custom", "BOOK", "BOOK?restore=true"]) {
      const response = await DELETE(new NextRequest("http://localhost/api/admin/categories/" + path, { method: "DELETE" }), { params: { id: path.split("?")[0] } });
      expect(response.status).toBe(503);
    }
    expect(mocks.diskRemove).not.toHaveBeenCalled(); expect(mocks.diskHide).not.toHaveBeenCalled(); expect(mocks.diskRestore).not.toHaveBeenCalled();
  });
});
