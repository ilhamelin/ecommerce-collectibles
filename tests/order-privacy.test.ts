import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ConfirmedOrderEntity } from "@/lib/types/domain";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), admin: vi.fn(), orders: vi.fn(), order: vi.fn(), alerts: vi.fn(), remove: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: mocks.identity }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mocks.admin }));
vi.mock("@/lib/firebase/config", () => ({ isFirebaseConfigured: () => true }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: null, isFirebaseAdminConfigured: () => true }));
vi.mock("@/lib/firebase/firestore", () => ({ getAllOrdersFromFirestore: mocks.orders, getOrderByIdFromFirestore: mocks.order,
  getProductsFromFirestore: vi.fn().mockResolvedValue(null), updateOrderInFirestore: mocks.update, invalidateProductsCache: vi.fn() }));
vi.mock("@/lib/firebase/commerce", () => ({ cancelOrderAndRestoreStock: vi.fn() }));
vi.mock("@/lib/services/alertService", () => ({ alertService: { getAllAlerts: mocks.alerts, deleteAlert: mocks.remove } }));
vi.mock("@/lib/services/emailService", () => ({ sendProductAlertEmail: vi.fn() }));
import { signOrderReceipt, verifyOrderReceipt } from "@/lib/auth/orderAccess";
import { GET as listOrders } from "@/app/api/orders/route";
import { GET as orderDetail, PATCH as editOrder } from "@/app/api/orders/[id]/route";
import { GET as userAlerts, DELETE as deleteAlert } from "@/app/api/users/alerts/route";
import { GET as productAlert } from "@/app/api/products/[id]/alerts/route";
const order = (id: string, email: string): ConfirmedOrderEntity => ({ id, orderNumber: id, createdAt: "2026-10-03", status: "PAID", paymentMethod: "MERCADO_PAGO",
  customer: { email, fullName: "Cliente", phone: "12345678", region: "RM", comuna: "Santiago", address: "Privada 123" },
  shippingMethod: { name: "Retiro", cost: 0, estimatedDelivery: "Hoy", trackingNumber: "OT" }, items: [], reservationIds: [],
  subtotal: 0, discountAmount: 0, shippingCost: 0, totalChargedNow: 0, remainingBalanceLater: 0 });
const request = (path: string, cookie?: string) => new NextRequest("http://localhost" + path, { headers: cookie ? { cookie: "omni_order_access=" + cookie } : {} });
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("ADMIN_SESSION_SECRET", "test-receipt-secret-with-at-least-thirty-two-characters");
  mocks.identity.mockResolvedValue({ uid: "alice", email: "alice@example.com", admin: false });
  mocks.admin.mockResolvedValue({ authorized: false }); mocks.orders.mockResolvedValue([order("alice-order", "alice@example.com"), order("bob-order", "bob@example.com")]);
  mocks.order.mockResolvedValue(order("bob-order", "bob@example.com"));
  mocks.alerts.mockResolvedValue([{ id: "alice-alert", userId: "alice", email: "alice@example.com", productId: "p", active: true }, { id: "bob-alert", userId: "bob", email: "bob@example.com", productId: "p", active: true }]);
  mocks.remove.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());
describe("Order and alert privacy through server APIs", () => {
  it("rejects anonymous lists and individual orders", async () => {
    mocks.identity.mockResolvedValue(null);
    expect((await listOrders(request("/api/orders"))).status).toBe(401);
    expect(mocks.orders).not.toHaveBeenCalled();
    expect((await orderDetail(request("/api/orders/bob-order"), { params: { id: "bob-order" } })).status).toBe(403);
  });
  it("filters the order list by verified identity, even without a client email filter", async () => {
    const response = await listOrders(request("/api/orders"));
    expect((await response.json()).data.orders.map((entry: ConfirmedOrderEntity) => entry.id)).toEqual(["alice-order"]);
    expect((await listOrders(request("/api/orders?email=bob@example.com"))).status).toBe(403);
  });
  it("allows owner detail but rejects cross-account access", async () => {
    expect((await orderDetail(request("/api/orders/bob-order"), { params: { id: "bob-order" } })).status).toBe(403);
    mocks.identity.mockResolvedValue({ uid: "bob", email: "bob@example.com", admin: false });
    expect((await orderDetail(request("/api/orders/bob-order"), { params: { id: "bob-order" } })).status).toBe(200);
  });
  it("preserves guest confirmation with a signed receipt for exactly one order", async () => {
    mocks.identity.mockResolvedValue(null); const token = signOrderReceipt("bob-order")!;
    expect((await orderDetail(request("/api/orders/bob-order", token), { params: { id: "bob-order" } })).status).toBe(200);
    expect((await orderDetail(request("/api/orders/bob-order", signOrderReceipt("other-order")!), { params: { id: "bob-order" } })).status).toBe(403);
    expect((await listOrders(request("/api/orders", token))).status).toBe(401);
  });
  it("rejects altered, expired or appended receipts and production fallback keys", () => {
    const token = signOrderReceipt("bob-order")!;
    expect(verifyOrderReceipt("x" + token, "bob-order")).toBe(false);
    expect(verifyOrderReceipt(token + ".extra", "bob-order")).toBe(false);
    expect(verifyOrderReceipt(signOrderReceipt("bob-order", -1)!, "bob-order")).toBe(false);
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("ADMIN_SESSION_SECRET", ""); vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    expect(signOrderReceipt("bob-order")).toBeNull(); expect(verifyOrderReceipt(token, "bob-order")).toBe(false);
  });
  it("does not accept clientTrackingUpdate as permission to mark a real order delivered", async () => {
    const response = await editOrder(new NextRequest("http://localhost/api/orders/bob-order", { method: "PATCH", body: JSON.stringify({ status: "DELIVERED", clientTrackingUpdate: true }) }), { params: { id: "bob-order" } });
    expect(response.status).toBe(403); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("ignores a supplied foreign user id when listing user and product alerts", async () => {
    const response = await userAlerts(request("/api/users/alerts?userId=bob"));
    expect((await response.json()).data.alerts.map((alert: { id: string }) => alert.id)).toEqual(["alice-alert"]);
    const product = await productAlert(request("/api/products/p/alerts?userId=bob"), { params: { id: "p" } });
    expect((await product.json()).alert.id).toBe("alice-alert");
    expect((await userAlerts(request("/api/users/alerts?email=bob@example.com"))).status).toBe(403);
  });
  it("requires ownership to cancel alerts and confirms persistence failure", async () => {
    expect((await deleteAlert(request("/api/users/alerts?id=bob-alert"))).status).toBe(403); expect(mocks.remove).not.toHaveBeenCalled();
    expect((await deleteAlert(request("/api/users/alerts?id=alice-alert"))).status).toBe(200);
    mocks.remove.mockResolvedValue(false); expect((await deleteAlert(request("/api/users/alerts?id=alice-alert"))).status).toBe(503);
    mocks.identity.mockResolvedValue(null); expect((await deleteAlert(request("/api/users/alerts?id=alice-alert"))).status).toBe(401);
    expect((await productAlert(request("/api/products/p/alerts?email=alice@example.com"), { params: { id: "p" } })).status).toBe(401);
  });
});
