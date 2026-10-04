import { JWT } from "google-auth-library";
import { z } from "zod";
import { normalizeFirebasePrivateKey } from "@/lib/firebase/adminCredentials";
import { ToolError } from "./shared";
import {
  parseGoogleSheetLink,
  googleValuesToMatrix,
  type GoogleSheetDocument,
} from "./googleSheets";

const MAX_RESPONSE = 2 * 1024 * 1024;
const metadataSchema = z.object({
  spreadsheetId: z.string(),
  properties: z.object({ title: z.string().max(500) }),
  sheets: z
    .array(
      z.object({
        properties: z.object({
          sheetId: z.number().int().nonnegative().max(2147483647),
          title: z.string().min(1).max(100),
          sheetType: z.string().optional(),
          gridProperties: z
            .object({
              rowCount: z.number().int().positive(),
              columnCount: z.number().int().positive(),
            })
            .optional(),
        }),
      }),
    )
    .min(1)
    .max(200),
});
let cachedAuth: { email: string; key: string; client: JWT } | undefined;
export function sheetsConfiguration() {
  const serviceEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() || "";
  return {
    serviceEmail,
    configured: Boolean(
      serviceEmail && process.env.FIREBASE_PRIVATE_KEY?.trim(),
    ),
  };
}
async function accessToken() {
  const email = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!email || !rawKey)
    throw new ToolError(
      "Configura las credenciales Firebase del servidor para leer Google Sheets.",
      503,
    );
  const key = normalizeFirebasePrivateKey(rawKey);
  if (!cachedAuth || cachedAuth.email !== email || cachedAuth.key !== key)
    cachedAuth = {
      email,
      key,
      client: new JWT({
        email,
        key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        transporterOptions: { timeout: 10000, retry: false },
      }),
    };
  try {
    const result = await cachedAuth.client.getAccessToken();
    if (!result.token) throw new Error("Missing token");
    return result.token;
  } catch {
    throw new ToolError(
      "No se pudo autenticar la cuenta de servicio de Google. Revisa las credenciales del servidor.",
      503,
    );
  }
}
/** Fixed Google endpoint, bounded streaming response, no redirects or provider error leakage. */
async function sheetsGet(path: string, query: URLSearchParams) {
  const token = await accessToken();
  let response: Response;
  try {
    response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${path}?${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    throw new ToolError("Google Sheets no respondió a tiempo. Reintenta.", 503);
  }
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 403)
      throw new ToolError(
        "Google rechazó el acceso. Habilita Google Sheets API en el proyecto de la cuenta de servicio y comparte la hoja con ella como lector.",
        403,
      );
    if (response.status === 404)
      throw new ToolError(
        "No se encontró la hoja o no está compartida con la cuenta de servicio.",
        404,
      );
    if (response.status === 429)
      throw new ToolError(
        "Google Sheets alcanzó su límite temporal. Reintenta más tarde.",
        429,
      );
    throw new ToolError(
      "Google Sheets no pudo leer esa pestaña. Revisa el enlace y vuelve a conectar la hoja.",
      response.status === 400 ? 400 : 503,
    );
  }
  const reader = response.body?.getReader();
  if (!reader) throw new ToolError("Google devolvió una respuesta vacía.", 503);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > MAX_RESPONSE) {
        await reader.cancel();
        throw new ToolError(
          "Los datos de la hoja superan 2 MiB. Reduce las descripciones.",
          413,
        );
      }
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof ToolError) throw error;
    throw new ToolError(
      "Google devolvió datos inválidos o incompletos. Reintenta.",
      503,
    );
  } finally {
    reader.releaseLock();
  }
}
export async function inspectGoogleSheet(
  link: string,
): Promise<GoogleSheetDocument> {
  const { spreadsheetId, sheetId } = parseGoogleSheetLink(link);
  const raw = await sheetsGet(
    spreadsheetId,
    new URLSearchParams({
      fields:
        "spreadsheetId,properties(title),sheets(properties(sheetId,title,sheetType,gridProperties(rowCount,columnCount)))",
    }),
  );
  const parsed = metadataSchema.safeParse(raw);
  if (!parsed.success || parsed.data.spreadsheetId !== spreadsheetId)
    throw new ToolError("Google devolvió una hoja no compatible.", 503);
  const sheets = parsed.data.sheets
    .filter(
      (sheet) =>
        !sheet.properties.sheetType || sheet.properties.sheetType === "GRID",
    )
    .map((sheet) => ({
      id: sheet.properties.sheetId,
      title: sheet.properties.title,
      ...(sheet.properties.gridProperties || {}),
    }));
  if (!sheets.length)
    throw new ToolError("La hoja no contiene pestañas de celdas compatibles.");
  return {
    spreadsheetId,
    title: parsed.data.properties.title,
    sheets,
    selectedSheetId: sheets.some((sheet) => sheet.id === sheetId)
      ? sheetId!
      : sheets[0].id,
  };
}
export async function readGoogleSheet(link: string, sheetId: number) {
  const document = await inspectGoogleSheet(link);
  const sheet = document.sheets.find((sheet) => sheet.id === sheetId);
  if (!sheet)
    throw new ToolError(
      "La pestaña cambió o fue eliminada. Vuelve a conectar la hoja.",
      409,
    );
  const lastColumn = String.fromCharCode(
    64 + Math.min(sheet.columnCount || 9, 9),
  );
  const range = "'" + sheet.title.replace(/'/g, "''") + "'!A:" + lastColumn;
  const raw = await sheetsGet(
    document.spreadsheetId + "/values/" + encodeURIComponent(range),
    new URLSearchParams({
      majorDimension: "ROWS",
      valueRenderOption: "UNFORMATTED_VALUE",
    }),
  );
  try {
    return {
      matrix: googleValuesToMatrix(raw),
      source: { title: document.title, sheet: sheet.title },
    };
  } catch (error) {
    throw new ToolError(
      error instanceof Error ? error.message : "Datos de hoja inválidos.",
    );
  }
}
