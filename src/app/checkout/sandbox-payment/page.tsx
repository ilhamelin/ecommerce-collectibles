"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Info,
  Clock,
  HelpCircle,
} from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";

function SandboxPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const amountParam = searchParams.get("amount") || "0";
  const amount = Number(amountParam) || 0;
  const mode = searchParams.get("mode") || "";
  const isBalanceSettlement = mode === "balance_settlement";

  const [cardNumber, setCardNumber] = useState("4025 8011 2233 4455");
  const [cardHolder, setCardHolder] = useState("TITULAR DE PRUEBA");
  const [cardExpiry, setCardExpiry] = useState("11/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [installments, setInstallments] = useState("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimulatePayment = async (status: "approved" | "rejected") => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (status === "rejected") {
        setTimeout(() => {
          setIsProcessing(false);
          setErrorMsg("Tarjeta rechazada: Fondos insuficientes o límite excedido (Simulación).");
        }, 1200);
        return;
      }

      if (isBalanceSettlement) {
        // Process balance settlement
        const response = await fetch(`/api/orders/${orderId}/settle-balance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: "Mercado Pago (Tarjeta Sandbox)",
            paymentId: `SIM-BAL-${Date.now()}`,
          }),
        });
        const data = await response.json();
        if (!data.success) {
          setIsProcessing(false);
          setErrorMsg(data.message || "Error al liquidar el saldo del pedido.");
          return;
        }

        setTimeout(() => {
          router.push(`/account?tab=orders&settled=true&orderId=${encodeURIComponent(orderId)}`);
        }, 1500);
        return;
      }

      // Simulate normal checkout payment confirmation via webhook/update endpoint
      const response = await fetch("/api/checkout/mercadopago/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment",
          action: "payment.created",
          data: {
            id: `SIM-MP-${Date.now()}`,
          },
          simulated: true,
          orderId,
          paymentDetails: {
            status: "approved",
            status_detail: "accredited",
            payment_method_id: "visa",
            payment_type_id: "credit_card",
            installments: Number(installments),
            transaction_amount: amount,
            card: {
              last_four_digits: cardNumber.replace(/\s/g, "").slice(-4) || "4455",
            },
          },
        }),
      });

      setTimeout(() => {
        router.push(`/order-confirmation/${orderId}?status=approved&payment_id=SIM-MP-${Date.now()}`);
      }, 1500);
    } catch (err) {
      setIsProcessing(false);
      setErrorMsg("Error al conectar con la pasarela.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Top Banner explaining Sandbox */}
      <div className="p-4 rounded-2xl bg-[#1F3A5F]/5 border border-[#1F3A5F]/20 flex items-start gap-3 shadow-sm">
        <Sparkles className="w-5 h-5 text-[#FF6B35] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <strong className="text-[#1F3A5F] font-black uppercase tracking-wider">
              {isBalanceSettlement
                ? "Liquidación de Saldo Pre-Venta (80%) • Mercado Pago Chile"
                : "Entorno Sandbox de Cobro con Tarjeta • Mercado Pago Chile"}
            </strong>
            <span className="px-2 py-0.5 rounded-full bg-[#FF6B35] text-white font-black text-[10px]">
              MODO PRUEBAS
            </span>
          </div>
          <p className="text-[#666666]">
            {isBalanceSettlement
              ? `Estás completando el pago del saldo final pendiente del pedido ${orderId}. Al autorizar la transacción, tu pedido quedará 100% pagado y pasará a fase de preparación para despacho.`
              : "Esta pantalla interactiva te permite validar el flujo completo de cobro con tarjeta en pesos chilenos (CLP) y confirmación automática en Cloud Firestore."}
          </p>
        </div>
      </div>

      {/* Payment Gateway Box */}
      <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Gateway Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009EE3] flex items-center justify-center text-white font-black text-xs shadow">
              MP
            </div>
            <div>
              <h1 className="text-lg font-black text-[#1A1A1A]">
                {isBalanceSettlement ? "Liquidación de Saldo Pendiente" : "Pasarela de Pago Segura"}
              </h1>
              <p className="text-xs text-[#666666]">Mercado Pago • Transbank Webpay Plus • Tarjetas</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#666666] block uppercase tracking-wider font-semibold">
              {isBalanceSettlement ? "Saldo a Liquidar" : "Total a Pagar"}
            </span>
            <span className="font-mono text-xl font-black text-[#FF6B35]">
              {formatCLP(amount)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D64545] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Card Details Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
              Número de Tarjeta (Visa de Prueba Oficial)
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] font-mono focus:border-[#FF6B35] focus:bg-white focus:outline-none"
              />
              <CreditCard className="w-4 h-4 text-[#666666] absolute right-4 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                Nombre del Titular (Como aparece en la tarjeta)
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:border-[#FF6B35] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Vencimiento</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] font-mono focus:border-[#FF6B35] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Código de Seguridad (CVV)</label>
              <input
                type="password"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] font-mono focus:border-[#FF6B35] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Cuotas sin Interés en Chile</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:border-[#FF6B35] focus:bg-white focus:outline-none"
              >
                <option value="1">1 Cuota de {formatCLP(amount)}</option>
                <option value="3">3 Cuotas sin interés de {formatCLP(Math.round(amount / 3))}</option>
                <option value="6">6 Cuotas sin interés de {formatCLP(Math.round(amount / 6))}</option>
                <option value="12">12 Cuotas sin interés de {formatCLP(Math.round(amount / 12))}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleSimulatePayment("approved")}
            className="w-full py-4 rounded-xl bg-[#009EE3] hover:bg-[#0089c7] text-white font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="animate-pulse">Procesando pago con tarjeta...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pagar {formatCLP(amount)} con Mercado Pago</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSimulatePayment("rejected")}
              className="text-xs text-[#D64545] hover:underline font-semibold"
            >
              Simular fallo de tarjeta (rechazo)
            </button>

            <Link
              href="/checkout"
              className="text-xs text-[#666666] hover:text-[#1A1A1A] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancelar y volver
            </Link>
          </div>
        </div>
      </div>

      {/* Guide Box for Credentials */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] text-xs text-[#666666] space-y-2 shadow-sm">
        <h4 className="font-bold text-[#1F3A5F] flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#009EE3]" />
          ¿Cómo activar la redirección externa directa a Mercado Pago?
        </h4>
        <p>
          En cuanto copies tu <strong className="text-[#1A1A1A]">Access Token</strong> (`TEST-...`) de Mercado Pago Developers, pégalo en tu archivo <strong className="text-[#1A1A1A]">.env.local</strong> en la variable <code className="text-[#FF6B35] font-semibold">MERCADOPAGO_ACCESS_TOKEN</code>.
        </p>
        <p className="text-[11px] text-[#888888]">
          La tienda cambiará automáticamente a la pasarela externa oficial de Mercado Pago Chile.
        </p>
      </div>
    </div>
  );
}

export default function SandboxPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#1F3A5F]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-[#666666] mt-3">Cargando pasarela de pago segura...</p>
        </div>
      }
    >
      <SandboxPaymentContent />
    </Suspense>
  );
}
