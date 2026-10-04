"use client";
import React, { useState } from "react";
import { identityHeaders } from "@/lib/auth/clientIdentity";
export function BalancePaymentButton({ orderId }: { orderId: string }) {
 const [busy, setBusy] = useState(false); const [error, setError] = useState("");
 async function pay() {
  setBusy(true); setError("");
  try {
   const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/settle-balance`, { method: "POST", headers: { "Content-Type": "application/json", ...await identityHeaders() }, body: JSON.stringify({ paymentMethod: "MERCADO_PAGO" }) });
   const body = await res.json() as { success?: boolean; alreadyPaid?: boolean; gateway?: { redirectUrl: string | null }; error?: string };
   if (!res.ok || !body.success) throw new Error(body.error || "No se pudo iniciar el pago.");
   if (body.alreadyPaid) { setError("El saldo ya está pagado. Actualiza tus pedidos."); return; }
   const url = body.gateway?.redirectUrl; if (!url) throw new Error("La pasarela no devolvió un enlace de pago.");
   window.location.assign(url);
  } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo iniciar el pago."); }
  finally { setBusy(false); }
 }
 return <div><button type="button" disabled={busy} onClick={() => void pay()} className="rounded-xl bg-[#FF6B35] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Abriendo pasarela…" : "Pagar saldo con Mercado Pago"}</button>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}</div>;
}
