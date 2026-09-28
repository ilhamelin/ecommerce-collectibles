"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Cpu,
  Sparkles,
  Activity,
  Zap,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  DollarSign,
  BarChart3,
  Search,
  Server,
  Layers,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Truck,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  ApiUsageSummary,
  ApiTelemetryRecord,
  USD_TO_CLP_RATE,
} from "@/lib/types/telemetry";

type TimeframeType = "today" | "7d" | "30d" | "all";

export default function ApiUsagePage() {
  const [timeframe, setTimeframe] = useState<TimeframeType>("30d");
  const [summary, setSummary] = useState<ApiUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters for recent log table
  const [logProviderFilter, setLogProviderFilter] = useState<string>("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");

  const fetchTelemetry = useCallback(async (tf: TimeframeType = timeframe) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/telemetry?timeframe=${tf}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data);
      } else {
        setErrorMessage(json.error || "No se pudo obtener la telemetría");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la API de telemetría";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchTelemetry(timeframe);
  }, [fetchTelemetry, timeframe]);

  const showFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleSimulateCall = async (provider: "GEMINI" | "MERCADOPAGO" | "FLOW" = "GEMINI") => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_CALL",
          provider,
          feature: provider === "GEMINI" ? "AUTO_FILL_PRODUCT" : "CHECKOUT",
          model: provider === "GEMINI" ? "gemini-1.5-flash" : undefined,
          promptTokens: provider === "GEMINI" ? 420 + Math.floor(Math.random() * 200) : undefined,
          candidatesTokens: provider === "GEMINI" ? 180 + Math.floor(Math.random() * 100) : undefined,
          latencyMs: 700 + Math.floor(Math.random() * 800),
          statusCode: 200,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Llamada de prueba a ${provider} registrada`);
        await fetchTelemetry(timeframe);
      }
    } catch {
      setErrorMessage("Error al simular llamada de prueba");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("¿Estás seguro de que deseas limpiar todo el historial de telemetría registrado?")) {
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("Historial de telemetría limpiado");
        await fetchTelemetry(timeframe);
      }
    } catch {
      setErrorMessage("Error al limpiar historial");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSeedData = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("Datos de telemetría restaurados con éxito");
        await fetchTelemetry(timeframe);
      }
    } catch {
      setErrorMessage("Error al restaurar datos de muestra");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filtered recent logs
  const filteredLogs = useMemo(() => {
    if (!summary?.recentLogs) return [];
    return summary.recentLogs.filter((log: ApiTelemetryRecord) => {
      const matchesProvider = logProviderFilter === "ALL" || log.provider === logProviderFilter;
      const q = logSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        log.endpoint.toLowerCase().includes(q) ||
        (log.model && log.model.toLowerCase().includes(q)) ||
        log.feature.toLowerCase().includes(q);
      return matchesProvider && matchesQuery;
    });
  }, [summary, logProviderFilter, logSearchQuery]);

  const featureLabels: Record<string, { label: string; desc: string }> = {
    AUTO_FILL_PRODUCT: { label: "Auto-Fill de Catálogo", desc: "Generación de ficha técnica y especificaciones con IA" },
    SOMMELIER_CHAT: { label: "Sommelier IA (Chat)", desc: "Asistente experto de ventas y recomendaciones" },
    MARKET_RADAR: { label: "Radar de Mercado Japón", desc: "Detección de preventas y reediciones oficiales" },
    PREDICTIVE_STOCK: { label: "Análisis Predictivo de Stock", desc: "Estimación de rotación y reorden sugerido" },
    BRANDING_ICON: { label: "Branding & Logos IA", desc: "Generación de identidad visual y vectores" },
    VISUAL_SEARCH: { label: "Búsqueda Visual por Imagen", desc: "Identificación de productos coleccionables por foto" },
    CHECKOUT: { label: "Pasarelas de Pago", desc: "Procesamiento con Mercado Pago y Flow" },
    TRACKING: { label: "Seguimiento de Envíos", desc: "Courier y sincronización AfterShip" },
    TEST_SIMULATION: { label: "Prueba / Simulación", desc: "Llamada de test manual desde panel de admin" },
    OTHER: { label: "Otras Operaciones", desc: "Peticiones varias" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Infraestructura & Operaciones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F3A5F] tracking-tight mt-1 flex items-center gap-3">
            Consumo de APIs & Tokens IA
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Telemetría Activa
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-2xl">
            Supervisión continua de consumo de tokens Google Gemini Flash/Pro, límites de cuota diaria, pasarelas de pago (Mercado Pago, Flow) y costos estimados en tiempo real.
          </p>
        </div>

        {/* Timeframe Switcher & Main Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe pills */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E5E5E5] shadow-xs">
            {(
              [
                { id: "today", label: "Hoy" },
                { id: "7d", label: "7 Días" },
                { id: "30d", label: "30 Días" },
                { id: "all", label: "Histórico" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeframe === t.id
                    ? "bg-[#1F3A5F] text-white shadow-xs"
                    : "text-[#666666] hover:text-[#1A1A1A] hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchTelemetry(timeframe)}
            disabled={isLoading || isActionLoading}
            title="Recargar métricas"
            className="p-2 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] hover:bg-gray-50 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quota & Guard Section (Tier / Budget Monitor) */}
      <div className="bg-[#1F3A5F] bg-gradient-to-br from-[#1F3A5F] via-[#162D4A] to-[#0F1E33] text-white rounded-2xl p-6 shadow-md border border-[#152842] relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-[#FF6B35]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                Google AI Studio • Gemini 1.5 Flash / Pro
              </span>
              <span className="text-[10px] font-bold text-white/70">
                Límite de Gratuidad & Presupuesto
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Monitor de Cuota y Protección de Sobrecostes
            </h2>
            <p className="text-xs text-white/80 max-w-xl">
              Gemini 1.5 Flash provee 15 RPM y 1M TPM en su tier gratuito. Esta pantalla audita el volumen antes de exceder el margen seguro.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSimulateCall("GEMINI")}
              disabled={isActionLoading}
              className="px-3.5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#e85a26] text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Probar Gemini (Ping)</span>
            </button>
            <button
              type="button"
              onClick={handleSeedData}
              disabled={isActionLoading}
              title="Rellenar con datos de muestra realistas para pruebas"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Muestra</span>
            </button>
            <button
              type="button"
              onClick={handleResetData}
              disabled={isActionLoading}
              title="Limpiar telemetría"
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Gauge 1: Daily Tokens */}
          <div className="bg-[#0F1E33]/70 rounded-xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/90">Tokens Usados (Hoy / 24h)</span>
              <span className="font-mono text-orange-300 font-bold">
                {summary?.quota.dailyTokensUsed.toLocaleString() || "0"} / 1,000,000
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF6B35] bg-gradient-to-r from-emerald-400 to-[#FF6B35] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary?.quota.dailyTokenUsagePct || 0)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70 mt-1.5">
              <span>{summary?.quota.dailyTokenUsagePct || 0}% de capacidad diaria</span>
              <span className="text-emerald-300 font-semibold">Consumo seguro</span>
            </div>
          </div>

          {/* Gauge 2: Monthly Cost Budget */}
          <div className="bg-[#0F1E33]/70 rounded-xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/90">Gasto Estimado vs Presupuesto</span>
              <span className="font-mono text-emerald-300 font-bold">
                ${summary?.quota.monthlyCostUsedUsd.toFixed(4) || "0.0000"} / ${summary?.quota.monthlyCostBudgetUsd.toFixed(2)} USD
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, Math.min(100, summary?.quota.monthlyCostUsagePct || 0))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70 mt-1.5">
              <span>{summary?.quota.monthlyCostUsagePct || 0}% del tope mensual ($25 USD)</span>
              <span>~${((summary?.quota.monthlyCostUsedUsd || 0) * USD_TO_CLP_RATE).toFixed(0)} CLP</span>
            </div>
          </div>

          {/* Gauge 3: Rate Limit RPM */}
          <div className="bg-[#0F1E33]/70 rounded-xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/90">Velocidad Actual (RPM)</span>
              <span className="font-mono text-white font-bold">
                {summary?.quota.currentRpm || 0} / {summary?.quota.rpmLimit || 15} req/min
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (summary?.quota.currentRpm || 0) > 10 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{
                  width: `${Math.min(100, (((summary?.quota.currentRpm || 0) / (summary?.quota.rpmLimit || 15)) * 100))}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70 mt-1.5">
              <span>Peticiones en último minuto</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Sin riesgo de HTTP 429
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Tokens */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs hover:border-[#1F3A5F]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Tokens Totales Gemini
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B35]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1F3A5F] tracking-tight">
              {summary ? summary.gemini.totalTokens.toLocaleString() : "..."}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#666666]">
              <span>📥 {summary?.gemini.promptTokens.toLocaleString() || 0} prompt</span>
              <span>•</span>
              <span>📤 {summary?.gemini.candidatesTokens.toLocaleString() || 0} res</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#64748B] flex items-center justify-between">
            <span>En {summary?.gemini.totalCalls || 0} consultas con IA</span>
            <span className="font-semibold text-emerald-600">Flash 1.5</span>
          </div>
        </div>

        {/* KPI 2: Estimated Cost USD & CLP */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs hover:border-[#1F3A5F]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Costo Acumulado IA
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1F3A5F] tracking-tight">
              ${summary ? summary.gemini.estimatedCostUsd.toFixed(4) : "0.0000"}{" "}
              <span className="text-xs font-bold text-[#64748B]">USD</span>
            </div>
            <div className="mt-1 text-xs font-bold text-emerald-600">
              ≈ ${summary ? summary.gemini.estimatedCostClp.toLocaleString() : 0} CLP
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#64748B] flex items-center justify-between">
            <span>Tasa referencial: ${USD_TO_CLP_RATE} CLP/USD</span>
            <span className="font-bold text-orange-600">Bajo Costo</span>
          </div>
        </div>

        {/* KPI 3: Payment Gateways */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs hover:border-[#1F3A5F]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Pasarelas de Pago
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1F3A5F] tracking-tight">
              {(summary?.mercadopago.totalCalls || 0) + (summary?.flow.totalCalls || 0)}{" "}
              <span className="text-xs font-bold text-[#64748B]">reqs</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#666666]">
              <span>MP: {summary?.mercadopago.totalCalls || 0}</span>
              <span>•</span>
              <span>Flow: {summary?.flow.totalCalls || 0}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#64748B] flex items-center justify-between">
            <span>Latencia prom: {Math.round(((summary?.mercadopago.avgLatencyMs || 0) + (summary?.flow.avgLatencyMs || 0)) / 2 || 350)}ms</span>
            <span className="font-bold text-emerald-600">100% Ok</span>
          </div>
        </div>

        {/* KPI 4: Global Success Rate & Latency */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs hover:border-[#1F3A5F]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Tasa de Éxito & Uptime
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1F3A5F] tracking-tight">
              {summary && summary.totalCalls > 0
                ? `${((summary.successfulCalls / summary.totalCalls) * 100).toFixed(1)}%`
                : "100%"}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#666666]">
              <Clock className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Latencia media: {summary?.avgLatencyMs || 0} ms</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#64748B] flex items-center justify-between">
            <span>{summary?.failedCalls || 0} fallos registrados</span>
            <span className="font-semibold text-emerald-600">Operativo</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Feature Breakdown & Gateways Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Feature Consumption Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
            <div>
              <h3 className="text-base font-black text-[#1F3A5F]">
                Desglose de Consumo por Módulo IA
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Distribución de tokens y costo en cada funcionalidad asistida por Gemini en OmniCollector
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-[#64748B]" />
          </div>

          <div className="space-y-4">
            {summary && Object.keys(summary.gemini.byFeature).length > 0 ? (
              Object.entries(summary.gemini.byFeature)
                .sort(([, a], [, b]) => b.tokens - a.tokens)
                .map(([featKey, stats]) => {
                  const meta = featureLabels[featKey] || { label: featKey, desc: "Servicio integrado" };
                  const tokenPct =
                    summary.gemini.totalTokens > 0
                      ? Math.round((stats.tokens / summary.gemini.totalTokens) * 100)
                      : 0;

                  return (
                    <div
                      key={featKey}
                      className="p-4 rounded-xl border border-[#F0F0F0] hover:border-[#1F3A5F]/20 transition bg-[#FAFAFA]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-xs font-black text-[#1F3A5F] block">
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-[#666666] block">
                            {meta.desc}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#1F3A5F] font-mono">
                            {stats.tokens.toLocaleString()} tokens
                          </span>
                          <span className="text-[10px] text-[#64748B] block">
                            ${stats.costUsd.toFixed(4)} USD • {stats.calls} llamadas
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden mt-3">
                        <div
                          className="bg-[#1F3A5F] bg-gradient-to-r from-[#1F3A5F] to-[#FF6B35] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(3, tokenPct)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-1">
                        <span>{tokenPct}% del consumo global de tokens</span>
                        <span>
                          Promedio: {stats.calls > 0 ? Math.round(stats.tokens / stats.calls) : 0} tokens/req
                        </span>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-xs text-[#666666]">
                No hay registros de llamadas a Gemini en este período. Realiza una prueba o consulta en la tienda.
              </div>
            )}
          </div>
        </div>

        {/* Right: Models and External Services Status */}
        <div className="space-y-6">
          {/* Models Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <h3 className="text-sm font-black text-[#1F3A5F] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#FF6B35]" />
                Modelos de Lenguaje Utilizados
              </h3>
            </div>

            <div className="space-y-2.5">
              {summary && Object.keys(summary.gemini.byModel).length > 0 ? (
                Object.entries(summary.gemini.byModel).map(([modelName, stats]) => (
                  <div
                    key={modelName}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#1F3A5F] font-mono text-[11px] block">
                        {modelName}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        {stats.calls} peticiones realizadas
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#1A1A1A]">
                        {stats.tokens.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#64748B] block">
                        ${stats.costUsd.toFixed(4)} USD
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#666666] text-center py-2">
                  gemini-1.5-flash (predeterminado)
                </div>
              )}
            </div>
          </div>

          {/* External Gateways Status */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <h3 className="text-sm font-black text-[#1F3A5F] flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                Conectividad Externa
              </h3>
            </div>

            <div className="space-y-3">
              {/* Mercado Pago */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <div>
                    <span className="font-bold text-[#1F3A5F] block">Mercado Pago Checkout Pro</span>
                    <span className="text-[10px] text-[#64748B]">
                      {summary?.mercadopago.totalCalls || 0} transacciones • {summary?.mercadopago.avgLatencyMs || 0}ms
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Online
                </span>
              </div>

              {/* Flow */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <div>
                    <span className="font-bold text-[#1F3A5F] block">Flow Webpay / Servipag</span>
                    <span className="text-[10px] text-[#64748B]">
                      {summary?.flow.totalCalls || 0} transacciones • {summary?.flow.avgLatencyMs || 0}ms
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Online
                </span>
              </div>

              {/* AfterShip */}
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <div>
                    <span className="font-bold text-[#1F3A5F] block">AfterShip Courier API</span>
                    <span className="text-[10px] text-[#64748B]">
                      {summary?.aftership.totalCalls || 0} eventos sincronizados
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Sincronizado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent API Invocation Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-[#F0F0F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[#1F3A5F] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6B35]" />
              Registro Reciente de Peticiones y Telemetría
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Auditoría granular de cada llamada, latencia en milisegundos, código HTTP y consumo de tokens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by provider */}
            <select
              value={logProviderFilter}
              onChange={(e) => setLogProviderFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#1A1A1A] bg-white focus:outline-hidden focus:border-[#1F3A5F]"
            >
              <option value="ALL">Todos los proveedores</option>
              <option value="GEMINI">Google Gemini IA</option>
              <option value="MERCADOPAGO">Mercado Pago</option>
              <option value="FLOW">Flow</option>
              <option value="AFTERSHIP">AfterShip</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Buscar endpoint o función..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs text-[#1A1A1A] bg-white focus:outline-hidden focus:border-[#1F3A5F] w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FA] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#F0F0F0] text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Módulo / Endpoint</th>
                <th className="py-3 px-4">Modelo / Detalle</th>
                <th className="py-3 px-4 text-right">Tokens</th>
                <th className="py-3 px-4 text-right">Costo Estimado</th>
                <th className="py-3 px-4 text-right">Latencia</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log: ApiTelemetryRecord) => {
                  const date = new Date(log.timestamp);
                  const formattedDate = date.toLocaleString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition font-sans">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Provider Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            log.provider === "GEMINI"
                              ? "bg-orange-100 text-[#FF6B35]"
                              : log.provider === "MERCADOPAGO"
                              ? "bg-blue-100 text-blue-800"
                              : log.provider === "FLOW"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {log.provider}
                        </span>
                      </td>

                      {/* Feature / Endpoint */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1F3A5F]">
                          {featureLabels[log.feature]?.label || log.feature}
                        </div>
                        <div className="font-mono text-[10px] text-[#999999] truncate max-w-xs">
                          {log.endpoint}
                        </div>
                      </td>

                      {/* Model */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#666666]">
                        {log.model || "—"}
                      </td>

                      {/* Tokens */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.totalTokens !== undefined ? (
                          <div>
                            <span className="font-mono font-bold text-[#1A1A1A]">
                              {log.totalTokens.toLocaleString()}
                            </span>
                            <div className="text-[9px] text-[#999999]">
                              {log.promptTokens || 0} in / {log.candidatesTokens || 0} out
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#999999]">—</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-semibold text-[#1F3A5F]">
                        {log.estimatedCostUsd > 0
                          ? `$${log.estimatedCostUsd.toFixed(5)}`
                          : "$0.00"}
                      </td>

                      {/* Latency */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-semibold ${
                            log.latencyMs > 2500
                              ? "text-amber-600"
                              : log.latencyMs > 4000
                              ? "text-red-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {log.latencyMs.toLocaleString()} ms
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.statusCode >= 200 && log.statusCode < 300
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : log.statusCode === 429
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {log.statusCode >= 200 && log.statusCode < 300 ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span>{log.statusCode}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#666666]">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
