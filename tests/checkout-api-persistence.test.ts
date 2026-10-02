import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/checkout/route";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import { InsufficientStockError } from "@/lib/errors/DomainErrors";

const mocked = vi.hoisted(() => ({ persisted: new Map<string, unknown>(), commit: vi.fn(), gateway: vi.fn() }));
vi.mock("@/lib/firebase/firestore", () => ({
  getOrderByIdFromFirestore: async (id: string) => mocked.persisted.get(id) || null,
  getProductsFromFirestore: async () => null,
  invalidateProductsCache: vi.fn(),
  updateOrderInFirestore: async (id: string, updates: Record<string, unknown>) => {
    mocked.persisted.set(id, { ...(mocked.persisted.get(id) as object), ...updates }); return true;
  },
}));
vi.mock("@/lib/firebase/commerce", () => ({ commitOrderAndStock: mocked.commit }));
vi.mock("@/lib/payments/payment-gateway", () => ({ initiatePaymentGateway: mocked.gateway }));

function request(couponCode?: string) {
  return new NextRequest("http://localhost:3000/api/checkout", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "integration-key-01" },
    body: JSON.stringify({ cartSessionId: "cart-integration", userId: "demo", paymentMethod: "MERCADO_PAGO", couponCode,
      items: [{ productId: "prod-vg-01", quantity: 1 }] }),
  });
}
beforeEach(() => {
  MemoryTransactionalStore.getInstance().reset(); mocked.persisted.clear(); mocked.commit.mockReset(); mocked.gateway.mockReset();
  mocked.commit.mockImplementation(async (order: ConfirmedOrderEntity) => {
    const saved = { ...order, stockDeducted: true }; mocked.persisted.set(order.id, saved); return saved;
  });
  mocked.gateway.mockResolvedValue({ gatewayName: "SIMULATED_SANDBOX", requiresRedirect: true, redirectUrl: "/checkout/sandbox-payment", mode: "SIMULATED", message: "Demo" });
});

describe("Checkout API handoff to persistence", () => {
  it("recovers the order on a new instance without another inventory commit or gateway", async () => {
    const first = await POST(request()); expect(first.status).toBe(201);
    const firstData = await first.json();
    // Simulate a serverless restart: local maps are completely lost.
    MemoryTransactionalStore.getInstance().reset();
    const retry = await POST(request()); expect(retry.status).toBe(201);
    const retryData = await retry.json();
    expect(retryData.data.orderId).toBe(firstData.data.orderId);
    expect(retryData.data.gateway).toEqual(firstData.data.gateway);
    expect(mocked.commit).toHaveBeenCalledTimes(1);
    expect(mocked.gateway).toHaveBeenCalledTimes(1);
  });
  it("refuses changed payloads under the same key", async () => {
    await POST(request());
    expect((await POST(request("CHILE10"))).status).toBe(409);
    expect(mocked.commit).toHaveBeenCalledTimes(1);
  });
  it("returns a failure and releases local reservations if Firestore refuses the commit", async () => {
    mocked.commit.mockRejectedValue(new InsufficientStockError("Stock insuficiente"));
    const response = await POST(request()); expect(response.status).toBe(409);
    const store = MemoryTransactionalStore.getInstance();
    expect(store.orders.size).toBe(0);
    expect(store.products.get("prod-vg-01")!.stockReserved).toBe(0);
    expect(mocked.gateway).not.toHaveBeenCalled();
  });
});


it("concurrent identical HTTP submissions share one inventory commit and one gateway", async () => {
  const [first, second] = await Promise.all([POST(request()), POST(request())]);
  expect(first.status).toBe(201); expect(second.status).toBe(201);
  expect((await first.json()).data.orderId).toBe((await second.json()).data.orderId);
  expect(mocked.commit).toHaveBeenCalledTimes(1);
  expect(mocked.gateway).toHaveBeenCalledTimes(1);
});
