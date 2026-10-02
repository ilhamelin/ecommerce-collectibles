"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PackageSearch, ArrowRight } from "lucide-react";

export default function TrackingLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const identifier = orderNumber.trim();
    if (!/^[a-zA-Z0-9_-]{3,100}$/.test(identifier)) {
      setError("Ingresa el número o identificador de tu pedido, tal como aparece en el comprobante.");
      return;
    }
    router.push(`/tracking/${encodeURIComponent(identifier)}`);
  };
  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <PackageSearch className="w-12 h-12 text-[#FF6B35] mb-5" aria-hidden="true" />
      <h1 className="text-3xl font-black text-[#1F3A5F]">Sigue tu pedido</h1>
      <p className="text-[#666666] mt-3 mb-8">Consulta el estado y los detalles del despacho con el número que recibiste al completar tu compra.</p>
      <form onSubmit={submit} className="rounded-2xl bg-white border border-[#E5E5E5] p-6 space-y-4">
        <label htmlFor="tracking-order" className="block font-bold text-sm">Número de pedido</label>
        <input id="tracking-order" value={orderNumber} onChange={(event) => { setOrderNumber(event.target.value); setError(""); }}
          placeholder="ORD-2026-123456" required maxLength={100} aria-describedby={error ? "tracking-error" : undefined}
          className="w-full rounded-lg border border-[#E5E5E5] p-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" />
        {error && <p id="tracking-error" role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full flex justify-center items-center gap-2 rounded-lg bg-[#FF6B35] text-white p-3 font-bold">
          Consultar pedido <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
      <Link href="/account?tab=orders" className="block mt-6 text-sm text-[#1F3A5F] underline">Ver mis pedidos en mi cuenta</Link>
    </main>
  );
}
