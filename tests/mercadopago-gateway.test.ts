import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isMercadoPagoConfigured } from "@/lib/payments/mercadopago";
import * as mpModule from "@/lib/payments/mercadopago";
import * as flowModule from "@/lib/payments/flow";
import { initiatePaymentGateway } from "@/lib/payments/payment-gateway";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

describe("Mercado Pago Integration & Gateway Integrity", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const mockOrder: ConfirmedOrderEntity = {
    id: "ord-test-mp-100",
    orderNumber: "ORD-2026-999888",
    createdAt: new Date().toISOString(),
    status: "CONFIRMED",
    customer: {
      fullName: "Juan Perez Gonzalez",
      email: "juan.perez@test.cl",
      phone: "+56 9 1234 5678",
      rut: "19.876.543-2",
      region: "Región Metropolitana",
      comuna: "Providencia",
      address: "Av. Providencia 1234",
    },
    shippingMethod: {
      name: "Starken Express",
      cost: 4990,
      trackingNumber: "STK-123456",
    },
    paymentMethod: "MERCADO_PAGO",
    items: [
      {
        productId: "prod-gpu-1",
        sku: "HW-RTX5070-ASUS",
        name: "ASUS Prime RTX 5070 12GB",
        quantity: 1,
        unitPrice: 650000,
        isPreOrder: false,
        isPartialDeposit: false,
        unitDeposit: 650000,
        remainingBalancePerUnit: 0,
        imageUrl: "https://example.com/gpu.jpg",
      },
    ],
    subtotal: 650000,
    shippingCost: 4990,
    discountAmount: 0,
    totalChargedNow: 654990,
    remainingBalanceLater: 0,
    reservationIds: ["res-1"],
  };

  it("should correctly detect if Mercado Pago is configured", () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token-value-123456789";
    expect(isMercadoPagoConfigured()).toBe(true);

    process.env.MERCADOPAGO_ACCESS_TOKEN = "";
    expect(isMercadoPagoConfigured()).toBe(false);
  });

  it("should select sandboxInitPoint when using a TEST- token", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-123456789-test-token-val";
    process.env.MERCADOPAGO_SANDBOX_MODE = "true";

    vi.spyOn(mpModule, "createMercadoPagoPreference").mockResolvedValue({
      id: "pref-sandbox-123",
      initPoint: "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-sandbox-123",
      sandboxInitPoint: "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=pref-sandbox-123",
    });

    const gatewayResult = await initiatePaymentGateway(mockOrder, "https://omnicollector.cl");

    expect(gatewayResult.gatewayName).toBe("MERCADO_PAGO");
    expect(gatewayResult.mode).toBe("SANDBOX");
    expect(gatewayResult.requiresRedirect).toBe(true);
    expect(gatewayResult.redirectUrl).toBe("https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=pref-sandbox-123");
    expect(gatewayResult.preferenceId).toBe("pref-sandbox-123");
  });

  it("should select initPoint when using production APP_USR- token", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-1060554978141960-091117-57e99ccf637ec7858aceace617bc6ed0-3680975601";
    process.env.MERCADOPAGO_SANDBOX_MODE = "false";

    vi.spyOn(mpModule, "createMercadoPagoPreference").mockResolvedValue({
      id: "pref-live-456",
      initPoint: "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-live-456",
      sandboxInitPoint: "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=pref-live-456",
    });

    const gatewayResult = await initiatePaymentGateway(mockOrder, "https://omnicollector.cl");

    expect(gatewayResult.gatewayName).toBe("MERCADO_PAGO");
    expect(gatewayResult.mode).toBe("LIVE");
    expect(gatewayResult.requiresRedirect).toBe(true);
    expect(gatewayResult.redirectUrl).toBe("https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-live-456");
    expect(gatewayResult.preferenceId).toBe("pref-live-456");
  });

  it("should fall back to interactive sandbox simulator when credentials are empty", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;

    const gatewayResult = await initiatePaymentGateway(mockOrder, "https://omnicollector.cl");

    expect(gatewayResult.gatewayName).toBe("SIMULATED_SANDBOX");
    expect(gatewayResult.mode).toBe("SIMULATED");
    expect(gatewayResult.redirectUrl).toContain("/checkout/sandbox-payment");
  });

  it("should route to Flow.cl when paymentMethod is WEBPAY", async () => {
    process.env.FLOW_API_KEY = "flow-test-api-key";
    process.env.FLOW_SECRET_KEY = "flow-test-secret-key-123456";
    process.env.FLOW_SANDBOX_MODE = "true";

    vi.spyOn(flowModule, "createFlowPaymentOrder").mockResolvedValue({
      token: "flow-token-123",
      url: "https://sandbox.flow.cl/payment/pay?token=flow-token-123",
      flowOrder: 123456,
    });

    const flowOrder = {
      ...mockOrder,
      paymentMethod: "WEBPAY" as const,
    };

    const gatewayResult = await initiatePaymentGateway(flowOrder, "https://omnicollector.cl");

    expect(gatewayResult.gatewayName).toBe("FLOW");
    expect(gatewayResult.mode).toBe("SANDBOX");
    expect(gatewayResult.requiresRedirect).toBe(true);
  });
});

