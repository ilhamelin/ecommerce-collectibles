import { z } from "zod";

export type GoogleSheetDocument = {
  title: string;
  spreadsheetId: string;
  sheets: {
    id: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
  selectedSheetId: number;
};
/** Accept only native Google Sheets URLs. Never fetch a caller-provided host. */
export function parseGoogleSheetLink(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Pega el enlace completo de tu hoja de Google Sheets.");
  }
  const match = url.pathname.match(
    /^\/spreadsheets\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{15,150})(?:\/.*)?$/,
  );
  if (
    url.protocol !== "https:" ||
    url.hostname !== "docs.google.com" ||
    url.port ||
    url.username ||
    url.password ||
    !match
  )
    throw new Error(
      "Usa un enlace https://docs.google.com/spreadsheets/d/… de Google Sheets.",
    );
  const rawGid =
    new URLSearchParams(url.hash.slice(1)).get("gid") ||
    url.searchParams.get("gid");
  if (rawGid && !/^\d{1,10}$/.test(rawGid))
    throw new Error("El identificador de pestaña del enlace no es válido.");
  const sheetId = rawGid ? Number(rawGid) : undefined;
  if (sheetId !== undefined && sheetId > 2147483647)
    throw new Error("El identificador de pestaña no es válido.");
  return { spreadsheetId: match[1], sheetId };
}
const cell = z.union([
  z.string().max(2000),
  z.number().finite(),
  z.literal(null),
]);
/** Google omits empty trailing cells; pad to the same eight-column import contract. */
export function googleValuesToMatrix(raw: unknown): string[][] {
  if (
    raw &&
    typeof raw === "object" &&
    "values" in raw &&
    Array.isArray(raw.values) &&
    raw.values.length > 102
  )
    throw new Error(
      "La pestaña supera 100 productos. Divide los datos en pestañas más pequeñas.",
    );
  const parsed = z
    .object({ values: z.array(z.array(cell).max(9)).max(102).default([]) })
    .safeParse(raw);
  if (!parsed.success)
    throw new Error(
      "La hoja contiene valores no admitidos o celdas demasiado largas.",
    );
  const rows = parsed.data.values;
  while (
    rows.length &&
    rows[rows.length - 1].every((value) => value === null || value === "")
  )
    rows.pop();
  if (rows.length < 2)
    throw new Error("La pestaña necesita encabezados y al menos un producto.");
  if (rows.length > 101)
    throw new Error(
      "La pestaña supera 100 productos. Divide los datos en pestañas más pequeñas.",
    );
  if (
    rows.some((row) => row[8] !== undefined && row[8] !== null && row[8] !== "")
  )
    throw new Error(
      "Usa las ocho columnas A:H de la plantilla; la columna I debe estar vacía.",
    );
  return rows.map((row) =>
    Array.from({ length: 8 }, (_, index) => String(row[index] ?? "")),
  );
}
