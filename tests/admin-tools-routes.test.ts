import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { DEFAULT_HOME_HERO } from "@/lib/constants/homeHeroDefaults";
import { importHeaders } from "@/lib/admin-tools/import";
const mock = vi.hoisted(() => ({
  auth: vi.fn(),
  catalog: vi.fn(),
  fetch: vi.fn(),
  models: vi.fn(),
  invalidate: vi.fn(),
  db: { collection: vi.fn(), runTransaction: vi.fn() },
}));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: mock.db }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mock.auth }));
vi.mock("@/lib/firebase/firestore", () => ({
  getProductsFromFirestore: mock.catalog,
  invalidateProductsCache: mock.invalidate,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/services/aiProtection", () => ({
  withAiProtection: (_name: string, handler: unknown) => handler,
  protectedAiFetch: mock.fetch,
}));
vi.mock("@/lib/services/geminiClient", () => ({
  getGeminiApiKey: () => "test",
  getSupportedGeminiModels: mock.models,
}));
vi.mock("@/lib/services/apiTelemetryService", () => ({
  recordApiUsage: vi.fn(),
}));
import { POST as importPOST } from "@/app/api/admin/import/route";
import {
  GET as labGET,
  POST as labPOST,
} from "@/app/api/admin/laboratory/route";
import {
  GET as mediaGET,
  POST as mediaPOST,
  PATCH as mediaPATCH,
} from "@/app/api/admin/media/route";
import { GET as catalogGET } from "@/app/api/admin/tools/catalog/route";
import { POST as ask, PATCH as apply } from "@/app/api/admin/assistant/route";
import { GET as imageGET } from "@/app/api/media/[id]/route";
type Data = Record<string, unknown>;
type Ref = {
  path: string;
  id: string;
  get: () => Promise<unknown>;
  set: (data: Data) => Promise<void>;
};
let docs: Map<string, Data>;
let serial: number;
const req = (body?: unknown, path = "/api/admin/import") =>
  new NextRequest(
    "https://example.com" + path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
function snapshot(path: string) {
  return {
    id: path.split("/").at(-1),
    exists: docs.has(path),
    data: () => docs.get(path),
    ref: reference(path),
  };
}
function reference(path: string): Ref {
  return {
    path,
    id: path.split("/").at(-1)!,
    get: async () => snapshot(path),
    set: async (data) => {
      docs.set(path, data);
    },
  };
}
function query(name: string) {
  const node = {
    path: name,
    doc: (id?: string) => reference(name + "/" + (id || "auto-" + ++serial)),
    get: async () => {
      const items = Array.from(docs.keys())
        .filter(
          (path) => path.startsWith(name + "/") && path.split("/").length === 2,
        )
        .map(snapshot);
      return { docs: items, size: items.length };
    },
    limit: () => node,
    orderBy: () => node,
  };
  return node;
}
beforeEach(() => {
  vi.clearAllMocks();
  docs = new Map();
  serial = 0;
  mock.auth.mockResolvedValue({ authorized: true, actor: "admin@example.com" });
  mock.catalog.mockResolvedValue([]);
  mock.models.mockResolvedValue(["test-model"]);
  mock.db.collection.mockImplementation(query);
  mock.db.runTransaction.mockImplementation(
    async (work: (tx: unknown) => Promise<unknown>) => {
      const writes = new Map<string, Data>();
      const result = await work({
        get: async (ref: { path: string; id?: string }) =>
          ref.id ? snapshot(ref.path) : query(ref.path).get(),
        set: (ref: Ref, data: Data) => writes.set(ref.path, data),
        update: (ref: Ref, data: Data) =>
          writes.set(ref.path, { ...docs.get(ref.path), ...data }),
      });
      for (const [key, value] of writes) docs.set(key, value);
      return result;
    },
  );
});
const matrix = [
  Array.from(importHeaders),
  [
    "FIG-ONE",
    "Figura de prueba",
    "FIGURE",
    "24990",
    "15000",
    "4",
    "Descripción válida",
    "",
  ],
];
describe("Admin tools security and transactions", () => {
  it("blocks unauthorized users before database, model and file processing", async () => {
    mock.auth.mockResolvedValue({ authorized: false });
    for (const handler of [
      importPOST,
      labGET,
      labPOST,
      mediaGET,
      mediaPOST,
      mediaPATCH,
      catalogGET,
      ask,
      apply,
    ])
      expect((await handler(req({}))).status).toBe(403);
    expect(mock.db.collection).not.toHaveBeenCalled();
    expect(mock.fetch).not.toHaveBeenCalled();
  });
  it("previews imports without modifying products, then commits once with an audit", async () => {
    const preview = await (
      await importPOST(req({ action: "preview", mode: "CREATE", matrix }))
    ).json();
    expect(preview.success).toBe(true);
    expect(
      Array.from(docs.keys()).filter((key) => key.startsWith("products/")),
    ).toEqual([]);
    const body = { action: "commit", jobId: preview.data.jobId, rows: [2] };
    expect((await importPOST(req(body))).status).toBe(200);
    expect((await importPOST(req(body))).status).toBe(200);
    expect(
      Array.from(docs.keys()).filter((key) => key.startsWith("products/")),
    ).toHaveLength(1);
    expect(
      Array.from(docs.keys()).filter((key) => key.startsWith("admin_audit/")),
    ).toHaveLength(1);
  });
  it("rejects invalid rows and forged import jobs", async () => {
    expect(
      (await importPOST(req({ action: "commit", jobId: "bad", rows: [2] })))
        .status,
    ).toBe(400);
    const invalid = [matrix[0], [...matrix[1]]];
    invalid[1][3] = "-1";
    const preview = await (
      await importPOST(
        req({ action: "preview", mode: "CREATE", matrix: invalid }),
      )
    ).json();
    expect(
      (
        await importPOST(
          req({ action: "commit", jobId: preview.data.jobId, rows: [2] }),
        )
      ).status,
    ).toBe(400);
  });
  it("rolls back an import when catalog or SKU changes after preview", async () => {
    docs.set("products/p1", {
      id: "p1",
      sku: "FIG-ONE",
      name: "Original",
      description: "Original description",
      stockReserved: 0,
    });
    const preview = await (
      await importPOST(req({ action: "preview", mode: "UPDATE", matrix }))
    ).json();
    docs.set("products/p1", {
      ...docs.get("products/p1"),
      name: "Concurrent edit",
    });
    expect(
      (
        await importPOST(
          req({ action: "commit", jobId: preview.data.jobId, rows: [2] }),
        )
      ).status,
    ).toBe(409);
    expect(docs.get("products/p1")?.name).toBe("Concurrent edit");
    expect(
      Array.from(docs.keys()).filter((key) => key.startsWith("admin_audit/")),
    ).toHaveLength(0);
  });
  it("preserves normal price and technical metadata during imports", async () => {
    docs.set("products/p1", {
      id: "p1",
      sku: "FIG-ONE",
      name: "Original",
      description: "Original description",
      stockReserved: 1,
      originalPrice: 29990,
      gameMetadata: { publisher: "Nintendo" },
    });
    const preview = await (
      await importPOST(req({ action: "preview", mode: "UPDATE", matrix }))
    ).json();
    expect(
      (
        await importPOST(
          req({ action: "commit", jobId: preview.data.jobId, rows: [2] }),
        )
      ).status,
    ).toBe(200);
    expect(docs.get("products/p1")).toMatchObject({
      originalPrice: 29990,
      stockReserved: 1,
      calculatedAvailableStock: 3,
      gameMetadata: { publisher: "Nintendo" },
    });
  });
  it("keeps laboratory drafts separate, publishes atomically and preserves a version", async () => {
    const initial = await (await labGET(req())).json();
    const draft = await (
      await labPOST(
        req({
          action: "save",
          name: "Test",
          settings: { ...DEFAULT_HOME_HERO, heading: "Draft title" },
          baseHash: initial.data.baseHash,
        }),
      )
    ).json();
    expect(docs.has("branding_settings/home_hero")).toBe(false);
    expect(
      (await labPOST(req({ action: "publish", id: draft.data.id }))).status,
    ).toBe(200);
    expect(docs.get("branding_settings/home_hero")?.settings).toMatchObject({
      heading: "Draft title",
    });
    expect(
      Array.from(docs.keys()).filter((key) =>
        key.startsWith("visual_versions/"),
      ),
    ).toHaveLength(1);
    expect(
      (await labPOST(req({ action: "publish", id: draft.data.id }))).status,
    ).toBe(200);
    expect(
      Array.from(docs.keys()).filter((key) => key.startsWith("admin_audit/")),
    ).toHaveLength(1);
  });
  it("does not overwrite a published design changed after draft creation", async () => {
    const initial = await (await labGET(req())).json();
    const draft = await (
      await labPOST(
        req({
          action: "save",
          name: "Test",
          settings: DEFAULT_HOME_HERO,
          baseHash: initial.data.baseHash,
        }),
      )
    ).json();
    docs.set("branding_settings/home_hero", {
      settings: { ...DEFAULT_HOME_HERO, heading: "Concurrent title" },
    });
    expect(
      (await labPOST(req({ action: "publish", id: draft.data.id }))).status,
    ).toBe(409);
    expect(docs.get("branding_settings/home_hero")?.settings).toMatchObject({
      heading: "Concurrent title",
    });
  });
  it("rejects SVG uploads and malformed metadata", async () => {
    const form = new FormData();
    form.set(
      "file",
      new File(['<svg onload="x">'], "x.svg", { type: "image/svg+xml" }),
    );
    form.set("name", "Test");
    expect(
      (
        await mediaPOST(
          new NextRequest("https://example.com/api/admin/media", {
            method: "POST",
            body: form,
          }),
        )
      ).status,
    ).toBe(400);
    expect((await mediaPATCH(req({ id: "../x" }))).status).toBe(400);
  });
  it("persists images atomically, serves raster bytes and archives without breaking links", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    const form = new FormData();
    form.set("file", new File([png], "x.png", { type: "image/png" }));
    form.set("name", "Test");
    const asset = await (
      await mediaPOST(
        new NextRequest("https://example.com/api/admin/media", {
          method: "POST",
          body: form,
        }),
      )
    ).json();
    expect(asset.success).toBe(true);
    expect(
      (
        await mediaPATCH(
          req({
            id: asset.data.id,
            name: "Renamed",
            tags: "Zelda",
            position: 0,
            archived: true,
          }),
        )
      ).status,
    ).toBe(200);
    const image = await imageGET(req(), { params: { id: asset.data.id } });
    expect(image.status).toBe(200);
    expect(image.headers.get("Content-Type")).toBe("image/png");
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(png);
  });
  it("never exports the catalog to Gemini and applies only selected reviewed descriptions", async () => {
    const product = {
      id: "p1",
      sku: "PRIVATE-SKU",
      name: "PRIVATE-PRODUCT",
      description: "Old description",
      type: "FIGURE",
      stockAvailable: 3,
      stockReserved: 0,
      price: 123456,
    };
    mock.catalog.mockResolvedValue([product]);
    docs.set("products/p1", product);
    mock.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    filter: "ALL",
                    query: "",
                    introduction: "Una pieza para tu colección.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    const response = await (
      await ask(
        req({ prompt: "Busca todos los productos", prepareDescriptions: true }),
      )
    ).json();
    expect(response.success).toBe(true);
    expect(mock.fetch.mock.calls[0][1].headers).toMatchObject({ "x-goog-api-key": "test" });
    const sent = String(mock.fetch.mock.calls[0][1].body);
    expect(sent).not.toContain("PRIVATE-SKU");
    expect(sent).not.toContain("PRIVATE-PRODUCT");
    expect(sent).not.toContain("123456");
    expect(docs.get("products/p1")?.description).toBe("Old description");
    expect(
      (await apply(req({ jobId: response.data.jobId, ids: ["p1"] }))).status,
    ).toBe(200);
    expect(docs.get("products/p1")?.description).toContain(
      "Una pieza para tu colección.",
    );
  });
  it("fails closed for malformed model responses and changed proposal targets", async () => {
    mock.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '{"action":"delete_all"}' }] } },
        ],
      }),
    });
    expect(
      (
        await ask(
          req({ prompt: "Busca las figuras", prepareDescriptions: false }),
        )
      ).status,
    ).toBe(503);
    expect(
      Array.from(docs.keys()).filter((key) =>
        key.startsWith("assistant_plans/"),
      ),
    ).toHaveLength(0);
  });
});
