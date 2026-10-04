import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFlowPaymentStatus } from "@/lib/payments/flow";
import { confirmVerifiedPayment, PaymentConfirmationError } from "@/lib/payments/paymentConfirmation";
import { getOrderByIdFromFirestore } from "@/lib/firebase/firestore";
import { sendOrderConfirmationEmail } from "@/lib/services/emailService";
export const dynamic = "force-dynamic";
const paymentSchema = z.object({ flowOrder: z.number().int().positive(), commerceOrder: z.string(), status: z.number().int(), currency: z.string(), amount: z.number() });
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData(); const token = form.get("token");
    if (typeof token !== "string" || !/^[a-zA-Z0-9_-]{10,200}$/.test(token)) return NextResponse.json({ error: "Token inválido." }, { status: 400 });
    const parsed = paymentSchema.safeParse(await getFlowPaymentStatus(token));
    if (!parsed.success) return NextResponse.json({ error: "No se pudo comprobar el pago en Flow." }, { status: 503 });
    const payment = parsed.data;
    if (payment.status !== 2) return NextResponse.json({ received: true, confirmed: false });
    // Legacy Flow references used orderNumber. Resolve them before the transaction.
    const balance = payment.commerceOrder.endsWith("~balance");
    const reference = balance ? payment.commerceOrder.slice(0, -8) : payment.commerceOrder;
    const order = await getOrderByIdFromFirestore(reference);
    if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    const result = await confirmVerifiedPayment({ provider: "FLOW", id: String(payment.flowOrder), reference: order.id + (balance ? "~balance" : ""), amount: payment.amount, currency: payment.currency, approved: true, live: process.env.FLOW_SANDBOX_MODE === "false" });
    if (!result.idempotent && !balance) await sendOrderConfirmationEmail(result.order).catch(() => console.warn("[Flow] Pago confirmado; correo no enviado."));
    return NextResponse.json({ received: true, confirmed: true, idempotent: result.idempotent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PaymentConfirmationError ? error.message : "No se pudo confirmar el pago." }, { status: error instanceof PaymentConfirmationError ? error.status : 503 });
  }
}
