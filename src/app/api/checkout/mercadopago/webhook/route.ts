import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyMercadoPagoSignature } from "@/lib/payments/mercadoPagoSignature";
import { reconcileMercadoPagoPayment } from "@/lib/payments/reconcilePayment";
import { PaymentConfirmationError } from "@/lib/payments/paymentConfirmation";
export const dynamic = "force-dynamic";
const bodySchema = z.object({ type: z.string().optional(), action: z.string().optional(), simulated: z.boolean().optional(), data: z.object({ id: z.union([z.string(), z.number()]) }).optional() }).passthrough();
export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Notificación inválida." }, { status: 400 });
    if (parsed.data.simulated) return NextResponse.json({ error: "No se aceptan pagos simulados en el webhook." }, { status: 403 });
    const queryId = req.nextUrl.searchParams.get("data.id");
    const id = queryId || (parsed.data.data ? String(parsed.data.data.id) : "");
    if (!/^\d{1,30}$/.test(id) || parsed.data.data && String(parsed.data.data.id) !== id) return NextResponse.json({ error: "ID de pago inválido." }, { status: 400 });
    if (!process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()) return NextResponse.json({ error: "Firma de webhook no configurada." }, { status: 503 });
    if (!verifyMercadoPagoSignature(id, req.headers.get("x-request-id"), req.headers.get("x-signature"), process.env.MERCADOPAGO_WEBHOOK_SECRET)) return NextResponse.json({ error: "Firma de webhook inválida." }, { status: 403 });
    const topic = parsed.data.type || req.nextUrl.searchParams.get("type");
    if (topic !== "payment" && !parsed.data.action?.startsWith("payment.")) return NextResponse.json({ received: true, ignored: true });
    const result = await reconcileMercadoPagoPayment(id);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.warn("[MP Webhook] Confirmación no completada.");
    return NextResponse.json({ error: error instanceof PaymentConfirmationError ? error.message : "No se pudo persistir el pago." }, { status: error instanceof PaymentConfirmationError ? error.status : 503 });
  }
}
