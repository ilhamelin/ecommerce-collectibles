import type { ZodIssue } from "zod";

const checkoutFieldLabels: Record<string, string> = {
  fullName: "Nombre", email: "Correo electrónico", phone: "Teléfono", rut: "RUT",
  region: "Región", comuna: "Comuna", address: "Dirección", apartment: "Departamento",
  items: "Carrito", productId: "Producto", quantity: "Cantidad", paymentMethod: "Método de pago",
  cartSessionId: "Sesión del carrito", userId: "Cliente", idempotencyKey: "Identificador del pedido",
  cost: "Costo de envío", customDepositPercent: "Porcentaje de reserva",
};

/** Formats field errors without returning customer values or a serialized exception. */
export function formatCheckoutValidationIssues(issues: readonly Pick<ZodIssue, "path" | "message">[]): string {
  const messages = issues.map(issue => {
    const field = [...issue.path].reverse().find(part => typeof part === "string");
    const label = typeof field === "string" ? checkoutFieldLabels[field] : undefined;
    return label && !issue.message.toLocaleLowerCase("es").startsWith(label.toLocaleLowerCase("es"))
      ? `${label}: ${issue.message}` : issue.message;
  });
  return `Revisa los datos de la compra: ${[...new Set(messages)].slice(0, 3).join(". ") || "faltan datos obligatorios"}.`;
}
