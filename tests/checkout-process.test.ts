import { describe, it, expect, beforeEach } from "vitest";
import { MemoryTransactionalStore } from "../src/lib/db/memory-db";
import { StockReservationService } from "../src/lib/services/StockReservationService";
import { CheckoutService } from "../src/lib/services/CheckoutService";
import { useCartStore, VALID_COUPONS } from "../src/lib/store/cartStore";

describe("E-Commerce Complete Checkout Process & Cart Features", () => {
  let store: MemoryTransactionalStore;
  let reservationService: StockReservationService;
  let checkoutService: CheckoutService;

  beforeEach(() => {
    store = MemoryTransactionalStore.getInstance();
    store.reset();
    reservationService = new StockReservationService(store);
    checkoutService = new CheckoutService(store, reservationService);
    useCartStore.getState().clearCart();
    useCartStore.setState({ savedForLater: [], appliedCoupon: null });
  });

  it("1. Selección y Captura: should add products to cart and compute immediate financial totals", () => {
    const { addItem, getTotals } = useCartStore.getState();

    addItem({
      productId: "prod-vg-01",
      sku: "VG-ELDEN-PS5",
      name: "Elden Ring: Shadow of the Erdtree Edition",
      type: "VIDEO_GAME",
      quantity: 1,
      unitPrice: 79990,
      unitCost: 69990,
      isPreOrder: false,
      isPartialDeposit: false,
      depositPercent: 1.0,
    });

    const totals = getTotals();
    expect(totals.totalItemCount).toBe(1);
    expect(totals.subtotal).toBe(79990);
    // Free shipping applies over $50.000 CLP
    expect(totals.isFreeShipping).toBe(true);
    expect(totals.shippingFee).toBe(0);
    expect(totals.totalDueToday).toBe(79990);
  });

  it("2. Revisión y Modificación: should support wishlist / saved for later and apply coupon codes", () => {
    const cart = useCartStore.getState();

    cart.addItem({
      productId: "prod-fig-01",
      sku: "FIG-MAKIMA-17",
      name: "Makima 1/7 Scale PVC Figure",
      type: "FIGURE",
      quantity: 1,
      unitPrice: 249990,
      unitCost: 160000,
      isPreOrder: true,
      isPartialDeposit: true,
      depositPercent: 0.2,
    });

    const itemId = "prod-fig-01-dep";
    expect(useCartStore.getState().items.length).toBe(1);

    // Move to wishlist (Guardar para después)
    useCartStore.getState().moveToWishlist(itemId);
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useCartStore.getState().savedForLater.length).toBe(1);
    expect(useCartStore.getState().savedForLater[0].sku).toBe("FIG-MAKIMA-17");

    // Move back to cart
    useCartStore.getState().moveToCart(itemId);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().savedForLater.length).toBe(0);

    // Apply Coupon COLECCIONISTA5K (-$5.000 CLP)
    const res = useCartStore.getState().applyCoupon("COLECCIONISTA5K");
    expect(res.success).toBe(true);
    expect(useCartStore.getState().appliedCoupon?.code).toBe("COLECCIONISTA5K");

    const totalsWithCoupon = useCartStore.getState().getTotals();
    expect(totalsWithCoupon.subtotal).toBe(49998); // 20% of 249990
    expect(totalsWithCoupon.discountAmount).toBe(5000);
    expect(totalsWithCoupon.totalDueToday).toBe(44998);
  });

  it("3 & 4. Checkout Pasarela & Post-Venta: should process complete checkout with Chilean address, courier, and save confirmed order", async () => {
    const payload = {
      cartSessionId: "cart-sess-chile-12345",
      userId: "matias@coleccionista.cl",
      paymentMethod: "WEBPAY" as const,
      idempotencyKey: "idem-chile-checkout-9921",
      couponCode: "COLECCIONISTA5K",
      customerInfo: {
        fullName: "Matías Silva González",
        email: "matias@coleccionista.cl",
        phone: "+56 9 8765 4321",
        rut: "18.420.915-K",
      },
      shippingAddress: {
        region: "Región Metropolitana de Santiago",
        comuna: "Providencia",
        address: "Av. Providencia 1234",
        apartment: "Depto 402",
      },
      shippingMethod: {
        carrier: "STARKEN",
        name: "Starken Express (1 a 2 días hábiles)",
        cost: 4990,
      },
      items: [
        {
          productId: "prod-vg-01",
          quantity: 1,
          isPartialDeposit: false,
        },
      ],
    };

    const result = await checkoutService.processCheckout(payload);

    expect(result.orderId).toBeDefined();
    expect(result.orderNumber).toMatch(/^ORD-2026-\d{6}$/);
    expect(result.trackingNumber).toMatch(/^STK-CHL-\d+/);
    expect(result.order).toBeDefined();
    expect(result.order?.customer.fullName).toBe("Matías Silva González");
    expect(result.order?.customer.comuna).toBe("Providencia");
    expect(result.order?.shippingMethod.name).toBe("Starken Express (1 a 2 días hábiles)");

    // Verify order was stored in memory db
    const savedOrder = store.orders.get(result.orderId);
    expect(savedOrder).toBeDefined();
    expect(savedOrder?.orderNumber).toBe(result.orderNumber);
    expect(savedOrder?.status).toBe("CONFIRMED");
    expect(savedOrder?.items.length).toBe(1);
    expect(savedOrder?.items[0].sku).toBe("VG-ELDEN-PS5");
  });
});
