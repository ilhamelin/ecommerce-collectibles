import { describe, expect, it } from "vitest";
import { CheckoutCustomerSchema } from "../src/lib/validations/schemas";
import { formatCheckoutValidationIssues } from "../src/lib/utils/checkoutValidation";

const customer = { fullName: "Cliente Prueba", email: "checkout@example.com", phone: "+56 9 0000 0000" };
describe("Optional checkout RUT and customer validation", () => {
  it.each([undefined, "", "   "])("accepts an absent or blank RUT without replacing it (%s)", rut => {
    const data = CheckoutCustomerSchema.parse({ ...customer, rut });
    expect(data.rut).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("rut");
  });
  it("preserves a valid RUT and normalizes surrounding whitespace", () => {
    const data = CheckoutCustomerSchema.parse({ fullName: " Cliente Prueba ", email: " checkout@example.com ", phone: " +56 9 0000 0000 ", rut: " 12.345.678-5 " });
    expect(data).toEqual({ ...customer, rut: "12.345.678-5" });
  });
  it.each(["18.420.915-K", "15.820.194-2"])("rejects invalid seeded RUT values with a useful message (%s)", rut => {
    const parsed = CheckoutCustomerSchema.safeParse({ ...customer, rut });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(formatCheckoutValidationIssues(parsed.error.issues)).toContain("RUT chileno inválido");
  });
  it("does not replace missing required customer information with fictitious data", () => {
    expect(CheckoutCustomerSchema.safeParse({ fullName: " ", email: "", phone: "" }).success).toBe(false);
  });
  it("reports the field, limits repeated errors and excludes submitted values", () => {
    const text = formatCheckoutValidationIssues([
      { path: ["customerInfo", "rut"], message: "Dato inválido" },
      { path: ["customerInfo", "rut"], message: "Dato inválido" },
      { path: ["items", 0, "quantity"], message: "Debe ser mayor que cero" },
    ]);
    expect(text).toContain("RUT: Dato inválido");
    expect(text).toContain("Cantidad: Debe ser mayor que cero");
    expect(text.match(/RUT:/g)).toHaveLength(1);
  });
});
