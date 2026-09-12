"use client";

import React, { useState } from "react";
import { Clock, ArrowRight, DollarSign, Send, Check, Bell } from "lucide-react";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";

type PreOrderState =
  | "ANNOUNCED"
  | "PREORDER_OPEN"
  | "MANUFACTURING"
  | "IN_TRANSIT_CUSTOMS"
  | "WAREHOUSE_RECEIVED"
  | "FULFILLED";

const LIFECYCLE_STEPS: Array<{ state: PreOrderState; label: string; desc: string }> = [
  { state: "ANNOUNCED", label: "Anunciado", desc: "Licencia confirmada, preventa aún cerrada" },
  { state: "PREORDER_OPEN", label: "Preventa Abierta", desc: "Acepta reservas con pie del 20% en CLP" },
  { state: "MANUFACTURING", label: "Manufactura", desc: "Producción en Good Smile Company (Japón)" },
  { state: "IN_TRANSIT_CUSTOMS", label: "Tránsito Marítimo", desc: "Carga hacia Valparaíso / Aduanas" },
  { state: "WAREHOUSE_RECEIVED", label: "En Bodega Santiago", desc: "Dispara notificación para liquidar saldo" },
  { state: "FULFILLED", label: "Despachado", desc: "Saldo liquidado y paquete enviado por Starken" },
];

