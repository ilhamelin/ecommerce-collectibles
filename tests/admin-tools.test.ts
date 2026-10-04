import { describe, it, expect } from "vitest";
import { importHeaders, parseCsv, planImport } from "@/lib/admin-tools/import";
import { imageMime, MEDIA_MAX_BYTES } from "@/lib/admin-tools/media";
import { validateXlsx, excelTemplate } from "@/lib/admin-tools/excel";
import { filterAssistantProducts } from "@/lib/admin-tools/assistant";
import {
  HomeHeroSettingsSchema,
  DEFAULT_HOME_HERO,
} from "@/lib/constants/homeHeroDefaults";
import { wrapCanvasText } from "@/lib/admin-tools/social";
import { digest } from "@/lib/admin-tools/shared";
import type { ProductDomainEntity } from "@/lib/types/domain";
const row = [
  "FIG-ONE",
  "Figura uno",
  "FIGURE",
  "24990",
  "15000",
  "4",
  "Descripción válida",
  "",
];
const matrix = [Array.from(importHeaders), row];
describe("Administrative tool validation", () => {
  it("reads quoted CSV with separators, escaped quotes, CRLF and multiline fields", () => {
    expect(
      parseCsv('sku;nombre\r\nONE;"Figura; \"\"uno\"\"\ncon caja"\r\n'),
    ).toEqual([
      ["sku", "nombre"],
      ["ONE", 'Figura; "uno"\ncon caja'],
    ]);
    expect(() => parseCsv('sku,nombre\nONE,"sin cerrar')).toThrow();
  });
  it("rejects excessive row counts and incorrect header order", () => {
    expect(() => planImport([["name"], ["a"]], [], "CREATE")).toThrow();
    expect(() =>
      planImport(
        [...matrix, ...Array.from({ length: 100 }, () => row)],
        [],
        "CREATE",
      ),
    ).toThrow();
  });
  it("validates CLP integers, reserved stock, image URLs and SKU conflicts", () => {
    expect(planImport(matrix, [], "CREATE")[0].errors).toEqual([]);
    expect(
      planImport(
        matrix,
        [{ id: "p", sku: "fig-one" }],
        "CREATE",
      )[0].errors.join(),
    ).toContain("existente");
    expect(
      planImport([...matrix, row], [], "CREATE")[1].errors.join(),
    ).toContain("duplicado");
    expect(
      planImport(
        matrix,
        [{ id: "p", sku: "fig-one", stockReserved: 5 }],
        "UPDATE",
      )[0].errors.join(),
    ).toContain("reservado");
    for (const value of ["24.990", "-1", "1.5", ""]) {
      const cells = [...row];
      cells[3] = value;
      expect(
        planImport([matrix[0], cells], [], "CREATE")[0].errors.length,
      ).toBeGreaterThan(0);
    }
    const cells = [...row];
    cells[7] = "javascript:alert(1)";
    expect(
      planImport([matrix[0], cells], [], "CREATE")[0].errors.length,
    ).toBeGreaterThan(0);
  });
  it("does not bulk-edit preorders, bundles or ambiguous SKU duplicates", () => {
    for (const catalog of [
      [{ id: "p", sku: "FIG-ONE", isPreOrder: true }],
      [{ id: "p", sku: "FIG-ONE", type: "BUNDLE" }],
      [
        { id: "p", sku: "FIG-ONE" },
        { id: "p2", sku: "fig-one" },
      ],
    ])
      expect(
        planImport(matrix, catalog, "UPDATE")[0].errors.length,
      ).toBeGreaterThan(0);
  });
  it("checks image signatures and size instead of trusting MIME labels", () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    expect(imageMime(png)).toBe("image/png");
    expect(imageMime(new TextEncoder().encode('<svg onload="x">'))).toBeNull();
    expect(imageMime(new Uint8Array(MEDIA_MAX_BYTES + 1))).toBeNull();
  });
  it("builds a real XLSX template accepted by the bounded archive reader", async () => {
    const blob = await excelTemplate();
    const buffer = await blob.arrayBuffer();
    expect(() => validateXlsx(buffer)).not.toThrow();
    const { Workbook } = await import("exceljs");
    const book = new Workbook();
    await book.xlsx.load(buffer);
    expect(book.worksheets[0].getCell("A1").value).toBe("sku");
    expect(book.worksheets[0].getCell("D2").value).toBe(24990);
  }, 30000);
  it("rejects invalid Excel archives and supports stable hashes regardless of property ordering", () => {
    expect(() => validateXlsx(new ArrayBuffer(30))).toThrow();
    expect(digest({ b: 2, a: 1 })).toBe(digest({ a: 1, b: 2 }));
  });
  it("allows only hex color values in a storefront draft", () => {
    expect(
      HomeHeroSettingsSchema.safeParse({
        ...DEFAULT_HOME_HERO,
        primaryColor: "#abcdef",
      }).success,
    ).toBe(true);
    expect(
      HomeHeroSettingsSchema.safeParse({
        ...DEFAULT_HOME_HERO,
        primaryColor: "url(javascript:x)",
      }).success,
    ).toBe(false);
  });
  it("filters real products using available inventory and missing metadata", () => {
    const products = [
      {
        id: "p",
        sku: "FIG-ONE",
        name: "Link",
        type: "FIGURE",
        description: "",
        stockAvailable: 3,
        stockReserved: 3,
      },
    ] as ProductDomainEntity[];
    expect(
      filterAssistantProducts(products, {
        filter: "NO_STOCK",
        query: "",
        introduction: "",
      }),
    ).toHaveLength(1);
    expect(
      filterAssistantProducts(products, {
        filter: "NO_MANUFACTURER",
        query: "",
        introduction: "",
      }),
    ).toHaveLength(1);
    expect(
      filterAssistantProducts(products, {
        filter: "ALL",
        query: "Mario",
        introduction: "",
      }),
    ).toHaveLength(0);
  });
  it("wraps social card names into readable lines", () => {
    expect(
      wrapCanvasText(
        { measureText: (text) => ({ width: text.length * 10 }) as TextMetrics },
        "Figura Link Deluxe",
        110,
      ),
    ).toEqual(["Figura Link", "Deluxe"]);
  });
});
