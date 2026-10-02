"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TelemetryResetDialog } from "@/components/admin/TelemetryResetDialog";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import {
  ApiUsageSummary,
  ApiTelemetryRecord,
  USD_TO_CLP_RATE,
} from "@/lib/types/telemetry";

type TimeframeType = "today" | "7d" | "30d" | "all";
type SortFieldType = "timestamp" | "tokens" | "cost" | "latency";
type SortDirectionType = "asc" | "desc";

export default function ApiUsagePage() {
  const [timeframe, setTimeframe] = useState<TimeframeType>("30d");
  const [summary, setSummary] = useState<ApiUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Sorting for recent log table
  const [logProviderFilter, setLogProviderFilter] = useState<string>("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortFieldType>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirectionType>("desc");

  const requestVersion = useRef(0);
  const fetchTelemetry = useCallback(async (tf: TimeframeType = timeframe) => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/telemetry?timeframe=${tf}`, { cache: "no-store" });
      const json = await res.json();
      if (version !== requestVersion.current) return;
      if (res.ok && json.success && json.data) {
        setSummary(json.data);
      } else {
        setErrorMessage(json.error || "No se pudo obtener la telemetría");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la API de telemetría";
      if (version === requestVersion.current) setErrorMessage(msg);
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchTelemetry(timeframe);
  }, [fetchTelemetry, timeframe]);

  const showFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleResetData = async () => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/admin/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback("Historial de telemetría limpiado");
        await fetchTelemetry(timeframe);
      } else {
        setErrorMessage(data.error || "No se pudo limpiar el historial");
      }
    } catch {
      setErrorMessage("Error al limpiar historial");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSortChange = (field: SortFieldType) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc"); // Metrics like tokens, cost, latency sort highest first by default
    }
  };

  const handleSortSelectChange = (value: string) => {
    const [field, direction] = value.split("_") as [SortFieldType, SortDirectionType];
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtered and Sorted recent logs (100% strictly computed from real records)
  const filteredAndSortedLogs = useMemo(() => {
    if (!summary?.recentLogs) return [];
    
    // 1. Filter
    const matched = summary.recentLogs.filter((log: ApiTelemetryRecord) => {
      const matchesProvider = logProviderFilter === "ALL" || log.provider === logProviderFilter;
      const q = logSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        log.endpoint.toLowerCase().includes(q) ||
        (log.model && log.model.toLowerCase().includes(q)) ||
        log.feature.toLowerCase().includes(q);
      return matchesProvider && matchesQuery;
    });

    // 2. Sort
    return matched.sort((a: ApiTelemetryRecord, b: ApiTelemetryRecord) => {
      let comparison = 0;
      if (sortField === "tokens") {
        const aVal = a.totalTokens ?? -1;
        const bVal = b.totalTokens ?? -1;
        comparison = aVal - bVal;
      } else if (sortField === "cost") {
        const aVal = a.estimatedCostUsd ?? 0;
        const bVal = b.estimatedCostUsd ?? 0;
        comparison = aVal - bVal;
      } else if (sortField === "latency") {
        comparison = a.latencyMs - b.latencyMs;
      } else {
        // Default: timestamp
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [summary, logProviderFilter, logSearchQuery, sortField, sortDirection]);

  const featureLabels: Record<string, { label: string; desc: string }> = {
    AUTO_FILL_PRODUCT: { label: "Auto-Fill de Catálogo", desc: "Generación de ficha técnica y especificaciones con IA" },
    SOMMELIER_CHAT: { label: "Sommelier IA (Chat)", desc: "Asistente experto de ventas y recomendaciones" },
    MARKET_RADAR: { label: "Radar de Mercado Japón", desc: "Detección de preventas y reediciones oficiales" },
    PREDICTIVE_STOCK: { label: "Análisis Predictivo de Stock", desc: "Estimación de rotación y reorden sugerido" },
    BRANDING_ICON: { label: "Branding & Logos IA", desc: "Generación de identidad visual y vectores" },
    VISUAL_SEARCH: { label: "Búsqueda Visual por Imagen", desc: "Identificación de productos coleccionables por foto" },
    CHECKOUT: { label: "Pasarelas de Pago", desc: "Procesamiento con Mercado Pago y Flow" },
    TRACKING: { label: "Seguimiento de Envíos", desc: "Courier y sincronización AfterShip" },
    TEST_SIMULATION: { label: "Prueba / Verificación", desc: "Petición de verificación manual" },
    OTHER: { label: "Otras Operaciones", desc: "Peticiones varias" },
  };

  if (!summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl font-bold">Consumo de APIs &amp; Tokens IA</h1>
        <p role={errorMessage ? "alert" : "status"}>{errorMessage || "Cargando métricas…"}</p>
        {errorMessage && <button type="button" disabled={isLoading} onClick={() => fetchTelemetry(timeframe)}
          className="px-4 py-3 rounded-xl bg-[#1F3A5F] text-white focus-visible:outline focus-visible:outline-offset-2">
          Reintentar
        </button>}
      </div>
    );
  }

  return (
    <Tabs value={timeframe} onValueChange={value => {
      if (value === "today" || value === "7d" || value === "30d" || value === "all") setTimeframe(value);
    }} activationMode="manual" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            Consumo registrado por esta aplicación, tokens de IA y latencia. Los costos y límites son estimaciones de referencia.
          </p>
        </div>

        {/* Timeframe Switcher & Main Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe pills */}
          <TabsList aria-label="Período del consumo de APIs" className="h-auto rounded-xl border border-brand-border bg-white p-1 shadow-sm">
            {(
              [
                { id: "today", label: "Hoy" },
                { id: "7d", label: "7 Días" },
                { id: "30d", label: "30 Días" },
                { id: "all", label: "Histórico" },
              ] as const
            ).map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeframe === t.id
                    ? "bg-[#1F3A5F] text-white shadow-xs"
                    : "text-[#666666] hover:text-[#1A1A1A] hover:bg-gray-100"
                }`}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

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

      <TabsContent value={timeframe} className="space-y-8">
      <p role="status" className="text-sm text-slate-600">
        {isLoading ? "Actualizando métricas…" : summary ? "Datos cargados. Actualiza para consultar nuevas llamadas." : "Las métricas aún no están disponibles."}
      </p>
      {/* Notifications */}
      {actionSuccessMessage && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar error"
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
                Google AI Studio • omnicollector-ai
              </span>
              <span className="text-[10px] font-bold text-white/70">
                Límites de referencia
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Límites de Frecuencia y Uso Real de Tokens
            </h2>
            <p className="text-xs text-white/80 max-w-xl">
              Datos de esta aplicación; no se sincronizan con la facturación de Google. Comprueba los límites vigentes de tu cuenta en Google AI Studio.
            </p>
          </div>

          {/* Operational Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Consola Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <TelemetryResetDialog disabled={isActionLoading} onConfirm={handleResetData} />
          </div>
        </div>

        {/* Progress Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          {/* Gauge 1: TPM Tokens */}
          <div className="bg-[#0F1E33]/70 rounded-xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/90">Tokens (TPM / 1M Máx)</span>
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
              <span>{summary?.quota.dailyTokenUsagePct || 0}% de capacidad TPM</span>
              <span className="text-emerald-300 font-semibold">Dentro del límite</span>
            </div>
          </div>

          {/* Gauge 2: Cuota Diaria RPD (Requests Per Day) */}
          <div className="bg-[#0F1E33]/70 rounded-xl p-4 border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/90">Cuota Diaria (RPD / 1,500 Máx)</span>
              <span className="font-mono text-emerald-300 font-bold">
                {summary?.quota.currentRpd || 0} / {summary?.quota.rpdLimit || 1500} req/día
              </span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, Math.min(100, (((summary?.quota.currentRpd || 0) / (summary?.quota.rpdLimit || 1500)) * 100)))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70 mt-1.5">
              <span>{Math.round((((summary?.quota.currentRpd || 0) / (summary?.quota.rpdLimit || 1500)) * 100))}% consumido hoy</span>
              <span className="text-emerald-300 font-semibold">Referencia de uso de Google AI</span>
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
                  (summary?.quota.currentRpm || 0) >= (summary?.quota.rpmLimit || 15) ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{
                  width: `${Math.min(100, (((summary?.quota.currentRpm || 0) / (summary?.quota.rpmLimit || 15)) * 100))}%`,
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/70 mt-1.5">
              <span>RPD Hoy: {summary?.quota.currentRpd || 0} / {summary?.quota.rpdLimit || 1500}</span>
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Sin saturación
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards (Synchronized with live production telemetry) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Total Tokens Gemini */}
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
            <span className="font-semibold text-emerald-600">Flash 2.0 / 1.5</span>
          </div>
        </div>

        {/* KPI 2: Average Latency */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs hover:border-[#1F3A5F]/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Latencia Media de Respuesta
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1F3A5F] tracking-tight">
              {summary?.avgLatencyMs || 0}{" "}
              <span className="text-xs font-bold text-[#64748B]">ms</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#666666]">
              <span>Tiempo de respuesta promedio verificado en vivo</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#64748B] flex items-center justify-between">
            <span>Conectividad directa</span>
            <span className={`font-semibold ${summary && summary.avgLatencyMs < 1200 ? "text-emerald-600" : "text-amber-600"}`}>
              {summary && summary.avgLatencyMs < 1200 ? "Excelente respuesta" : "Latencia estable"}
            </span>
          </div>
        </div>

        {/* KPI 3: Global Success Rate & Uptime */}
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
              <span>{summary?.successfulCalls || 0} exitosas • {summary?.failedCalls || 0} fallos</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] text-[10px] text-[#64748B] flex items-center justify-between">
            <span>{summary?.failedCalls || 0} fallos registrados</span>
            <span className="font-semibold text-emerald-600">
              {summary && summary.failedCalls === 0 ? "100% Operativo" : "Telemetría activa"}
            </span>
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
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                <Sparkles className="w-6 h-6 text-[#FF6B35] mx-auto opacity-80" />
                <div className="text-xs font-bold text-[#1F3A5F]">
                  Sin consumo de IA registrado en este período
                </div>
                <p className="text-[11px] text-[#666666] max-w-md mx-auto">
                  Este panel calcula el consumo exclusivamente con llamadas verdaderas. Al generar una ficha de producto con IA o consultar al Sommelier, verás el consumo de tokens y costo exacto reflejado aquí.
                </p>
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
              Auditoría granular de cada llamada real a Gemini y pasarelas de pago. Filtra y ordena por tokens, costo o latencia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Dropdown: Tokens, Cost, Latency, Timestamp */}
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1 rounded-xl border border-[#E5E5E5]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#64748B]" />
              <label htmlFor="sort-select" className="text-[11px] font-bold text-[#64748B]">
                Orden:
              </label>
              <select
                id="sort-select"
                value={`${sortField}_${sortDirection}`}
                onChange={(e) => handleSortSelectChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1F3A5F] focus:outline-hidden cursor-pointer"
              >
                <option value="timestamp_desc">Fecha: Más recientes</option>
                <option value="timestamp_asc">Fecha: Más antiguos</option>
                <option value="tokens_desc">Tokens: Mayor a menor (↓)</option>
                <option value="tokens_asc">Tokens: Menor a mayor (↑)</option>
                <option value="cost_desc">Costo: Mayor a menor (↓)</option>
                <option value="cost_asc">Costo: Menor a mayor (↑)</option>
                <option value="latency_desc">Latencia: Mayor a menor (↓)</option>
                <option value="latency_asc">Latencia: Menor a mayor (↑)</option>
              </select>
            </div>

            {/* Filter by provider */}
            <select
              aria-label="Filtrar por proveedor"
              value={logProviderFilter}
              onChange={(e) => setLogProviderFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#1A1A1A] bg-white focus:outline-hidden focus:border-[#1F3A5F] cursor-pointer"
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
                aria-label="Buscar en el historial"
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
                {/* Sortable: Timestamp */}
                <th
                  tabIndex={0}
                  aria-sort={sortField === "timestamp" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSortChange("timestamp"); } }}
                  onClick={() => handleSortChange("timestamp")}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100 transition select-none group"
                  title="Ordenar por fecha"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Fecha / Hora</span>
                    {sortField === "timestamp" ? (
                      sortDirection === "desc" ? (
                        <ArrowDown className="w-3 h-3 text-[#FF6B35]" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-[#FF6B35]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Módulo / Endpoint</th>
                <th className="py-3 px-4">Modelo / Detalle</th>

                {/* Sortable: Tokens */}
                <th
                  tabIndex={0}
                  aria-sort={sortField === "tokens" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSortChange("tokens"); } }}
                  onClick={() => handleSortChange("tokens")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition select-none group"
                  title="Ordenar por consumo de Tokens"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Tokens</span>
                    {sortField === "tokens" ? (
                      sortDirection === "desc" ? (
                        <ArrowDown className="w-3 h-3 text-[#FF6B35]" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-[#FF6B35]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition" />
                    )}
                  </div>
                </th>

                {/* Sortable: Cost */}
                <th
                  tabIndex={0}
                  aria-sort={sortField === "cost" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSortChange("cost"); } }}
                  onClick={() => handleSortChange("cost")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition select-none group"
                  title="Ordenar por Costo Estimado"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Costo Estimado</span>
                    {sortField === "cost" ? (
                      sortDirection === "desc" ? (
                        <ArrowDown className="w-3 h-3 text-[#FF6B35]" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-[#FF6B35]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition" />
                    )}
                  </div>
                </th>

                {/* Sortable: Latency */}
                <th
                  tabIndex={0}
                  aria-sort={sortField === "latency" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSortChange("latency"); } }}
                  onClick={() => handleSortChange("latency")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100 transition select-none group"
                  title="Ordenar por Latencia"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Latencia</span>
                    {sortField === "latency" ? (
                      sortDirection === "desc" ? (
                        <ArrowDown className="w-3 h-3 text-[#FF6B35]" />
                      ) : (
                        <ArrowUp className="w-3 h-3 text-[#FF6B35]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {filteredAndSortedLogs.length > 0 ? (
                filteredAndSortedLogs.map((log: ApiTelemetryRecord) => {
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
                  <td colSpan={8} className="py-12 text-center text-xs">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B35]">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-[#1F3A5F]">
                        Sin peticiones registradas aún
                      </div>
                      <p className="text-xs text-[#666666]">
                        La telemetría está activa y a la escucha. Toda interacción real en la web (generación de ficha con IA, chat de Sommelier o pasarelas de pago) se auditará aquí en milisegundos y con el consumo exacto de tokens.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <Link
                          href="/admin/products"
                          className="px-3.5 py-1.5 rounded-xl bg-[#1F3A5F] hover:bg-[#162D4A] text-white text-xs font-bold transition shadow-xs"
                        >
                          Probar en Catálogo
                        </Link>
                        <Link
                          href="/sommelier"
                          target="_blank"
                          className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B35] text-xs font-bold transition border border-orange-200"
                        >
                          Consultar Sommelier IA
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </TabsContent>
    </Tabs>
  );
}
