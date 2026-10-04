import { z } from "zod";
import { adminTool, json, ToolError } from "@/lib/admin-tools/shared";
import { parseGoogleSheetLink } from "@/lib/admin-tools/googleSheets";
import {
  sheetsConfiguration,
  inspectGoogleSheet,
  readGoogleSheet,
} from "@/lib/admin-tools/googleSheets.server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = adminTool(async () =>
  json({ success: true, data: sheetsConfiguration() }),
);
const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("inspect"),
      url: z.string().trim().min(1).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("read"),
      url: z.string().trim().min(1).max(1000),
      sheetId: z.number().int().nonnegative().max(2147483647),
    })
    .strict(),
]);
export const POST = adminTool(async (request) => {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    throw new ToolError("Revisa el enlace y la pestaña seleccionada.");
  try {
    parseGoogleSheetLink(parsed.data.url);
  } catch (error) {
    throw new ToolError(
      error instanceof Error
        ? error.message
        : "Enlace de Google Sheets inválido.",
    );
  }
  const data =
    parsed.data.action === "inspect"
      ? await inspectGoogleSheet(parsed.data.url)
      : await readGoogleSheet(parsed.data.url, parsed.data.sheetId);
  return json({ success: true, data });
});
