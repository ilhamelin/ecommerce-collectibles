"use client";

import React, { useState } from "react";
import { CreditCard, Clock, CheckCircle2, ChevronRight, Calculator, ShieldCheck } from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";

interface InstallmentCalculatorProps {
  price: number;
  isPreOrder?: boolean;
  depositPercent?: number; // e.g. 0.2
}

export function InstallmentCalculator({
  price,
  isPreOrder = false,
  depositPercent = 0.2,
}: InstallmentCalculatorProps) {
  const [selectedInstallment, setSelectedInstallment] = useState<number>(3);

  // Pre-order calculation
  const depositAmount = Math.round(price * depositPercent);
  const remainingBalance = price - depositAmount;

  // Installment calculation for cash or deposit
  const activeBase = isPreOrder ? depositAmount : price;
  const installmentAmount = Math.round(activeBase / selectedInstallment);

  return (
    <div className="rounded-2xl bg-white border border-[#E5E5E5] p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-[#1A1A1A] block">
              Simulador de Cuotas & Medios de Pago
            </span>
            <span className="text-[10px] text-[#666666]">
              Tarjetas bancarias chilenas sin interés vía Mercado Pago / Webpay
            </span>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
          0% Interés
        </span>
      </div>

      {/* Pre-Order Two-Step Timeline (if applicable) */}
      {isPreOrder && (
        <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
            <span className="flex items-center gap-1.5 text-[#FF6B35]">
              <Clock className="w-3.5 h-3.5" />
              Cronograma de Pago Preventa (Pie {Math.round(depositPercent * 100)}%)
            </span>
            <span className="font-mono text-emerald-600">Total: {formatCLP(price)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Step 1 */}
            <div className="p-2.5 rounded-lg bg-white border border-[#FF6B35]/40 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-[#FF6B35] uppercase block">
                Paso 1: Hoy en CLP
              </span>
              <div className="text-base font-black text-[#1A1A1A] font-mono">
                {formatCLP(depositAmount)}
              </div>
              <p className="text-[10px] text-[#666666] leading-tight">
                Congela tu cupo oficial contra variaciones del dólar.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E5E5] shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-[#1F3A5F] uppercase block">
                Paso 2: Al Arribar
              </span>
              <div className="text-base font-black text-[#1A1A1A] font-mono">
                {formatCLP(remainingBalance)}
              </div>
              <p className="text-[10px] text-[#666666] leading-tight">
                Cancela el saldo cuando la figura llegue a Santiago.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Installment Selector Tabs */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-[#1A1A1A] block">
          Paga {isPreOrder ? "el pie inicial" : "tu pedido"} en cuotas mensuales:
        </span>
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {[1, 3, 6, 12].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedInstallment(num)}
              className={`py-2 px-1 rounded-xl text-center font-bold border transition ${
                selectedInstallment === num
                  ? "bg-[#1F3A5F] text-white border-[#1F3A5F] shadow-xs"
                  : "bg-[#FAFAFA] text-[#555555] border-[#E5E5E5] hover:border-[#1F3A5F] hover:text-[#1A1A1A]"
              }`}
            >
              {num === 1 ? "Al Contado" : `${num} Cuotas`}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Quote Calculation Summary */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#666666] uppercase font-bold block">
            {selectedInstallment === 1 ? "Pago Único al Contado" : `Monto por Cuota (${selectedInstallment}x)`}
          </span>
          <div className="text-lg font-black text-[#FF6B35] font-mono">
            {formatCLP(installmentAmount)}
            {selectedInstallment > 1 && <span className="text-xs text-[#666666] font-normal"> / mes</span>}
          </div>
        </div>

        <div className="text-right text-[10px] text-[#666666]">
          <span className="block font-bold text-[#1A1A1A]">Monto Total CLP:</span>
          <span className="font-mono font-bold text-[#1A1A1A]">{formatCLP(activeBase)}</span>
        </div>
      </div>

      {/* Chilean Payment Methods Supported Badges */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F0F0F0] text-[10px] text-[#737373]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pago seguro con cifrado bancario</span>
        </div>
        <div className="flex items-center gap-1 font-mono font-bold text-[#1F3A5F]">
          <span>WEBPAY</span>
          <span>•</span>
          <span>MERCADOPAGO</span>
          <span>•</span>
          <span>VISA / MC</span>
        </div>
      </div>
    </div>
  );
}
