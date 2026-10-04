import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canReadOrder } from "@/lib/auth/orderAccess";
import { getOrderByIdFromFirestore, updateOrderInFirestore } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { initiatePaymentGateway, PaymentGatewayUnavailableError } from "@/lib/payments/payment-gateway";
const input = z.object({ paymentMethod: z.enum(["MERCADO_PAGO", "WEBPAY"]).default("MERCADO_PAGO") }).strict();
export const dynamic = "force-dynamic";
/** Starts payment only. Balance fields are changed exclusively by provider confirmation. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
 try {
  const order = await getOrderByIdFromFirestore(params.id);
  if (!order) return NextResponse.json({ error: "Pedido no disponible." }, { status: 404 });
  if (!await canReadOrder(req, order)) return NextResponse.json({ error: "No tienes acceso a este pedido." }, { status: 403 });
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Selecciona una pasarela válida; no envíes un ID de pago." }, { status: 400 });
  if (order.status === "CANCELLED" || order.paymentStatus !== "PAID") return NextResponse.json({ error: "El abono inicial debe estar confirmado y el pedido activo." }, { status: 409 });
  if (order.balancePaid || order.remainingBalanceLater <= 0) return NextResponse.json({ success: true, alreadyPaid: true });
  if (!adminDb) return NextResponse.json({ error: "La persistencia del pago no está disponible." }, { status: 503 });
  const gateway = order.balanceCheckoutGateway?.gatewayName === (parsed.data.paymentMethod === "WEBPAY" ? "FLOW" : "MERCADO_PAGO") ? order.balanceCheckoutGateway : await initiatePaymentGateway({ ...order, id: order.id + "~balance", paymentMethod: parsed.data.paymentMethod, totalChargedNow: order.remainingBalanceLater, shippingCost: 0, shippingMethod: { ...order.shippingMethod, cost: 0 }, items: [{ productId: order.id, sku: "SALDO", name: "Saldo de preventa " + order.orderNumber, quantity: 1, unitPrice: order.remainingBalanceLater, isPreOrder: false, isPartialDeposit: false, unitDeposit: 0, remainingBalancePerUnit: 0 }] }, req.nextUrl.origin);
  const saved = await updateOrderInFirestore(order.id, { balanceCheckoutGateway: gateway });
  if (saved === false) throw new Error("No se pudo persistir la pasarela del saldo.");
  return NextResponse.json({ success: true, gateway, message: "Saldo pendiente hasta confirmación de la pasarela." }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) {
  return NextResponse.json({ error: error instanceof PaymentGatewayUnavailableError ? error.message : "No se pudo iniciar el pago del saldo." }, { status: 503 });
 }
}
