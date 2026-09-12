"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Zap, Timer, Lock, Key, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";

export function ConcurrencySimulator() {
  const [charizardStock, setCharizardStock] = useState({ available: 1, reserved: 0 });
  const [concurrencyLogs, setConcurrencyLogs] = useState<Array<{ buyer: string; status: "WINNER" | "BLOCKED"; latency: number; error?: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // 15-Minute TTL Timer
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Idempotency State
  const [idempotencyKey, setIdempotencyKey] = useState<string>("idem-clp-9988-stgo");
  const [idempotencyResults, setIdempotencyResults] = useState<Array<{ attempt: number; timestamp: string; orderNumber: string; isCached: boolean }>>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0 && charizardStock.reserved > 0) {
      setCharizardStock({ available: 1, reserved: 0 });
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, charizardStock.reserved]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const runConcurrencyStressTest = async () => {
    setIsSimulating(true);
    setConcurrencyLogs([]);

    setCharizardStock({ available: 1, reserved: 0 });

    const buyers = [
      "Comprador A (Santiago)",
      "Comprador B (Viña del Mar)",
      "Comprador C (Concepción)",
      "Comprador D (Antofagasta)",
      "Comprador E (La Serena)",
    ];

    const promises = buyers.map(async (buyer, idx) => {
      const latency = Math.floor(12 + Math.random() * 25);
      await new Promise((resolve) => setTimeout(resolve, latency));
      return { buyer, latency, idx };
    });

    const outcomes = await Promise.all(promises);
    outcomes.sort((a, b) => a.latency - b.latency);

    let winnerAssigned = false;
    const logs: Array<{ buyer: string; status: "WINNER" | "BLOCKED"; latency: number; error?: string }> = [];

    for (const outcome of outcomes) {
      if (!winnerAssigned) {
        winnerAssigned = true;
        logs.push({
          buyer: outcome.buyer,
          status: "WINNER",
          latency: outcome.latency,
        });
      } else {
        logs.push({
          buyer: outcome.buyer,
          status: "BLOCKED",
          latency: outcome.latency,
          error: "409 INSUFFICIENT_STOCK: Item bloqueado bajo transacción atómica",
        });
      }
    }

    setCharizardStock({ available: 1, reserved: 1 });
    setConcurrencyLogs(logs);
    setIsTimerActive(true);
    setTimeLeft(15 * 60);
    setIsSimulating(false);
  };

  const simulateTTLExpiration = () => {
    setTimeLeft(0);
    setCharizardStock({ available: 1, reserved: 0 });
    setIsTimerActive(false);
  };

  const handleIdempotentCheckout = () => {
    const attempt = idempotencyResults.length + 1;
    const isCached = attempt > 1;

    const existingOrder = idempotencyResults[0]?.orderNumber || `ORD-CLP-${Math.floor(100000 + Math.random() * 900000)}`;

    setIdempotencyResults((prev) => [
      {
        attempt,
        timestamp: new Date().toLocaleTimeString(),
        orderNumber: existingOrder,
        isCached,
      },
      ...prev,
    ]);
  };

  const resetIdempotencyKey = () => {
    setIdempotencyKey(`idem-clp-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`);
    setIdempotencyResults([]);
  };

  return (
    <div className="rounded-2xl p-6 bg-[#092634] border border-[#004E72] shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#004E72]/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#FF6E42] font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Motor C: Checkout Atómico, Prevención de Sobrevendidos & TTL 15m
          </div>
          <h3 className="text-xl font-bold text-[#F9F9F9] mt-1">
            Control de Concurrencia Pesimista (SELECT FOR UPDATE) & Idempotencia
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#05161f] px-3.5 py-2 rounded-xl border border-[#004E72]/50 text-xs font-mono">
            <Timer className={`w-4 h-4 ${isTimerActive ? "text-[#FF6E42] animate-pulse" : "text-[#9bb5c2]"}`} />
            <span className="text-[#9bb5c2]">TTL Countdown:</span>
            <span className={isTimerActive ? "text-[#FF6E42] font-bold" : "text-[#9bb5c2]"}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Race Condition */}
        <div className="p-5 rounded-2xl bg-[#05161f] border border-[#004E72]/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#F9F9F9] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FF6E42]" />
                Caso Borde: 1 Único Charizard PSA 9 ({formatCLP(4890000)})
              </h4>
              <p className="text-xs text-[#9bb5c2] mt-0.5">
                Stock Físico: <strong className="text-[#F9F9F9]">{charizardStock.available}</strong> | Reservado:{" "}
                <strong className={charizardStock.reserved > 0 ? "text-[#FF6E42]" : "text-[#9bb5c2]"}>
                  {charizardStock.reserved}
                </strong>{" "}
                | Libre:{" "}
                <strong className="text-[#F9F9F9]">
                  {charizardStock.available - charizardStock.reserved}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={runConcurrencyStressTest}
              disabled={isSimulating}
              className="text-xs px-4 py-2 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-[#F9F9F9] font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              Simular 5 Compradores Concurrentes en Chile
            </button>

            {charizardStock.reserved > 0 && (
              <button
                onClick={simulateTTLExpiration}
                className="text-xs px-3 py-2 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Forzar Expiración TTL (15 min)
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {concurrencyLogs.length > 0 ? (
              concurrencyLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                    log.status === "WINNER"
                      ? "bg-[#092634] border-[#FF6E42] text-[#F9F9F9] font-bold"
                      : "bg-[#092634] border-[#004E72]/40 text-[#9bb5c2]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {log.status === "WINNER" ? (
                      <CheckCircle className="w-4 h-4 text-[#FF6E42] flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <div>{log.buyer}</div>
                      {log.error && <div className="text-[10px] text-red-400 font-mono">{log.error}</div>}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[#9bb5c2]">{log.latency}ms</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#9bb5c2] p-3 text-center bg-[#092634] rounded-xl border border-[#004E72]/30">
                Haz clic para lanzar 5 compradores simultáneos sobre la misma fila transaccional.
              </div>
            )}
          </div>
        </div>

        {/* Module 2: Idempotency */}
        <div className="p-5 rounded-2xl bg-[#05161f] border border-[#004E72]/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#F9F9F9] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FF6E42]" />
              Idempotencia en Cobro Webpay Plus
            </h4>
            <button
              onClick={resetIdempotencyKey}
              className="text-[11px] text-[#FF6E42] hover:underline font-mono"
            >
              Nueva Clave
            </button>
          </div>

          <div className="bg-[#092634] p-3 rounded-xl border border-[#004E72]/50 text-xs font-mono text-[#F9F9F9] flex items-center justify-between">
            <span className="text-[#9bb5c2]">Idempotency-Key:</span>
            <span className="text-[#FF6E42] font-semibold">{idempotencyKey}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleIdempotentCheckout}
              className="text-xs px-4 py-2 rounded-xl bg-[#004E72] hover:bg-[#FF6E42] text-[#F9F9F9] font-bold transition flex items-center gap-1.5 shadow"
            >
              {idempotencyResults.length === 0 ? "Enviar Checkout Webpay" : "Reintentar con Misma Clave (Simular corte)"}
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {idempotencyResults.length > 0 ? (
              idempotencyResults.map((res, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs flex items-center justify-between border font-mono ${
                    res.isCached
                      ? "bg-[#092634] border-[#004E72] text-[#F9F9F9]"
                      : "bg-[#092634] border-[#FF6E42]/60 text-[#F9F9F9]"
                  }`}
                >
                  <div>
                    <div className="font-bold">
                      Intento #{res.attempt}: {res.orderNumber}
                    </div>
                    <div className="text-[10px] text-[#9bb5c2]">
                      {res.isCached
                        ? "Retornado desde Caché Atómica (Sin duplicar cobro Webpay ni reserva)"
                        : "Procesado Exitosamente (Primera ejecución)"}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#9bb5c2]">{res.timestamp}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#9bb5c2] p-3 text-center bg-[#092634] rounded-xl border border-[#004E72]/30">
                Prueba enviar peticiones repetidas para verificar cómo se evitan dobles cobros en CLP.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
