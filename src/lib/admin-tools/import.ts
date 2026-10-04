import { z } from "zod";
export const importHeaders = [
  "sku",
  "nombre",
  "tipo",
  "precio",
  "costo",
  "stock",
  "descripcion",
  "imagen",
] as const;
export const imageUrl = z
  .string()
  .max(1500)
  .refine(
    (value) =>
      !value ||
      (/^\/(?!\/)/.test(value) && !value.includes("\\")) ||
      (() => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" && !url.username && !url.password;
        } catch {
          return false;
        }
      })(),
    "La imagen debe ser HTTPS o una ruta local.",
  );
export const importProduct = z.object({
  sku: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().min(5).max(2000),
  type: z.enum([
    "FIGURE",
    "VIDEO_GAME",
    "COLLECTIBLE",
    "CONSOLE",
    "HARDWARE",
    "OTHER",
  ]),
  price: z.number().int().positive().max(100000000),
  costPrice: z.number().int().nonnegative().max(100000000),
  stockAvailable: z.number().int().nonnegative().max(1000000),
  image: imageUrl,
});
export type ImportProduct = z.infer<typeof importProduct>;
export type ImportRow = {
  row: number;
  product: ImportProduct | null;
  errors: string[];
  targetId: string | null;
  operation: "CREATE" | "UPDATE";
};
export type ImportCatalog = {
  id: string;
  sku: string;
  stockReserved?: number;
  isPreOrder?: boolean;
  type?: string;
};
export function planImport(
  matrix: string[][],
  catalog: ImportCatalog[],
  mode: "CREATE" | "UPDATE",
): ImportRow[] {
  if (
    matrix.length < 2 ||
    matrix.length > 101 ||
    matrix.some((row) => row.length !== 8)
  )
    throw new Error("Usa la plantilla de ocho columnas y hasta 100 productos.");
  const headers = matrix[0].map((value) =>
    value
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase(),
  );
  if (headers.join(",") !== importHeaders.join(","))
    throw new Error("Las columnas deben seguir el orden de la plantilla.");
  const seen = new Set<string>();
  const existing = new Map<string, ImportCatalog[]>();
  for (const product of catalog)
    existing.set(product.sku.toUpperCase(), [
      ...(existing.get(product.sku.toUpperCase()) || []),
      product,
    ]);
  return matrix.slice(1).map((cells, index) => {
    const [sku, name, type, price, cost, stock, description, image] = cells.map(
      (value) => value.trim(),
    );
    const integer = (value: string) =>
      /^\d+$/.test(value) ? Number(value) : NaN;
    const parsed = importProduct.safeParse({
      sku,
      name,
      type: type.toUpperCase(),
      price: integer(price),
      costPrice: integer(cost),
      stockAvailable: integer(stock),
      description,
      image,
    });
    const key = sku.toUpperCase();
    const matches = existing.get(key) || [];
    const errors = parsed.success
      ? []
      : parsed.error.issues.map(
          (issue) => issue.path.join(".") + ": " + issue.message,
        );
    if (seen.has(key)) errors.push("SKU duplicado dentro del archivo.");
    seen.add(key);
    if (mode === "CREATE" && matches.length)
      errors.push("SKU existente: usa actualizar o cambia el SKU.");
    if (mode === "UPDATE" && matches.length !== 1)
      errors.push("El SKU debe identificar exactamente un producto existente.");
    const target = matches.length === 1 ? matches[0] : null;
    if (mode === "UPDATE" && (target?.isPreOrder || target?.type === "BUNDLE"))
      errors.push("Edita preventas y packs desde su editor especializado.");
    if (
      parsed.success &&
      parsed.data.stockAvailable < (target?.stockReserved || 0)
    )
      errors.push("El stock no puede ser menor al reservado.");
    return {
      row: index + 2,
      product: parsed.success ? parsed.data : null,
      errors,
      targetId: mode === "UPDATE" ? target?.id || null : null,
      operation: mode,
    };
  });
}
/** RFC-style quoted fields, CRLF, multiline cells and comma/semicolon delimiters. */
export function parseCsv(text: string): string[][] {
  if (text.length > 2 * 1024 * 1024)
    throw new Error("Archivo demasiado grande.");
  const first = text.split(/\r?\n/, 1)[0];
  const delimiter = first.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (!field || quoted) quoted = !quoted;
      else throw new Error("Comillas CSV inválidas.");
    } else if (!quoted && char === delimiter) {
      row.push(field);
      field = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      if (rows.length > 101) throw new Error("Máximo 100 productos.");
    } else field += char;
  }
  if (quoted) throw new Error("Celda con comillas sin cerrar.");
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
