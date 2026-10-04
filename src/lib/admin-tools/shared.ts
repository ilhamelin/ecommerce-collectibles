import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import type { Firestore } from "firebase-admin/firestore";
export class ToolError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export function adminTool(
  handler: (
    request: NextRequest,
    db: Firestore,
    actor: string,
  ) => Promise<Response>,
) {
  return async (request: NextRequest) => {
    try {
      const auth = await verifyAdminAuthorization(request);
      if (!auth.authorized)
        return json(
          { success: false, error: "Sesión administrativa requerida." },
          403,
        );
      if (!adminDb)
        return json(
          {
            success: false,
            error:
              "Firebase Admin no está disponible. No se guardó ningún cambio.",
          },
          503,
        );
      return await handler(
        request,
        adminDb,
        auth.actor || "Administrador autenticado",
      );
    } catch (error) {
      if (error instanceof ToolError)
        return json({ success: false, error: error.message }, error.status);
      console.error("[Admin tools] Operación fallida", {
        type: error instanceof Error ? error.name : "Unknown",
      });
      return json(
        {
          success: false,
          error: "No se pudo completar la operación. Reintenta.",
        },
        503,
      );
    }
  };
}
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stable(item)]),
    );
  return value;
}
export const digest = (value: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
