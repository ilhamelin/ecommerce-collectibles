import { importHeaders, parseCsv } from "./import";
/** Bound ZIP inflation before handing an XLSX archive to ExcelJS. ZIP64/macros are rejected. */
export function validateXlsx(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  let end = -1;
  for (
    let index = bytes.byteLength - 22;
    index >= Math.max(0, bytes.byteLength - 65557);
    index--
  )
    if (view.getUint32(index, true) === 0x06054b50) {
      end = index;
      break;
    }
  if (end < 0) throw new Error("Excel inválido o cifrado.");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  let total = 0;
  if (count > 200 || count === 65535)
    throw new Error("El archivo tiene demasiadas entradas.");
  for (let index = 0; index < count; index++) {
    if (
      offset + 46 > bytes.byteLength ||
      view.getUint32(offset, true) !== 0x02014b50
    )
      throw new Error("Archivo Excel inválido.");
    total += view.getUint32(offset + 24, true);
    const size = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(
      new Uint8Array(bytes, offset + 46, size),
    );
    if (total > 8 * 1024 * 1024 || /vba|\.bin$/i.test(name))
      throw new Error("Excel demasiado grande o con macros.");
    offset +=
      46 +
      size +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
}
export async function readImportFile(file: File): Promise<string[][]> {
  if (file.size > 2 * 1024 * 1024) throw new Error("Máximo 2 MB por archivo.");
  if (file.name.toLowerCase().endsWith(".csv"))
    return parseCsv(await file.text());
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    throw new Error("Usa CSV o XLSX; XLS y macros no están soportados.");
  const bytes = await file.arrayBuffer();
  validateXlsx(bytes);
  const ExcelJS = await import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(bytes);
  if (book.worksheets.length !== 1 || book.worksheets[0].rowCount > 101)
    throw new Error("Usa una sola hoja y hasta 100 productos.");
  const matrix: string[][] = [];
  book.worksheets[0].eachRow((row) => {
    const cells: string[] = [];
    for (let index = 1; index <= 8; index++) {
      const value = row.getCell(index).value;
      if (
        value !== null &&
        typeof value !== "string" &&
        typeof value !== "number"
      )
        throw new Error(
          "No se admiten fórmulas, enlaces o celdas complejas. Pega valores.",
        );
      cells.push(value === null ? "" : String(value));
    }
    if (row.cellCount > 8)
      throw new Error("Usa las ocho columnas de la plantilla.");
    matrix.push(cells);
  });
  return matrix;
}
export async function excelTemplate(): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Productos");
  sheet.addRow([...importHeaders]);
  sheet.addRow([
    "FIG-EJEMPLO",
    "Figura de ejemplo",
    "FIGURE",
    24990,
    15000,
    5,
    "Descripción de ejemplo para reemplazar.",
    "",
  ]);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F3A5F" },
  };
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  sheet.getColumn(7).width = 55;
  const bytes = await book.xlsx.writeBuffer();
  return new Blob([new Uint8Array(bytes)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
