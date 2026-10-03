import { describe, expect, it } from "vitest";
import { buildNotifications, notificationOwnerKey } from "@/lib/services/customerNotifications";
const order = { id: "o1", status: "CONFIRMED", createdAt: "2026-10-01", updatedAt: "2026-10-02" };
const product = { id: "p1", sku: "FIG-ONE", name: "Figura", price: 9000, stockAvailable: 2, stockReserved: 0 };
const alert = { id: "a1", productId: "p1", productName: "Figura", productPrice: 10000, alertType: "BOTH", isOutOfStock: true, active: true, createdAt: "2026-10-01" };
describe("Customer notices", () => {
 it("retains read state until an actual order state changes", () => {
  const first = buildNotifications([order], [], [], [])[0];
  expect(buildNotifications([order], [], [], [first.id])[0].read).toBe(true);
  const next = buildNotifications([{ ...order, status: "DISPATCHED" }], [], [], [first.id])[0];
  expect(next.read).toBe(false); expect(next.id).not.toBe(first.id);
 });
 it("only announces warehouse arrival when that state is confirmed", () => {
  expect(buildNotifications([order], [], [], []).map(x => x.kind)).toEqual(["ORDER"]);
  expect(buildNotifications([{ ...order, preOrderWarehouseArrivalNotified: true, remainingBalanceLater: 100 }], [], [], []).map(x => x.kind)).toContain("PREORDER");
  expect(buildNotifications([{ ...order, status: "CANCELLED", preOrderWarehouseArrivalNotified: true, remainingBalanceLater: 100 }], [], [], []).map(x => x.kind)).not.toContain("PREORDER");
 });
 it("derives stock and price notices from real subscription baselines", () => {
  expect(buildNotifications([], [alert], [product], []).map(x => x.kind)).toEqual(["STOCK", "PRICE"]);
  expect(buildNotifications([], [{ ...alert, active: false }], [product], [])).toEqual([]);
  expect(buildNotifications([], [alert], [{ ...product, stockReserved: 2, price: 10000 }], [])).toEqual([]);
  expect(buildNotifications([], [alert], [{ ...product, isPreOrder: true, price: 10000 }], [])).toEqual([]);
 });
 it("honors subscription types, missing products and malformed records", () => {
  expect(buildNotifications([], [{ ...alert, alertType: "PRICE_DROP" }], [product], []).map(x => x.kind)).toEqual(["PRICE"]);
  expect(buildNotifications([], [alert], [], [])).toEqual([]);
  expect(buildNotifications([{}], [{}], [{}], [])).toEqual([]);
 });
 it("uses distinct stable owner keys without exposing email or uid", () => {
  const key = notificationOwnerKey({ uid: "user1", email: "one@example.com" });
  expect(key).toMatch(/^[a-f0-9]{64}$/); expect(key).toBe(notificationOwnerKey({ uid: "user1", email: "new@example.com" }));
  expect(key).not.toBe(notificationOwnerKey({ uid: "user2", email: "one@example.com" }));
 });
});
