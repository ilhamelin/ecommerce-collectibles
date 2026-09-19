import { describe, it, expect } from "vitest";
import {
  resolveCourier,
  formatTrackingNumber,
  generatePODReceiptData,
  CHILEAN_COURIERS,
} from "@/lib/tracking/chilean-couriers";
import { ConfirmedOrderEntity } from "@/lib/types/domain";

describe("Chilean Couriers & Logistics Tracking System", () => {
  describe("Courier Resolution", () => {
    it("debe resolver Starken correctamente a partir del nombre del método de envío", () => {
      const courier = resolveCourier("Starken Domicilio Express");
      expect(courier.id).toBe("STARKEN");
      expect(courier.name).toBe("Starken");
      expect(courier.serviceType).toContain("Starken Express");
      expect(courier.brandColor).toBe("#E30613");
    });

    it("debe resolver Chilexpress correctamente para envíos prioritarios", () => {
      const courier = resolveCourier("Chilexpress Prioritario Día Hábil");
      expect(courier.id).toBe("CHILEXPRESS");
      expect(courier.name).toBe("Chilexpress");
      expect(courier.serviceType).toContain("Chilexpress Prioritario");
      expect(courier.brandColor).toBe("#D9251D");
    });

    it("debe resolver Blue Express correctamente", () => {
      const courier = resolveCourier("Blue Express Domicilio Estándar");
      expect(courier.id).toBe("BLUE_EXPRESS");
      expect(courier.name).toBe("Blue Express");
      expect(courier.brandColor).toBe("#00B4D8");
    });

    it("debe retornar Courier Default (Starken Express) si el método es desconocido o nulo", () => {
      const courierNull = resolveCourier(null);
      expect(courierNull.id).toBe("DEFAULT");
      expect(courierNull.name).toBe("Starken Express");

      const courierCustom = resolveCourier("Envío Especial Terrestre");
      expect(courierCustom.id).toBe("DEFAULT");
    });
  });

  describe("Official Courier Tracking URLs", () => {
    it("debe generar la URL de seguimiento oficial de Starken con OT limpia", () => {
      const courier = CHILEAN_COURIERS.STARKEN;
      const url = courier.trackingUrl("STK-982410529");
      expect(url).toBe("https://www.starken.cl/seguimiento?codigo=982410529");
    });

    it("debe generar la URL de seguimiento oficial de Chilexpress", () => {
      const courier = CHILEAN_COURIERS.CHILEXPRESS;
      const url = courier.trackingUrl("CHX-774920194");
      expect(url).toBe("https://www.chilexpress.cl/seguimiento-envios?orden=774920194");
    });

    it("debe generar la URL de seguimiento oficial de Blue Express", () => {
      const courier = CHILEAN_COURIERS.BLUE_EXPRESS;
      const url = courier.trackingUrl("BX-44810294");
      expect(url).toBe("https://www.bluex.cl/tracking?ot=44810294");
    });
  });

  describe("OT (Orden de Transporte) Normalization", () => {
    it("debe respetar el número de tracking si ya fue provisto por el backend", () => {
      const ot = formatTrackingNumber("STK-CHL-998822", "ORD-123");
      expect(ot).toBe("STK-CHL-998822");
    });

    it("debe generar una OT sintética válida si el campo viene vacío", () => {
      const ot = formatTrackingNumber("", "ORD-456");
      expect(ot).toBe("STK-ORD456");
    });

    it("debe utilizar un identificador por defecto si ambos campos son nulos", () => {
      const ot = formatTrackingNumber(null, undefined);
      expect(ot).toBe("STK-982410529");
    });
  });

  describe("POD & Guía de Despacho Data Structure", () => {
    const mockOrder: ConfirmedOrderEntity = {
      id: "ord_cl_12345",
      orderNumber: "1029",
      createdAt: "2026-09-19T10:00:00.000Z",
      status: "DISPATCHED",
      customer: {
        fullName: "Andrés Valenzuela M.",
        email: "andres.valenzuela@ejemplo.cl",
        phone: "+56 9 8765 4321",
        rut: "17.923.441-2",
        region: "Región de Valparaíso",
        comuna: "Viña del Mar",
        address: "Av. Libertad 450",
        apartment: "Depto 802",
      },
      shippingMethod: {
        name: "Starken Express",
        cost: 4990,
        estimatedDelivery: "24 a 48 hrs",
        trackingNumber: "STK-982410529",
      },
      paymentMethod: "WEBPAY",
      items: [
        {
          id: "item_1",
          productId: "prod_1",
          name: "Figura Iron Man Mark VII 1/6",
          sku: "HT-IM-MK7",
          price: 349990,
          unitPrice: 349990,
          quantity: 1,
          isPreOrder: false,
          totalPrice: 349990,
        },
      ],
      subtotal: 349990,
      discountAmount: 0,
      shippingCost: 4990,
      totalChargedNow: 354980,
      remainingBalanceLater: 0,
      reservationIds: [],
    };

    it("debe construir la Guía Electrónica con RUT de empresa y cliente válidos", () => {
      const pod = generatePODReceiptData(mockOrder);

      expect(pod.companyName).toBe("OMNICOLLECTOR SPA");
      expect(pod.companyRut).toBe("77.892.341-K");
      expect(pod.companyAddress).toContain("ENEA, Pudahuel");
      expect(pod.documentNumber).toBe("GD-0001029");
      expect(pod.courierName).toBe("Starken");
      expect(pod.trackingNumber).toBe("STK-982410529");
      expect(pod.receiverName).toBe("Andrés Valenzuela M.");
      expect(pod.receiverRut).toBe("17.923.441-2");
      expect(pod.deliveryAddress).toContain("Viña del Mar");
      expect(pod.deliveryAddress).toContain("Depto 802");
    });
  });
});
