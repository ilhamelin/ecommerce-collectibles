// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "../src/app/checkout/page";

const mocks = vi.hoisted(() => ({
  clearCart: vi.fn(), addOrder: vi.fn(), push: vi.fn(),
  user: null as null | { id: string; fullName: string; email: string; phone: string; rut: string; addresses: []; paymentMethods: [] },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/components/shipping/ShippingCalculator", () => ({ ShippingCalculator: () => null }));
vi.mock("@/components/product/InstallmentCalculator", () => ({ InstallmentCalculator: () => null }));
vi.mock("@/lib/store/authStore", () => ({ useAuthStore: () => ({ currentUser: mocks.user, addUserOrder: mocks.addOrder }) }));
vi.mock("@/lib/store/cartStore", () => ({ useCartStore: () => ({
  items: [{ id: "demo-full", productId: "demo", sku: "DEMO-PS5", name: "Juego de prueba", type: "VIDEO_GAME", quantity: 1, unitPrice: 54900, isPreOrder: false, isPartialDeposit: false, depositPercent: 1, unitDeposit: 54900 }],
  appliedCoupon: null, applyCoupon: vi.fn(), removeCoupon: vi.fn(), clearCart: mocks.clearCart,
  getTotals: () => ({ subtotal: 54900, discountAmount: 0, shippingFee: 0, isFreeShipping: true, totalDueToday: 54900, totalDeferredDueLater: 0, totalNominalOrderValue: 54900, totalItemCount: 1 }),
}) }));

describe("Checkout customer validation and Mercado Pago request", () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(async () => {
    vi.clearAllMocks(); mocks.user = null;
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "ValidationError", code: "VALIDATION_FAILED", message: "Revisa los datos: Dirección requerida." }, { status: 400 })));
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    container = document.createElement("div"); document.body.append(container); root = createRoot(container);
    await act(async () => root.render(<CheckoutPage />));
  });
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.includes(text))!;
  async function fill(id: string, value: string) {
    const input = container.querySelector<HTMLInputElement>(`#checkout-${id}`)!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  async function customer(rut = "") {
    await fill("fullName", " Cliente Prueba "); await fill("email", "checkout@example.com"); await fill("phone", "+56 9 0000 0000"); await fill("rut", rut);
  }
  async function submit(text: string) {
    await act(async () => button(text).closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  }
  async function payment() {
    await submit("Continuar a Envío"); await fill("address", "Calle de Prueba 123"); await submit("Continuar a Pasarela");
    // This is an isolated unit test; no real purchase or external terms acceptance occurs.
    await act(async () => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    await act(async () => button("Pagar con Mercado Pago").click());
  }
  it("sends an absent optional RUT to the gateway path and preserves the cart after a useful API error", async () => {
    await customer(); await payment();
    expect(fetch).toHaveBeenCalledOnce();
    const options = vi.mocked(fetch).mock.calls[0][1];
    const payload = JSON.parse(String(options?.body)) as { paymentMethod: string; customerInfo: Record<string, unknown> };
    expect(payload.paymentMethod).toBe("MERCADO_PAGO");
    expect(payload.customerInfo.fullName).toBe("Cliente Prueba");
    expect(payload.customerInfo).not.toHaveProperty("rut");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Dirección requerida");
    expect(mocks.clearCart).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
  });
  it("detects an invalid entered RUT at identification and focuses that field before any request", async () => {
    await customer("18.420.915-K"); await submit("Continuar a Envío");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("RUT chileno inválido");
    expect(document.activeElement?.id).toBe("checkout-rut");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("lets the user clear an invalid saved demo RUT instead of fabricating a replacement", async () => {
    mocks.user = { id: "demo-user", fullName: "Cliente Prueba", email: "checkout@example.com", phone: "+56 9 0000 0000", rut: "15.820.194-2", addresses: [], paymentMethods: [] };
    await act(async () => root.render(<CheckoutPage />));
    await submit("Continuar a Envío");
    expect(container.textContent).toContain("RUT chileno inválido");
    await fill("rut", ""); await payment();
    expect(fetch).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)) as { userId: string; customerInfo: Record<string, unknown> };
    expect(payload.userId).toBe("demo-user");
    expect(payload.customerInfo).not.toHaveProperty("rut");
  });
  it("keeps older API validation failures readable instead of showing just ValidationError", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "ValidationError", code: "VALIDATION_FAILED" }, { status: 400 }));
    await customer(); await payment();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Revisa tus datos de identificación");
    expect(container.querySelector('[role="alert"]')?.textContent).not.toContain("ValidationError");
  });
});
