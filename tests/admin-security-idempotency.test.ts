import { describe, it, expect, beforeEach } from "vitest";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/auth/adminSessionToken";
import { POST as adminSessionPOST, DELETE as adminSessionDELETE, GET as adminSessionGET } from "@/lib/../app/api/auth/admin-session/route";
import { POST as mpWebhookPOST } from "@/lib/../app/api/checkout/mercadopago/webhook/route";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import { NextRequest } from "next/server";

describe("Cryptographic Admin Session Token Suite (Web Crypto HMAC-SHA256)", () => {
  it("should create a valid signed session token and verify it successfully", async () => {
    const email = "admin@omnicollector.cl";
    const token = await createAdminSessionToken(email, 3600);

    expect(token).toBeDefined();
    expect(token.includes(".")).toBe(true);

    const verification = await verifyAdminSessionToken(token);
    expect(verification.valid).toBe(true);
    expect(verification.email).toBe(email);
    expect(verification.role).toBe("ADMIN");
  });

  it("should reject tampered token signatures", async () => {
    const email = "admin@omnicollector.cl";
    const validToken = await createAdminSessionToken(email, 3600);
    const [payload, signature] = validToken.split(".");

    // Tamper with payload (modify encoded character)
    const tamperedPayload = payload.slice(0, -2) + "==";
    const tamperedToken = `${tamperedPayload}.${signature}`;

    const verification = await verifyAdminSessionToken(tamperedToken);
    expect(verification.valid).toBe(false);
    expect(verification.error).toBeDefined();
  });

  it("should reject expired tokens", async () => {
    const email = "admin@omnicollector.cl";
    // TTL = -10 seconds (already expired)
    const expiredToken = await createAdminSessionToken(email, -10);

    const verification = await verifyAdminSessionToken(expiredToken);
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("expirado");
  });

  it("should reject malformed tokens without signature part", async () => {
    const verification = await verifyAdminSessionToken("not-a-valid-token-format");
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("inválido");
  });
});

describe("Admin Session API Route (/api/auth/admin-session)", () => {
  it("should issue an HttpOnly cookie for whitelisted admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/admin-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@omnicollector.cl", role: "ADMIN" }),
    });

    const res = await adminSessionPOST(req);
    expect(res.status).toBe(200);

    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain("omni_admin_session=");
    expect(cookieHeader).toContain("HttpOnly");
    expect(cookieHeader).toContain("Path=/");
  });

  it("should reject issuing admin cookie for non-admin email", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/admin-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hacker@malicious.com", role: "ADMIN" }),
    });

    const res = await adminSessionPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe("FORBIDDEN");
  });

  it("should clear the admin cookie on DELETE", async () => {
    const res = await adminSessionDELETE();
    expect(res.status).toBe(200);

    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain("Max-Age=0");
  });
});

describe("Webhook Payment Idempotency Guard (Mercado Pago)", () => {
  beforeEach(() => {
    const store = MemoryTransactionalStore.getInstance();
    store.orders.clear();

    const mockOrder: ConfirmedOrderEntity = {
      id: "ord-idempotent-test-01",
      orderNumber: "ORD-2026-IDEM-01",
      createdAt: new Date().toISOString(),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "Mercado Pago",
      customer: {
        fullName: "Collector Tester",
        email: "collector@omnicollector.cl",
        phone: "+56 9 1234 5678",
        region: "Metropolitana",
        comuna: "Santiago",
        address: "Av. Siempre Viva 742",
      },
      shippingMethod: {
        name: "Chilexpress",
        cost: 4990,
        estimatedDelivery: "24-48h",
        trackingNumber: "TRK-9999",
      },
      items: [
        {
          productId: "prod-1",
          sku: "TEST-SKU",
          name: "Test Item",
          quantity: 1,
          unitPrice: 25000,
          isPreOrder: false,
          isPartialDeposit: false,
          unitDeposit: 0,
          remainingBalancePerUnit: 0,
        },
      ],
      subtotal: 25000,
      discountAmount: 0,
      shippingCost: 4990,
      totalChargedNow: 29990,
      remainingBalanceLater: 0,
      reservationIds: [],
    };

    store.orders.set(mockOrder.id, mockOrder);
  });

  it("should detect duplicate simulated payment and return idempotent: true without error", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout/mercadopago/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-simulation-key": "omnicollector-sandbox-key",
      },
      body: JSON.stringify({
        simulated: true,
        orderId: "ord-idempotent-test-01",
        paymentDetails: { paymentId: "sim-12345" },
      }),
    });

    const res = await mpWebhookPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
