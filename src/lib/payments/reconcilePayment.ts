import { z } from "zod";
import { getMercadoPagoPayment } from "./mercadopago";
import { confirmVerifiedPayment, PaymentConfirmationError, paymentReference } from "./paymentConfirmation";
import { sendOrderConfirmationEmail } from "@/lib/services/emailService";
const mpPayment = z.object({ id: z.union([z.string(), z.number()]), external_reference: z.string(), status: z.string(), transaction_amount: z.number(), currency_id: z.string(), live_mode: z.boolean() });
/** Browser-return status is ignored. The authenticated provider response is the only payment evidence. */
export async function reconcileMercadoPagoPayment(id: string, expectedOrder?: string) {
  const raw = await getMercadoPagoPayment(id);
  if (!raw) throw new PaymentConfirmationError("No se pudo consultar el pago; reintenta.", 503);
  const parsed = mpPayment.safeParse(raw); if (!parsed.success) throw new PaymentConfirmationError("Respuesta de pago incompleta.", 503);
  const payment = parsed.data;
  if (String(payment.id) !== id || expectedOrder && paymentReference(payment.external_reference).orderId !== expectedOrder) throw new PaymentConfirmationError("El pago corresponde a otra operación.");
  if (payment.status !== "approved") return { confirmed: false, status: payment.status };
  const result = await confirmVerifiedPayment({ provider: "MERCADO_PAGO", id, reference: payment.external_reference, amount: payment.transaction_amount, currency: payment.currency_id, approved: true, live: payment.live_mode });
  if (!result.idempotent && !payment.external_reference.endsWith("~balance")) await sendOrderConfirmationEmail(result.order).catch(() => console.warn("[Payment] Pago confirmado; correo no enviado."));
  return { confirmed: true, status: "approved", idempotent: result.idempotent };
}
