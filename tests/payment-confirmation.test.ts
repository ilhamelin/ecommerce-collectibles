import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null }));
vi.mock("@/lib/firebase/firestore", () => ({ invalidateProductsCache: vi.fn() }));
import { confirmPaymentTransaction, confirmVerifiedPayment, type VerifiedPayment } from "@/lib/payments/paymentConfirmation";
import type { CommerceTransaction } from "@/lib/firebase/commerce";
const payment: VerifiedPayment = { provider: "MERCADO_PAGO", id: "123", reference: "ord-one", amount: 100, currency: "CLP", approved: true, live: false };
const order = { id: "ord-one", orderNumber: "ORD-ONE", status: "PENDING", paymentMethod: "MERCADO_PAGO", paymentStatus: "PENDING", stockDeducted: false, totalChargedNow: 100, remainingBalanceLater: 200, items: [{ productId: "one", quantity: 2 }], checkoutGateway: { gatewayName: "MERCADO_PAGO", mode: "SANDBOX" } };
function database(override: Record<string, unknown> = {}) {
 let data: Record<string, Record<string, unknown>> = { "orders/ord-one": { ...order, ...override }, "products/one": { stockAvailable: 5 } };
 return { get: (path: string) => data[path], async run(p: VerifiedPayment) {
  const draft = structuredClone(data); let writing = false;
  const tx: CommerceTransaction = { read: async path => { if (writing) throw new Error("Read after write"); return draft[path] || null; }, update: (path, change) => { writing = true; draft[path] = { ...draft[path], ...change }; }, set: (path, value) => { writing = true; draft[path] = value; }, delete: path => { writing = true; delete draft[path]; } };
  const result = await confirmPaymentTransaction(tx, p); data = draft; return result;
 } };
}
describe("Atomic provider payment confirmation", () => {
 it("commits legacy stock and payment once and deduplicates repeated notifications", async () => {
  const db = database(); expect((await db.run(payment)).idempotent).toBe(false); expect(db.get("products/one").stockAvailable).toBe(3); expect(db.get("orders/ord-one").paymentStatus).toBe("PAID");
  expect((await db.run(payment)).idempotent).toBe(true); expect(db.get("products/one").stockAvailable).toBe(3);
 });
 it("does not deduct stock already reserved by checkout", async () => { const db = database({ stockDeducted: true }); await db.run(payment); expect(db.get("products/one").stockAvailable).toBe(5); });
 it.each([{ amount: 99 }, { currency: "USD" }, { approved: false }, { live: true }, { provider: "FLOW" as const }, { reference: "../bad" }])("rejects unverified or mismatched evidence %j without writes", async change => {
  const db = database(); await expect(db.run({ ...payment, ...change })).rejects.toThrow(); expect(db.get("orders/ord-one").paymentStatus).toBe("PENDING"); expect(db.get("products/one").stockAvailable).toBe(5);
 });
 it("rolls back payment status if legacy stock cannot be deducted", async () => { const db = database({ items: [{ productId: "one", quantity: 6 }] }); await expect(db.run(payment)).rejects.toThrow(); expect(db.get("orders/ord-one").paymentStatus).toBe("PENDING"); });
 it("rejects cancelled orders and second distinct payments", async () => {
  await expect(database({ status: "CANCELLED" }).run(payment)).rejects.toThrow("cancelado"); const db = database(); await db.run(payment); await expect(db.run({ ...payment, id: "456" })).rejects.toThrow("ya tiene un pago");
 });
 it("settles only the verified balance amount without moving stock or changing initial totals", async () => {
  const db = database({ stockDeducted: true, paymentStatus: "PAID", balanceCheckoutGateway: { gatewayName: "MERCADO_PAGO", mode: "SANDBOX" } });
  const balance = { ...payment, id: "789", reference: "ord-one~balance", amount: 200 };
  await expect(db.run({ ...balance, amount: 100 })).rejects.toThrow("importe"); await db.run(balance);
  expect(db.get("orders/ord-one")).toMatchObject({ remainingBalanceLater: 0, balancePaid: true, totalChargedNow: 100 }); expect(db.get("products/one").stockAvailable).toBe(5); expect((await db.run(balance)).idempotent).toBe(true);
 });
 it("requires durable server storage for real payments", async () => { await expect(confirmVerifiedPayment(payment)).rejects.toMatchObject({ status: 503 }); });
});