export function PreOrderEngineDemo() {
  const [currentState, setCurrentState] = useState<PreOrderState>("PREORDER_OPEN");
  const [depositMode, setDepositMode] = useState<"PARTIAL_20" | "PARTIAL_30" | "FULL">("PARTIAL_20");
  const [depositStatus, setDepositStatus] = useState<"PARTIALLY_PAID" | "BALANCE_DUE" | "PAID_IN_FULL">("PARTIALLY_PAID");
  const [webhookLog, setWebhookLog] = useState<any | null>(null);

  const figure = {
    sku: "FIG-MAKIMA-17",
    name: "Makima 1/7 Scale PVC Figure (Chainsaw Man)",
    manufacturer: "Good Smile Company",
    scale: "Escala 1/7 (25cm con diorama)",
    fullPrice: 249990,
  };

  const depositPercent = depositMode === "PARTIAL_20" ? 0.2 : depositMode === "PARTIAL_30" ? 0.3 : 1.0;
  const depositPaid = Math.round(figure.fullPrice * depositPercent);
  const remainingBalance = Math.round(figure.fullPrice - depositPaid);

  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.state === currentState);

  const handleAdvanceStep = () => {
    if (currentStepIndex < LIFECYCLE_STEPS.length - 1) {
      const nextState = LIFECYCLE_STEPS[currentStepIndex + 1].state;
      setCurrentState(nextState);

      if (nextState === "WAREHOUSE_RECEIVED" && depositStatus === "PARTIALLY_PAID") {
        setDepositStatus("BALANCE_DUE");
        setWebhookLog({
          event: "preorder.warehouse_received",
          timestamp: new Date().toISOString(),
          product: {
            sku: figure.sku,
            name: figure.name,
          },
          settlementDetails: {
            depositId: "dep-2026-clp-makima-8921",
            orderId: "ORD-2026-CLP-881920",
            customerEmail: "coleccionista.chile@gmail.com",
            originalDepositPaid: formatCLP(depositPaid),
            remainingBalanceDue: formatCLP(remainingBalance),
            settlementDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            paymentUrl: "https://collectibles.cl/checkout/settle/dep-2026-clp-makima-8921",
          },
          dispatchPolicy: "Carga en bodega central Pudahuel. Despacho retenido hasta liquidar saldo.",
        });
      }
    }
  };

  const handleReset = () => {
    setCurrentState("PREORDER_OPEN");
    setDepositStatus("PARTIALLY_PAID");
    setWebhookLog(null);
  };

  const handleSettleBalance = () => {
    setDepositStatus("PAID_IN_FULL");
  };

  return (
    <div className="rounded-2xl p-6 bg-[#092634] border border-[#004E72] shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#004E72]/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#FF6E42] font-semibold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Motor A: Pre-orders Engine (Depósitos Parciales & Saldo en CLP)
          </div>
          <h3 className="text-xl font-bold text-[#F9F9F9] mt-1">
            {figure.name}
          </h3>
          <p className="text-xs text-[#9bb5c2] mt-0.5">
            Fabricante: <span className="text-[#F9F9F9] font-semibold">{figure.manufacturer}</span> • {figure.scale}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-xl bg-[#05161f] border border-[#004E72]/50 text-[#9bb5c2] hover:text-[#F9F9F9] transition"
          >
            Reiniciar Ciclo
          </button>
          <button
            onClick={handleAdvanceStep}
            disabled={currentStepIndex >= LIFECYCLE_STEPS.length - 1}
            className="text-xs px-4 py-1.5 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-[#F9F9F9] transition font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-md"
          >
            Avanzar Estado <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#9bb5c2] mb-3">
          Máquina de Estados de Preventa:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.state}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow"
                    : isCompleted
                    ? "bg-[#05161f] border-[#004E72] text-[#F9F9F9]"
                    : "bg-[#05161f]/40 border-[#004E72]/30 text-[#9bb5c2]/60"
                }`}
              >
                <div className="text-[10px] font-mono text-[#FF6E42] font-semibold mb-1">Paso {idx + 1}</div>
                <div className="text-xs font-bold line-clamp-1">{step.label}</div>
                <div className="text-[10px] text-[#9bb5c2] mt-1 line-clamp-2 leading-tight">
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terms Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#05161f] border border-[#004E72]/50 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#F9F9F9] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#FF6E42]" />
              Modalidad de Reserva en CLP:
            </span>
            <span className="text-xs text-[#9bb5c2]">Total: {formatCLPShort(figure.fullPrice)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDepositMode("PARTIAL_20")}
              className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                depositMode === "PARTIAL_20"
                  ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow"
                  : "bg-[#092634] border-[#004E72]/40 text-[#9bb5c2] hover:text-[#F9F9F9]"
              }`}
            >
              <div>Pie 20%</div>
              <div className="font-mono font-bold mt-1 text-[#FF6E42]">{formatCLPShort(Math.round(figure.fullPrice * 0.2))}</div>
            </button>

            <button
              onClick={() => setDepositMode("PARTIAL_30")}
              className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                depositMode === "PARTIAL_30"
                  ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow"
                  : "bg-[#092634] border-[#004E72]/40 text-[#9bb5c2] hover:text-[#F9F9F9]"
              }`}
            >
              <div>Pie 30%</div>
              <div className="font-mono font-bold mt-1 text-[#FF6E42]">{formatCLPShort(Math.round(figure.fullPrice * 0.3))}</div>
            </button>

            <button
              onClick={() => setDepositMode("FULL")}
              className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                depositMode === "FULL"
                  ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow"
                  : "bg-[#092634] border-[#004E72]/40 text-[#9bb5c2] hover:text-[#F9F9F9]"
              }`}
            >
              <div>Total 100%</div>
              <div className="font-mono font-bold mt-1 text-[#FF6E42]">{formatCLPShort(figure.fullPrice)}</div>
            </button>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-xs border-t border-[#004E72]/30 pt-3">
            <div className="flex justify-between">
              <span className="text-[#9bb5c2]">Pago Inmediato (Pie No Reembolsable):</span>
              <span className="font-mono font-bold text-[#FF6E42]">{formatCLP(depositPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9bb5c2]">Saldo al Arribar a Bodega:</span>
              <span className="font-mono font-bold text-[#F9F9F9]">{formatCLP(remainingBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9bb5c2]">Estado de Obligación:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                  depositStatus === "PAID_IN_FULL"
                    ? "bg-[#004E72] text-[#F9F9F9]"
                    : depositStatus === "BALANCE_DUE"
                    ? "bg-[#FF6E42] text-[#F9F9F9] font-bold animate-pulse"
                    : "bg-[#004E72]/50 text-[#9bb5c2]"
                }`}
              >
                {depositStatus}
              </span>
            </div>
          </div>

          {depositStatus === "BALANCE_DUE" && (
            <div className="bg-[#092634] border border-[#FF6E42] rounded-xl p-3 space-y-2">
              <div className="text-xs text-[#FF6E42] font-semibold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                ¡El lote arribó a bodega en Chile! Saldo pendiente exigible.
              </div>
              <p className="text-[11px] text-[#9bb5c2]">
                El coleccionista debe liquidar los <strong>{formatCLP(remainingBalance)}</strong> antes de habilitar el
                envío físico por Starken.
              </p>
              <button
                onClick={handleSettleBalance}
                className="w-full text-xs py-2 bg-[#FF6E42] hover:bg-[#ff5421] text-[#F9F9F9] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow"
              >
                <Check className="w-3.5 h-3.5" /> Liquidar Saldo Restante ({formatCLP(remainingBalance)})
              </button>
            </div>
          )}
        </div>

        {/* Webhook Payload Inspector */}
        <div className="p-5 rounded-2xl bg-[#05161f] border border-[#004E72]/50 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[#9bb5c2] font-sans border-b border-[#004E72]/30 pb-2">
            <span className="flex items-center gap-1.5 font-semibold text-[#F9F9F9]">
              <Send className="w-3.5 h-3.5 text-[#FF6E42]" />
              Webhook Automático al arribar a WAREHOUSE_RECEIVED
            </span>
            <span className="text-[10px] text-[#FF6E42]">Webpay Ready</span>
          </div>

          {webhookLog ? (
            <pre className="text-[11px] text-[#F9F9F9] overflow-x-auto p-3 rounded-xl bg-[#092634] border border-[#004E72]/50 leading-relaxed max-h-56">
              {JSON.stringify(webhookLog, null, 2)}
            </pre>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-[#9bb5c2]">
              <Clock className="w-8 h-8 mb-2 opacity-30 text-[#004E72]" />
              <p className="text-xs">
                Avanza el ciclo hasta <strong>En Bodega Santiago (WAREHOUSE_RECEIVED)</strong> para disparar el webhook de liquidación.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
