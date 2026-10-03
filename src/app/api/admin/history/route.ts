import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { readAiProtectionStatus } from "@/lib/services/aiProtection";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!(await verifyAdminAuthorization(request)).authorized) return NextResponse.json({ success: false }, { status: 403 });
  if (!adminDb) return NextResponse.json({ success: false, error: "Firebase Admin es necesario para consultar el historial persistente." }, { status: 503 });
  try {
    const [audit, protection] = await Promise.all([adminDb.collection("admin_audit").orderBy("at", "desc").limit(50).get(), readAiProtectionStatus()]);
    return NextResponse.json({ success: true, data: { audit: audit.docs.map(doc => ({ ...doc.data(), id: doc.id })), protection } }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ success: false, error: "No se pudo consultar el historial." }, { status: 503 }); }
}
