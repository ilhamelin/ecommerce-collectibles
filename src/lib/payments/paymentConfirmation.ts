import { createHash } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { invalidateProductsCache } from "@/lib/firebase/firestore";
import { planStockChanges, type CommerceTransaction } from "@/lib/firebase/commerce";
import type { ConfirmedOrderEntity } from "@/lib/types/domain";
export type VerifiedPayment = { provider: "MERCADO_PAGO" | "FLOW"; id: string; reference: string; amount: number; currency: string; approved: boolean; live: boolean };
export class PaymentConfirmationError extends Error { constructor(message: string, public status = 409) { super(message); } }
export function paymentReference(reference: string) {
  const balance = reference.endsWith("~balance"); const orderId = balance ? reference.slice(0, -8) : reference;
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(orderId)) throw new PaymentConfirmationError("Referencia de pedido inválida.", 400);
  return { orderId, purpose: balance ? "BALANCE" as const : "CHECKOUT" as const };
}
/** All reads precede writes. Receipt, order and any legacy stock movement commit together. */
export async function confirmPaymentTransaction(tx: CommerceTransaction, payment: VerifiedPayment) {
  if (!payment.approved || payment.currency !== "CLP" || !payment.id || !Number.isSafeInteger(payment.amount) || payment.amount <= 0) throw new PaymentConfirmationError("El proveedor no confirmó un pago válido.");
  const { orderId, purpose } = paymentReference(payment.reference);
  const receiptPath = "payment_confirmations/" + createHash("sha256").update(payment.provider + ":" + payment.id).digest("hex");
  const [raw, receipt] = await Promise.all([tx.read("orders/" + orderId), tx.read(receiptPath)]);
  if (!raw) throw new PaymentConfirmationError("Pedido no encontrado.", 404);
  const order = raw as unknown as ConfirmedOrderEntity;
  if (order.status === "CANCELLED") throw new PaymentConfirmationError("El pedido está cancelado; requiere revisión del pago.");
  if (receipt) {
    if (receipt.orderId !== orderId || receipt.purpose !== purpose || receipt.amount !== payment.amount) throw new PaymentConfirmationError("El pago ya se asignó a otra operación.");
    return { order, idempotent: true };
  }
  const gateway = purpose === "BALANCE" ? order.balanceCheckoutGateway : order.checkoutGateway;
  const expectedMethod = purpose === "BALANCE" ? gateway?.gatewayName : order.paymentMethod;
  if (expectedMethod !== (payment.provider === "FLOW" ? "WEBPAY" : "MERCADO_PAGO") && !(payment.provider === "FLOW" && expectedMethod === "FLOW")) throw new PaymentConfirmationError("El pago no corresponde a la pasarela del pedido.");
  const liveExpected = gateway ? gateway.mode === "LIVE" : payment.provider === "FLOW" ? process.env.FLOW_SANDBOX_MODE === "false" : process.env.MERCADOPAGO_SANDBOX_MODE === "false" && !process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST-");
  if (payment.live !== liveExpected) throw new PaymentConfirmationError("El entorno del pago no corresponde al pedido.");
  if (gateway?.mode === "SIMULATED" || gateway?.mode === "LIVE" && !payment.live || gateway?.mode === "SANDBOX" && payment.live) throw new PaymentConfirmationError("El entorno del pago no corresponde al pedido.");
  if (payment.provider === "FLOW" && gateway?.providerPaymentId && gateway.providerPaymentId !== payment.id) throw new PaymentConfirmationError("La orden de Flow no corresponde al pedido.");
  const expectedAmount = purpose === "BALANCE" ? Math.round(order.remainingBalanceLater) : Math.round(order.totalChargedNow);
  if (payment.amount !== expectedAmount) throw new PaymentConfirmationError("El importe confirmado no coincide con el pedido.");
  if (purpose === "BALANCE" && (order.paymentStatus !== "PAID" || order.balancePaid || expectedAmount <= 0)) throw new PaymentConfirmationError("El saldo no está disponible para liquidación.");
  if (purpose === "CHECKOUT" && order.paymentStatus === "PAID") {
    if (order.paymentId !== payment.id) throw new PaymentConfirmationError("El pedido ya tiene un pago; revisa la operación duplicada.");
    tx.set(receiptPath, { provider: payment.provider, paymentId: payment.id, orderId, purpose, amount: payment.amount, currency: payment.currency, live: payment.live, confirmedAt: new Date().toISOString() });
    return { order, idempotent: true };
  }
  const changes = purpose === "CHECKOUT" && !order.stockDeducted ? await planStockChanges(tx, order.items, -1) : [];
  const now = new Date().toISOString();
  const updates = purpose === "BALANCE" ? { remainingBalanceLater: 0, balancePaid: true, balancePaidAt: now, balancePaymentTransactionId: payment.id, updatedAt: now } : { paymentStatus: "PAID", paymentId: payment.id, stockDeducted: true, status: "CONFIRMED" as const, updatedAt: now };
  for (const change of changes) tx.update(change.path, change.data);
  tx.update("orders/" + orderId, updates);
  tx.set(receiptPath, { provider: payment.provider, paymentId: payment.id, orderId, purpose, amount: payment.amount, currency: payment.currency, live: payment.live, confirmedAt: now });
  return { order: { ...order, ...updates }, idempotent: false };
}
/** Real confirmations require server persistence; no in-memory success fallback. */
export async function confirmVerifiedPayment(payment: VerifiedPayment) {
  if (!adminDb) throw new PaymentConfirmationError("La confirmación persistente no está disponible. Se reintentará.", 503);
  const database = adminDb;
  const result = await database.runTransaction(transaction => confirmPaymentTransaction({
    read: async path => { const snap = await transaction.get(database.doc(path)); return snap.exists ? snap.data() || null : null; },
    set: (path, data) => { transaction.set(database.doc(path), data); },
    update: (path, data) => { transaction.update(database.doc(path), data); },
    delete: path => { transaction.delete(database.doc(path)); },
  }, payment));
  invalidateProductsCache(); return result;
}
