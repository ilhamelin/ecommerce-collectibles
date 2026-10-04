import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canReadOrder } from "@/lib/auth/orderAccess";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { afterShipService } from "@/lib/services/aftershipService";
import { getOrderByIdFromFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { formatTrackingNumber } from "@/lib/tracking/chilean-couriers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
 try {
  const rawId = params.id?.trim(); if (!rawId || rawId.length > 150) return NextResponse.json({ success: false, error: "Identificador inválido." }, { status: 400 });
  const order = await getOrderByIdFromFirestore(rawId) || MemoryTransactionalStore.getInstance().orders.get(rawId);
  if (order ? !await canReadOrder(req, order) : !(await verifyAdminAuthorization(req)).authorized) return NextResponse.json({ success: false, error: "No tienes acceso a este seguimiento." }, { status: 403 });
  const resolvedOT = order ? formatTrackingNumber(order.shippingMethod?.trackingNumber, order.orderNumber || order.id) : rawId;
  const courier = order?.shippingMethod?.name || "Starken";
  const result = await afterShipService.getTracking(resolvedOT, courier);
  return NextResponse.json({ success: true, data: { ...result, orderNumber: order?.orderNumber || rawId, orderId: order?.id || rawId } }, { headers: { "Cache-Control": "private, no-store" } });
 } catch { return NextResponse.json({ success: false, error: "No se pudo consultar el seguimiento." }, { status: 503 }); }
}
const registration = z.object({ trackingNumber: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(), courierSlug: z.string().regex(/^[a-z0-9-]{1,80}$/).default("starken"), orderId: z.string().max(150).optional() }).strict();
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
 if (!(await verifyAdminAuthorization(req)).authorized) return NextResponse.json({ success: false, error: "Sesión administrativa requerida." }, { status: 403 });
 try {
  const parsed = registration.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ success: false, error: "Datos de seguimiento inválidos." }, { status: 400 });
  const created = await afterShipService.createTracking(parsed.data.trackingNumber || params.id, parsed.data.courierSlug, parsed.data.orderId || params.id);
  return NextResponse.json({ success: true, registeredInAfterShip: created, message: created ? "Seguimiento registrado." : "Registro no confirmado en AfterShip." });
 } catch { return NextResponse.json({ success: false, error: "No se pudo registrar el seguimiento." }, { status: 503 }); }
}
