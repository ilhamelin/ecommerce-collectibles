import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mock = vi.hoisted(() => ({ auth: vi.fn(), identity: vi.fn(), canRead: vi.fn(), order: vi.fn(), requests: vi.fn(), save: vi.fn(), tracking: vi.fn(), registration: vi.fn(), gateway: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mock.auth }));
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: mock.identity }));
vi.mock("@/lib/auth/orderAccess", () => ({ canReadOrder: mock.canRead }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: {} }));
vi.mock("@/lib/firebase/config", () => ({ db: null, isFirebaseConfigured: () => false }));
vi.mock("@/lib/firebase/firestore", () => ({ getOrderByIdFromFirestore: mock.order, updateOrderInFirestore: mock.update }));
vi.mock("@/lib/services/productRequestService", () => ({ productRequestService: { getAllRequests: mock.requests, saveRequest: mock.save } }));
vi.mock("@/lib/services/aftershipService", () => ({ afterShipService: { getTracking: mock.tracking, createTracking: mock.registration } }));
vi.mock("@/lib/payments/payment-gateway", () => ({ initiatePaymentGateway: mock.gateway, PaymentGatewayUnavailableError: class extends Error {} }));
vi.mock("fs", () => ({ default: { existsSync: () => false, mkdirSync: vi.fn(), writeFileSync: vi.fn() } }));
import { GET as requestsGET, POST as requestsPOST } from "@/app/api/catalog/product-requests/route";
import { GET as trackingGET, POST as trackingPOST } from "@/app/api/tracking/[id]/route";
import { GET as analyticsGET, POST as analyticsPOST } from "@/app/api/analytics/route";
import { POST as transition } from "@/app/api/preorders/[id]/transition/route";
import { POST as balance } from "@/app/api/orders/[id]/settle-balance/route";
const req = (body?: unknown) => new NextRequest("https://example.com/api/test", body !== undefined ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
const ctx = { params: { id: "ord-one" } };
beforeEach(() => { vi.clearAllMocks(); mock.auth.mockResolvedValue({ authorized: false }); mock.identity.mockResolvedValue(null); mock.canRead.mockResolvedValue(false); mock.order.mockResolvedValue(null); });
afterEach(() => { vi.useRealTimers(); });
describe("Pending API permissions", () => {
 it("denies private request lists without identity", async () => { expect((await requestsGET(req())).status).toBe(401); expect(mock.requests).not.toHaveBeenCalled(); });
 it("filters requests by verified owner, ignoring query/body claims", async () => {
  mock.identity.mockResolvedValue({ uid: "u1", email: "one@example.com" }); mock.requests.mockResolvedValue([{ id: "own", userId: "u1", userEmail: "one@example.com", isGuest: false }, { id: "other", userId: "u2", userEmail: "two@example.com", isGuest: false }, { id: "guest", userEmail: "one@example.com", isGuest: true }]);
  const body = await (await requestsGET(req())).json(); expect(body.data.requests.map((x: { id: string }) => x.id)).toEqual(["own"]);
 });
 it("overrides claimed creation identity and does not assign guest requests to a spoofed uid", async () => {
  mock.save.mockImplementation(async data => data); const guest = await (await requestsPOST(req({ title: "Figura", userEmail: "guest@example.com", userId: "admin" }))).json(); expect(guest.data.userId).toBeNull(); expect(guest.data.isGuest).toBe(true);
  mock.identity.mockResolvedValue({ uid: "u1", email: "one@example.com" }); const own = await (await requestsPOST(req({ title: "Figura", userEmail: "spoof@example.com", userId: "u2" }))).json(); expect(own.data.userId).toBe("u1"); expect(own.data.userEmail).toBe("one@example.com");
 });
 it("denies transitions and tracking registration before any provider call", async () => { expect((await transition(req({ newState: "WAREHOUSE_RECEIVED" }), ctx)).status).toBe(403); expect((await trackingPOST(req({ trackingNumber: "123" }), ctx)).status).toBe(403); expect(mock.registration).not.toHaveBeenCalled(); });
 it("checks order ownership before tracking and blocks arbitrary public OT queries", async () => {
  expect((await trackingGET(req(), ctx)).status).toBe(403); mock.order.mockResolvedValue({ id: "ord-one", orderNumber: "ORD", shippingMethod: { trackingNumber: "123", name: "Starken" } }); expect((await trackingGET(req(), ctx)).status).toBe(403); expect(mock.tracking).not.toHaveBeenCalled();
  mock.canRead.mockResolvedValue(true); mock.tracking.mockResolvedValue({ status: "IN_TRANSIT" }); const result = await trackingGET(req(), ctx); expect(result.status).toBe(200); expect(result.headers.get("Cache-Control")).toContain("private");
 });
 it("protects analytics summary, validates batch size and rejects prototype keys", async () => {
  expect((await analyticsGET(req())).status).toBe(403); expect((await analyticsPOST(req({ events: Array.from({ length: 51 }, () => ({ type: "PAGE_VIEW" })) }))).status).toBe(400);
  expect((await analyticsPOST(req({ type: "PRODUCT_CLICK", productSku: "__proto__" }))).status).toBe(400);
 });
 it("keeps anonymous analytics ingestion but does not trust claimed user IDs", async () => { vi.useFakeTimers(); expect((await analyticsPOST(req({ type: "PAGE_VIEW", visitorId: "visitor1", userId: "spoof" }))).status).toBe(200); vi.clearAllTimers(); });
});
describe("Balance payment initiation", () => {
 it("blocks users without order access", async () => { mock.order.mockResolvedValue({ id: "ord-one" }); expect((await balance(req({}), ctx)).status).toBe(403); expect(mock.gateway).not.toHaveBeenCalled(); });
 it("rejects the previous fake transaction-ID settlement", async () => { mock.order.mockResolvedValue({ id: "ord-one" }); mock.canRead.mockResolvedValue(true); expect((await balance(req({ paymentId: "SIM-123" }), ctx)).status).toBe(400); expect(mock.update).not.toHaveBeenCalled(); });
 it("opens the balance gateway without marking anything as paid", async () => {
  mock.order.mockResolvedValue({ id: "ord-one", orderNumber: "ORD", status: "CONFIRMED", paymentStatus: "PAID", remainingBalanceLater: 200, shippingMethod: { cost: 0 } }); mock.canRead.mockResolvedValue(true); mock.gateway.mockResolvedValue({ gatewayName: "MERCADO_PAGO", mode: "SANDBOX", redirectUrl: "https://sandbox.mercadopago.cl/test" });
  const result = await balance(req({ paymentMethod: "MERCADO_PAGO" }), ctx); expect(result.status).toBe(200); expect(mock.gateway).toHaveBeenCalledWith(expect.objectContaining({ id: "ord-one~balance", totalChargedNow: 200 }), expect.any(String));
  expect(mock.update).toHaveBeenCalledWith("ord-one", { balanceCheckoutGateway: expect.any(Object) });
 });
});
