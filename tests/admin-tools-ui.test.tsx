// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { DEFAULT_HOME_HERO } from "@/lib/constants/homeHeroDefaults";
const mock = vi.hoisted(() => ({ request: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/admin-tools/client", () => ({
  toolRequest: mock.request,
  downloadBlob: vi.fn(),
  optimizeImage: vi.fn(),
}));
vi.mock("@/lib/admin-tools/excel", () => ({
  readImportFile: mock.read,
  excelTemplate: vi.fn(),
}));
import { ProductImporter } from "@/components/admin/tools/ProductImporter";
import { StoreLaboratory } from "@/components/admin/tools/StoreLaboratory";
import { AdminAssistant } from "@/components/admin/tools/AdminAssistant";
import { MediaLibrary } from "@/components/admin/tools/MediaLibrary";
let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
async function click(text: string) {
  const node = Array.from(host.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(text),
  );
  expect(node).toBeTruthy();
  await act(async () => node!.click());
}
describe("Administrative tool review surfaces", () => {
  it("requires a second confirmation before committing a previewed import", async () => {
    mock.read.mockResolvedValue([]);
    mock.request
      .mockResolvedValueOnce({
        jobId: "job",
        rows: [
          {
            row: 2,
            product: {
              sku: "FIG-ONE",
              name: "Figura",
              price: 10000,
              costPrice: 5000,
              stockAvailable: 1,
            },
            operation: "CREATE",
            errors: [],
          },
        ],
      })
      .mockResolvedValueOnce({ count: 1 });
    await act(async () => root.render(<ProductImporter />));
    const input = host.querySelector<HTMLInputElement>("input[type=file]")!;
    Object.defineProperty(input, "files", {
      value: [new File(["test"], "test.csv")],
      configurable: true,
    });
    await act(async () =>
      input.dispatchEvent(new Event("change", { bubbles: true })),
    );
    expect(mock.request).toHaveBeenCalledTimes(1);
    await click("Revisar y guardar lote");
    expect(mock.request).toHaveBeenCalledTimes(1);
    await click("Confirmar importación");
    expect(mock.request).toHaveBeenLastCalledWith("/api/admin/import", {
      action: "commit",
      jobId: "job",
      rows: [2],
    });
    expect(host.textContent).toContain("guardados");
  });
  it("laboratory saving creates a draft and publishing requires confirmation", async () => {
    const draft = {
      id: "draft",
      name: "Campaign",
      settings: DEFAULT_HOME_HERO,
      published: false,
      at: "2026-10-04",
    };
    const live = {
      settings: DEFAULT_HOME_HERO,
      baseHash: "hash",
      drafts: [draft],
    };
    mock.request.mockResolvedValue(live);
    await act(async () => root.render(<StoreLaboratory products={[]} />));
    expect(host.textContent).toContain("Borrador · vista previa");
    await click("Publicar este borrador");
    expect(mock.request).toHaveBeenCalledTimes(1);
    await click("Confirmar publicación");
    expect(
      mock.request.mock.calls.some((call) => call[1]?.action === "publish"),
    ).toBe(true);
  });
  it("assistant proposals remain unapplied until individually selected and confirmed", async () => {
    mock.request.mockResolvedValue({
      filter: "ALL",
      query: "",
      jobId: "job",
      products: [{ id: "p", name: "Link", sku: "FIG-ONE" }],
      proposals: [{ id: "p", before: "Previous", description: "Proposed" }],
      totalCatalog: 1,
    });
    await act(async () => root.render(<AdminAssistant />));
    await click("Muéstrame productos sin imágenes");
    await act(async () =>
      host
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(host.textContent).toContain("Previous");
    expect(host.textContent).toContain("Proposed");
    const checkbox = host.querySelectorAll<HTMLInputElement>(
      "input[type=checkbox]",
    )[1];
    await act(async () => checkbox.click());
    await click("Revisar aplicación");
    expect(mock.request).toHaveBeenCalledTimes(1);
    await click("Confirmar cambios");
    expect(mock.request).toHaveBeenLastCalledWith(
      "/api/admin/assistant",
      { jobId: "job", ids: ["p"] },
      "PATCH",
    );
  });
  it("library picks a reusable URL without changing product data", async () => {
    const choose = vi.fn();
    mock.request.mockResolvedValue([
      {
        id: "id",
        name: "Link",
        tags: "Zelda",
        url: "/api/media/id",
        bytes: 1234,
        archived: false,
        position: 1,
      },
    ]);
    await act(async () => root.render(<MediaLibrary onSelect={choose} />));
    await click("Usar imagen");
    expect(choose).toHaveBeenCalledWith("/api/media/id");
    expect(mock.request).toHaveBeenCalledTimes(1);
  });
  it("shows persistence failures instead of a fictitious success", async () => {
    mock.request.mockRejectedValue(new Error("Storage unavailable"));
    await act(async () => root.render(<MediaLibrary />));
    expect(host.querySelector("[role=alert]")?.textContent).toContain(
      "Storage unavailable",
    );
  });
});

describe("Google Sheets import review", () => {
  async function enterLink() {
    const input = host.querySelector<HTMLInputElement>("input[type=url]")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(
        input,
        "https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuv123456/edit#gid=7",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  it("loads the selected Drive tab into the existing preview and requires confirmation", async () => {
    const matrix = [
      [
        "sku",
        "nombre",
        "tipo",
        "precio",
        "costo",
        "stock",
        "descripcion",
        "imagen",
      ],
      [
        "FIG-001",
        "Figura desde Drive",
        "FIGURE",
        "54990",
        "42000",
        "8",
        "Descripción válida",
        "",
      ],
    ];
    mock.request.mockImplementation(
      async (url: string, body?: { action?: string }) => {
        if (url.endsWith("google-sheets")) {
          if (!body)
            return {
              serviceEmail: "reader@example.iam.gserviceaccount.com",
              configured: true,
            };
          if (body.action === "inspect")
            return {
              title: "Catálogo Drive",
              spreadsheetId: "id",
              selectedSheetId: 7,
              sheets: [
                { id: 0, title: "Otra" },
                { id: 7, title: "Productos" },
              ],
            };
          return { matrix };
        }
        if (body?.action === "preview")
          return {
            jobId: "google-job",
            rows: [
              {
                row: 2,
                product: {
                  sku: "FIG-001",
                  name: "Figura desde Drive",
                  price: 54990,
                  costPrice: 42000,
                  stockAvailable: 8,
                },
                errors: [],
                operation: "CREATE",
              },
            ],
          };
        return { count: 1 };
      },
    );
    await act(async () => root.render(<ProductImporter />));
    await click("Google Sheets (Drive)");
    expect(host.textContent).toContain(
      "reader@example.iam.gserviceaccount.com",
    );
    await enterLink();
    await click("Conectar hoja");
    expect(
      host.querySelector<HTMLSelectElement>("select:last-of-type")?.value ||
        host.textContent,
    ).toBeTruthy();
    expect(Array.from(host.querySelectorAll("select")).at(-1)?.value).toBe("7");
    await click("Previsualizar Google Sheets");
    expect(mock.request).toHaveBeenCalledWith(
      "/api/admin/import/google-sheets",
      expect.objectContaining({ action: "read", sheetId: 7 }),
    );
    expect(mock.request).toHaveBeenCalledWith("/api/admin/import", {
      action: "preview",
      mode: "CREATE",
      matrix,
    });
    expect(host.textContent).toContain("Figura desde Drive");
    expect(
      mock.request.mock.calls.some((call) => call[1]?.action === "commit"),
    ).toBe(false);
    await click("Revisar y guardar lote");
    await click("Confirmar importación");
    expect(mock.request).toHaveBeenLastCalledWith("/api/admin/import", {
      action: "commit",
      jobId: "google-job",
      rows: [2],
    });
    expect(mock.read).not.toHaveBeenCalled();
  });
  it("shows Google permission failures without creating a preview or committing products", async () => {
    mock.request.mockImplementation(async (_url: string, body?: unknown) => {
      if (!body)
        return {
          serviceEmail: "reader@example.iam.gserviceaccount.com",
          configured: true,
        };
      throw new Error(
        "Comparte la hoja con la cuenta de servicio como lector.",
      );
    });
    await act(async () => root.render(<ProductImporter />));
    await click("Google Sheets (Drive)");
    await enterLink();
    await click("Conectar hoja");
    expect(host.querySelector("[role=alert]")?.textContent).toContain(
      "Comparte la hoja",
    );
    expect(
      mock.request.mock.calls.every((call) =>
        call[0].endsWith("google-sheets"),
      ),
    ).toBe(true);
    expect(host.textContent).not.toContain("Confirmar importación");
  });
});
