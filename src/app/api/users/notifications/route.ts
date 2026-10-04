import { collectorOwnerKey } from "@/lib/collector/storage";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requestIdentity } from "@/lib/auth/requestIdentity";
import { buildNotifications, notificationOwnerKey } from "@/lib/services/customerNotifications";
export const dynamic = "force-dynamic";
const input = z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(100) }).strict();
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
async function handle(request: NextRequest, mark: boolean) {
  const identity = await requestIdentity(request);
  if (!identity) return respond({ success: false, error: "Inicia sesión para consultar tus notificaciones." }, 401);
  if (!identity.email) return respond({ success: false, error: "Verifica tu correo para consultar las notificaciones." }, 403);
  if (!adminDb) return respond({ success: false, error: "Las notificaciones no están disponibles temporalmente." }, 503);
  try {
    const ref = adminDb.collection("notification_reads").doc(notificationOwnerKey(identity));
    const [orders, alerts, products, reads, collector] = await Promise.all([
      adminDb.collection("orders").where("customer.email", "==", identity.email).limit(200).get(),
      adminDb.collection("product_alerts").where("email", "==", identity.email).limit(200).get(),
      adminDb.collection("products").get(), ref.get(),
      adminDb.collection("collector_profiles").doc(collectorOwnerKey(identity)).get(),
    ]);
    const parseRead = (value: unknown) => z.array(z.string()).safeParse(value);
    const prior = parseRead(reads.data()?.ids); let ids = prior.success ? prior.data : [];
    const feed = () => buildNotifications(orders.docs.map(doc => ({ ...doc.data(), id: doc.id })), alerts.docs.map(doc => ({ ...doc.data(), id: doc.id })), products.docs.map(doc => ({ ...doc.data(), id: doc.id })), ids, collector.data()?.entries);
    if (mark) {
      const parsed = input.safeParse(await request.json().catch(() => null)); if (!parsed.success) return respond({ success: false, error: "Selecciona notificaciones válidas." }, 400);
      const allowed = new Set(feed().map(item => item.id));
      if (parsed.data.ids.some(id => !allowed.has(id))) return respond({ success: false, error: "Notificación no disponible en tu cuenta." }, 403);
      ids = await adminDb.runTransaction(async tx => {
        const snap = await tx.get(ref); const previous = parseRead(snap.data()?.ids);
        const merged = Array.from(new Set([...(previous.success ? previous.data : []), ...parsed.data.ids])).slice(-500);
        tx.set(ref, { ids: merged, updatedAt: new Date().toISOString() }); return merged;
      });
    }
    const items = feed(); return respond({ success: true, data: { items, unread: items.filter(item => !item.read).length, checkedAt: new Date().toISOString() } });
  } catch { return respond({ success: false, error: "No se pudieron cargar o guardar las notificaciones. Reintenta." }, 503); }
}
export const GET = (request: NextRequest) => handle(request, false);
export const PATCH = (request: NextRequest) => handle(request, true);
