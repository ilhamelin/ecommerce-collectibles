import { matchWantedPieces } from "@/lib/collector/matches";
import { parseCollectorEntries } from "@/lib/collector/schema";
import { createHash } from "node:crypto";
import { z } from "zod";
export type CustomerNotification = { id: string; kind: "ORDER" | "PREORDER" | "STOCK" | "PRICE" | "WANTED"; title: string; message: string; href: string; at: string; read: boolean };
const text = z.string();
const order = z.object({ id: text, orderNumber: text.optional(), status: text, paymentStatus: text.optional(), createdAt: text, updatedAt: text.optional(), remainingBalanceLater: z.number().optional(), preOrderWarehouseArrivalNotified: z.boolean().optional(), shippingMethod: z.object({ trackingNumber: text.optional() }).passthrough().optional() }).passthrough();
const alert = z.object({ id: text, productId: text, productSku: text.optional(), productName: text, productPrice: z.number(), alertType: z.enum(["STOCK_AVAILABLE", "PRICE_DROP", "BOTH"]), isOutOfStock: z.boolean(), active: z.boolean(), isDeleted: z.boolean().optional(), createdAt: text }).passthrough();
const product = z.object({ id: text, sku: text, name: text, price: z.number(), stockAvailable: z.number(), stockReserved: z.number().optional(), calculatedAvailableStock: z.number().optional(), isPreOrder: z.boolean().optional(), updatedAt: text.optional() }).passthrough();
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
export const notificationOwnerKey = (identity: { uid: string; email: string }) => digest(identity.uid ? "uid:" + identity.uid : "email:" + identity.email);
/** Current-state notices, not a fabricated historical event log. Stable IDs preserve read state. */
export function buildNotifications(orders: unknown[], alerts: unknown[], products: unknown[], readIds: string[], collectorEntries: unknown = []): CustomerNotification[] {
  const notices: CustomerNotification[] = []; const read = new Set(readIds);
  const push = (key: string, value: Omit<CustomerNotification, "id" | "read">) => { const id = digest(key); notices.push({ ...value, id, read: read.has(id) }); };
  const states: Record<string, string> = { PENDING: "Pedido recibido", CONFIRMED: "Pedido confirmado", PAID: "Pedido pagado", PREPARING: "Preparando tu pedido", DISPATCHED: "Tu pedido está en camino", DELIVERED: "Pedido entregado", CANCELLED: "Pedido cancelado" };
  for (const raw of orders) {
    const parsed = order.safeParse(raw); if (!parsed.success) continue; const o = parsed.data;
    push([o.id, o.status, o.paymentStatus, o.shippingMethod?.trackingNumber].join(":"), { kind: "ORDER", title: states[o.status] || "Estado de tu pedido", message: `${o.orderNumber || o.id}: ${o.status}${o.shippingMethod?.trackingNumber ? " · Seguimiento " + o.shippingMethod.trackingNumber : ""}`, href: "/order-confirmation/" + encodeURIComponent(o.id), at: o.updatedAt || o.createdAt });
    if (o.preOrderWarehouseArrivalNotified && (o.remainingBalanceLater || 0) > 0 && o.status !== "CANCELLED") push(o.id + ":warehouse:" + o.remainingBalanceLater, { kind: "PREORDER", title: "Tu preventa llegó a bodega", message: "Revisa el saldo pendiente y las instrucciones de tu pedido.", href: "/order-confirmation/" + encodeURIComponent(o.id), at: o.updatedAt || o.createdAt });
  }
  const byId = new Map<string, z.infer<typeof product>>(); const bySku = new Map<string, z.infer<typeof product>>();
  for (const raw of products) { const p = product.safeParse(raw); if (p.success) { byId.set(p.data.id, p.data); bySku.set(p.data.sku.toLowerCase(), p.data); } }
  for (const raw of alerts) {
    const parsed = alert.safeParse(raw); if (!parsed.success || (!parsed.data.active || parsed.data.isDeleted)) continue; const a = parsed.data;
    const p = byId.get(a.productId) || bySku.get((a.productSku || a.productId).toLowerCase()); if (!p) continue;
    const base = { href: "/product/" + encodeURIComponent(p.sku), at: p.updatedAt || a.createdAt };
    if (a.isOutOfStock && (p.calculatedAvailableStock ?? p.stockAvailable - (p.stockReserved || 0)) > 0 && !p.isPreOrder && a.alertType !== "PRICE_DROP") push(a.id + ":stock", { ...base, kind: "STOCK", title: "Disponible en stock", message: p.name + " tiene unidades disponibles." });
    if (p.price < a.productPrice && a.alertType !== "STOCK_AVAILABLE") push(a.id + ":price:" + p.price, { ...base, kind: "PRICE", title: "Bajó el precio", message: p.name + ": $" + p.price.toLocaleString("es-CL") + " CLP, menor que cuando te suscribiste." });
  }
  const wanted = parseCollectorEntries(collectorEntries).filter(entry => entry.kind === "WANTED");
  const matches = matchWantedPieces(wanted, products);
  for (const entry of wanted) {
    const available = matches[entry.id];
    if (!available?.length) continue;
    push("wanted:" + entry.id + ":" + available.map(item => item.id).sort().join(","), {
      kind: "WANTED", title: "Una pieza que buscas tiene sugerencias",
      message: entry.title + " · " + available.length + " producto(s) disponible(s). Comprueba la edición en el catálogo.",
      href: "/account?tab=wanted", at: available[0].updatedAt,
    });
  }
  return Array.from(new Map(notices.map(item => [item.id, item])).values()).sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0)).slice(0, 100);
}
