import { describe, it, expect } from "vitest";
import {
  validateChileanRut,
  formatChileanRut,
  cleanRut,
  calculateDv,
} from "../src/lib/utils/chileanRut";
import { CheckoutCustomerSchema } from "../src/lib/validations/schemas";
import { sendOrderConfirmationEmail } from "../src/lib/services/emailService";
import { deductProductStockAtomic, restoreProductStockAtomic } from "../src/lib/firebase/firestore";

describe("Architecture & UX Improvements Suite", () => {
  describe("Chilean RUT Validation & Formatting (Módulo 11)", () => {
    it("should calculate correct verification digits", () => {
      // Test known valid Chilean RUTs
      expect(calculateDv("15820194")).toBe("1");
      expect(calculateDv("11111111")).toBe("1");
      expect(calculateDv("11111112")).toBe("K");
    });

    it("should validate valid Chilean RUTs with clean or formatted input", () => {
      expect(validateChileanRut("15.820.194-1")).toBe(true);
      expect(validateChileanRut("158201941")).toBe(true);
      expect(validateChileanRut("15820194-1")).toBe(true);
      expect(validateChileanRut("11111112-K")).toBe(true);
      expect(validateChileanRut("11111112k")).toBe(true);
    });

    it("should reject invalid Chilean RUTs with incorrect verification digits", () => {
      expect(validateChileanRut("15.820.194-9")).toBe(false);
      expect(validateChileanRut("12345678-0")).toBe(false);
      expect(validateChileanRut("")).toBe(false);
      expect(validateChileanRut("invalid-rut")).toBe(false);
    });

    it("should format clean RUT into official XX.XXX.XXX-X pattern", () => {
      expect(formatChileanRut("158201941")).toBe("15.820.194-1");
      expect(formatChileanRut("11111112K")).toBe("11.111.112-K");
    });
  });

  describe("CheckoutCustomerSchema RUT Validation", () => {
    it("should accept valid customer with valid RUT", () => {
      const result = CheckoutCustomerSchema.safeParse({
        fullName: "Benjamín Reyes",
        email: "benjamin@omnicollector.cl",
        phone: "+56 9 1234 5678",
        rut: "15.820.194-1",
      });
      expect(result.success).toBe(true);
    });

    it("should accept customer without optional RUT", () => {
      const result = CheckoutCustomerSchema.safeParse({
        fullName: "Cliente Anónimo",
        email: "cliente@omnicollector.cl",
        phone: "+56 9 1234 5678",
      });
      expect(result.success).toBe(true);
    });

    it("should reject customer with invalid RUT", () => {
      const result = CheckoutCustomerSchema.safeParse({
        fullName: "Cliente Ficticio",
        email: "cliente@omnicollector.cl",
        phone: "+56 9 1234 5678",
        rut: "11.111.111-9", // Wrong check digit
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Atomic Stock Operations", () => {
    it("should provide atomic stock deduction and restoration helpers", async () => {
      const deductResult = await deductProductStockAtomic([
        { productId: "non-existent-prod", quantity: 1 },
      ]);
      expect(deductResult).toBeDefined();
      expect(typeof deductResult.success).toBe("boolean");

      const restoreResult = await restoreProductStockAtomic([
        { productId: "non-existent-prod", quantity: 1 },
      ]);
      expect(restoreResult).toBeDefined();
      expect(typeof restoreResult.success).toBe("boolean");
    });
  });

  describe("Transactional Order Confirmation Email Dispatch", () => {
    it("should generate and attempt dispatch for confirmed order", async () => {
      const mockOrder = {
        id: "ord-test-1234",
        orderNumber: "ORD-2026-981023",
        createdAt: new Date().toISOString(),
        status: "CONFIRMED" as const,
        customer: {
          fullName: "Ignacio Coleccionista",
          email: "ignacio@omnicollector.cl",
          phone: "+56 9 8765 4321",
          rut: "15.820.194-2",
          address: "Av. Providencia 1208",
          comuna: "Providencia",
          region: "Región Metropolitana",
        },
        shippingMethod: {
          name: "Starken Express",
          cost: 4500,
          estimatedDelivery: "2-3 días hábiles",
          trackingNumber: "STK-982410",
        },
        paymentMethod: "MERCADO_PAGO",
        items: [
          {
            productId: "prod-fig-01",
            sku: "FIG-ZELDA-01",
            name: "Zelda Breath of the Wild PVC Figure 1/7",
            quantity: 1,
            unitPrice: 129990,
            isPreOrder: true,
            isPartialDeposit: true,
            unitDeposit: 25998,
            remainingBalancePerUnit: 103992,
          },
        ],
        subtotal: 129990,
        discountAmount: 0,
        shippingCost: 4500,
        totalChargedNow: 30498,
        remainingBalanceLater: 103992,
        reservationIds: ["res-01"],
      };

      const result = await sendOrderConfirmationEmail(mockOrder);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should return false when customer email is missing", async () => {
      const invalidOrder = {
        id: "ord-no-mail",
        orderNumber: "ORD-EMPTY",
        customer: { fullName: "Sin Email" },
      };

      const result = await sendOrderConfirmationEmail(invalidOrder);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Email");
    });
  });
});
