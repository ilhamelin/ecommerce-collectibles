import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { getSystemHealth } from "@/lib/services/systemHealth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!(await verifyAdminAuthorization(request)).authorized) return NextResponse.json({ success: false, error: "Sesión administrativa requerida." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try { return NextResponse.json({ success: true, data: await getSystemHealth() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ success: false, error: "No se pudo comprobar la salud del sistema." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
