import { NextRequest, NextResponse } from "next/server";
import { reconcileMercadoPagoPayment } from "@/lib/payments/reconcilePayment";
import { paymentReference } from "@/lib/payments/paymentConfirmation";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const reference = params.get("external_reference") || params.get("orderId") || "";
  let orderId: string;
  try { orderId = paymentReference(reference).orderId; } catch { return NextResponse.redirect(new URL("/checkout", req.url)); }
  const id = params.get("payment_id") || params.get("collection_id") || "";
  let status = "pending";
  if (/^\d{1,30}$/.test(id)) {
    try { const result = await reconcileMercadoPagoPayment(id, orderId); status = result.confirmed ? "approved" : "pending"; }
    catch { console.warn("[MP Callback] El pago sigue pendiente de verificación."); }
  }
  // This query is informational. Order views must read the persisted payment status.
  return NextResponse.redirect(new URL(`/order-confirmation/${encodeURIComponent(orderId)}?status=${status}`, req.url));
}
