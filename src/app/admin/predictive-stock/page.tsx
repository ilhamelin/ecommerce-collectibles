"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Package,
  DollarSign,
  Download,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Pencil,
  Clock,
  Users,
  Flame,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Boxes,
  Layers,
} from "lucide-react";
import { SkuPredictiveMetric } from "@/app/api/admin/predictive-stock/route";
import { formatCLP } from "@/lib/utils/currency";

type FilterType = "ALL" | "CRITICAL" | "STAGNANT" | "DEMAND" | "HEALTHY";

export default function PredictiveStockPage() {
  const [metrics, setMetrics] = useState<SkuPredictiveMetric[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Fetch initial mathematical metrics
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/predictive-stock");
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data.metrics || []);
        setSummary(json.data.summary || null);
      }
    } catch (err) {
      console.error("Error fetching predictive stock:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Gemini AI strategic analysis
  const handleScanWithGemini = async () => {
    setAnalyzingAi(true);
    try {
      const res = await fetch("/api/admin/predictive-stock", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data.metrics || []);
        setSummary(json.data.summary || null);
        setAiReport(json.data.aiReport || null);
        setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (err) {
      console.error("Error analyzing with Gemini AI:", err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    return metrics.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "CRITICAL") {
        return item.statusCategory === "CRITICAL_OUT_OF_STOCK" || item.statusCategory === "HIGH_RISK";
      }
      if (activeFilter === "STAGNANT") {
        return item.statusCategory === "STAGNANT_OVERSTOCK";
      }
      if (activeFilter === "DEMAND") {
        return item.statusCategory === "DEMAND_SURGE" || item.alertSubscribers > 0;
      }
      if (activeFilter === "HEALTHY") {
        return item.statusCategory === "HEALTHY";
      }
      return true;
    });
  }, [metrics, searchQuery, activeFilter]);

  // Export CSV for suppliers / replenishment
  const handleExportCsv = () => {
    if (metrics.length === 0) return;

    const headers = [
      "SKU",
      "Nombre",
      "Tipo",
      "Plataforma",
      "Precio Venta CLP",
      "Stock Actual",
      "Ventas 30 Dias",
      "Consumo Diario",
      "Dias Stock Restante",
      "Clientes en Espera",
      "Reorden Sugerido (Unidades)",
      "Costo Estimado Reorden CLP",
      "Estado Predictivo",
    ];

    const rows = filteredMetrics.map((m) => [
      `"${m.sku}"`,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.type}"`,
      `"${m.platform || "N/A"}"`,
      m.price,
      m.stockAvailable,
      m.unitsSold30d,
      m.burnRateDaily,
      m.daysOfInventoryRemaining === 999 ? "Sin rotacion" : m.daysOfInventoryRemaining,
      m.alertSubscribers,
      m.suggestedReorderUnits,
      m.estimatedReorderCostClp,
      `"${m.statusCategory}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `OmniCollector_Reorden_Inventario_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1F3A5F] to-[#0F1D30] text-[#FF6B35] flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
                Rotación & Análisis Predictivo de Stock
                <span className="text-xs font-bold text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-full border border-[#FF6B35]/20">
                  Gemini IA
                </span>
              </h1>
              <p className="text-xs text-[#666666] mt-0.5">
                Cálculo de burn rate, días de inventario restante (runway), demanda reprimida y sugerencias de reorden asistidas por IA.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Recalcular métricas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar Datos</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={metrics.length === 0}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Exportar archivo CSV para proveedores"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Descargar CSV Reorden</span>
          </button>

          <button
            onClick={handleScanWithGemini}
            disabled={analyzingAi || loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D25] hover:from-[#E85D25] hover:to-[#D94F1A] text-white text-xs font-black transition flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-98 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${analyzingAi ? "animate-spin text-white" : "text-amber-200"}`} />
            <span>{analyzingAi ? "Analizando con Gemini..." : "Escanear Estrategia con IA"}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Capital Total en Inventario */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Capital Total Bodega
            </span>
            <span className="text-xl font-black text-[#1A1A1A] block font-mono">
              {summary ? formatCLP(summary.totalInventoryValueClp) : "..."}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {summary ? `${summary.totalStockUnits} unidades en catálogo` : "Cargando..."}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* 2. En Riesgo Crítico / Quiebre */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-rose-50/30">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
              Quiebre Inminente (&lt; 14d)
            </span>
            <span className="text-xl font-black text-rose-700 block font-mono">
              {summary ? `${summary.criticalCount} productos` : "..."}
            </span>
            <span className="text-[11px] text-rose-600 mt-1 block font-medium">
              Agotándose a velocidad récord
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Capital Inmovilizado / Estancado */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-amber-50/30">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
              Capital Dormido / Lento
            </span>
            <span className="text-xl font-black text-amber-700 block font-mono">
              {summary ? formatCLP(summary.stagnantValueClp) : "..."}
            </span>
            <span className="text-[11px] text-amber-600 mt-1 block font-medium">
              Sin rotación en 30 días
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Demanda Reprimida / Lista de Espera */}
        <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-purple-50/30">
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
              Demanda Reprimida
            </span>
            <span className="text-xl font-black text-purple-700 block font-mono">
              {summary ? `${summary.totalWaitingCustomers} clientes` : "..."}
            </span>
            <span className="text-[11px] text-purple-600 mt-1 block font-medium">
              Esperando alertas de stock
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gemini AI Strategic Diagnostics Box */}
      {aiReport && (
        <div className="bg-gradient-to-br from-[#0F1D30] via-[#16263B] to-[#0A1118] text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-750 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  Diagnóstico Estratégico Ejecutivo Gemini IA
                  {lastScanned && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      • Generado a las {lastScanned}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">
                  Recomendaciones de compra, liquidación de sobrestock y balance de capital
                </p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-full self-start sm:self-auto">
              ✓ Análisis Basado en Datos Reales
            </span>
          </div>

          {/* Executive Summary */}
          {aiReport.executiveSummary && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-200 leading-relaxed">
              <p className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                <span>📋 Resumen de Situación de Bodega:</span>
              </p>
              {aiReport.executiveSummary}
            </div>
          )}

          {/* Three Column Action Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Urgent Restock */}
            <div className="bg-[#111C26] border border-rose-900/40 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Reabastecimiento Prioritario
              </h4>
              <div className="space-y-2.5">
                {aiReport.urgentRestock && aiReport.urgentRestock.length > 0 ? (
                  aiReport.urgentRestock.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[170px]" title={item.title}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-900/60 px-1.5 py-0.5 rounded">
                          +{item.suggestedUnits} un.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{item.rationale}</p>
                      {item.estimatedBudgetClp > 0 && (
                        <span className="text-[10px] text-rose-400 font-bold block">
                          Presupuesto aprox: {formatCLP(item.estimatedBudgetClp)}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Sin reórdenes críticos inmediatos.</p>
                )}
              </div>
            </div>

            {/* Column 2: Liquidation of Stagnant Inventory */}
            <div className="bg-[#111C26] border border-amber-900/40 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-amber-500" />
                Estrategias Capital Dormido
              </h4>
              <div className="space-y-2.5">
                {aiReport.stagnantLiquidationTactics && aiReport.stagnantLiquidationTactics.length > 0 ? (
                  aiReport.stagnantLiquidationTactics.map((tactic: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-2.5 text-xs space-y-1"
                    >
                      <span className="font-bold text-amber-300 block">{tactic.title}</span>
                      <p className="text-[11px] text-slate-300">{tactic.description}</p>
                      {tactic.impact && (
                        <span className="text-[10px] text-emerald-400 font-medium block">
                          🎯 {tactic.impact}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Todo el catálogo mantiene rotación fluida.</p>
                )}
              </div>
            </div>

            {/* Column 3: Market Trend Signals */}
            <div className="bg-[#111C26] border border-blue-900/40 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Oportunidades & Tendencias
              </h4>
              <div className="space-y-2.5">
                {aiReport.marketTrendSignals && aiReport.marketTrendSignals.length > 0 ? (
                  aiReport.marketTrendSignals.map((sig: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-2.5 text-xs space-y-1"
                    >
                      <span className="font-bold text-blue-300 block">{sig.trend}</span>
                      <p className="text-[11px] text-slate-300">{sig.action}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Tendencias estables en este ciclo.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Inventory Turnover Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Table Filters & Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeFilter === "ALL"
                  ? "bg-[#1F3A5F] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({metrics.length})
            </button>
            <button
              onClick={() => setActiveFilter("CRITICAL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeFilter === "CRITICAL"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              🚨 Quiebre Inminente ({metrics.filter((m) => m.statusCategory === "CRITICAL_OUT_OF_STOCK" || m.statusCategory === "HIGH_RISK").length})
            </button>
            <button
              onClick={() => setActiveFilter("STAGNANT")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeFilter === "STAGNANT"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              🧊 Capital Dormido ({metrics.filter((m) => m.statusCategory === "STAGNANT_OVERSTOCK").length})
            </button>
            <button
              onClick={() => setActiveFilter("DEMAND")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeFilter === "DEMAND"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100"
              }`}
            >
              🔥 Demanda Reprimida ({metrics.filter((m) => m.alertSubscribers > 0).length})
            </button>
            <button
              onClick={() => setActiveFilter("HEALTHY")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeFilter === "HEALTHY"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              ✅ Saludable ({metrics.filter((m) => m.statusCategory === "HEALTHY").length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por SKU o título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Producto & SKU</th>
                <th className="py-3 px-3">Precio / Capital</th>
                <th className="py-3 px-3 text-center">Stock Actual</th>
                <th className="py-3 px-3 text-center">Ventas 30d (Burn Rate)</th>
                <th className="py-3 px-3">Runway (Días Restantes)</th>
                <th className="py-3 px-3 text-center">Demanda (Alertas)</th>
                <th className="py-3 px-3">Reorden Sugerido</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6B35]" />
                    Calculando rotación de inventario y velocidad de ventas...
                  </td>
                </tr>
              ) : filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron productos con el filtro aplicado.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((item) => {
                  const isCritical =
                    item.statusCategory === "CRITICAL_OUT_OF_STOCK" ||
                    item.statusCategory === "HIGH_RISK";
                  const isStagnant = item.statusCategory === "STAGNANT_OVERSTOCK";

                  return (
                    <tr
                      key={item.sku}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical ? "bg-rose-50/20" : isStagnant ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {item.images && item.images[0] ? (
                              <Image
                                src={item.images[0]}
                                alt={item.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                🎮
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-[240px]">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {item.platform && (
                                <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                                  {item.platform}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-500 truncate">
                                {item.sku}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 truncate" title={item.name}>
                              {item.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price & Total Value */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {formatCLP(item.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Cap: {formatCLP(item.totalValueClp)}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                            item.stockAvailable <= 0
                              ? "bg-rose-100 text-rose-700"
                              : item.stockAvailable <= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.stockAvailable <= 0 ? "Agotado" : `${item.stockAvailable} un.`}
                        </span>
                      </td>

                      {/* 30d Sales & Daily Burn */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {item.unitsSold30d} un.
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.burnRateDaily > 0 ? `${item.burnRateDaily} un/día` : "Sin ventas"}
                        </span>
                      </td>

                      {/* Runway / Days remaining */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-bold ${
                                item.daysOfInventoryRemaining <= 14
                                  ? "text-rose-600"
                                  : item.daysOfInventoryRemaining <= 30
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {item.daysOfInventoryRemaining === 0
                                ? "Quiebre total"
                                : item.daysOfInventoryRemaining === 999
                                ? "Inmóvil"
                                : `${item.daysOfInventoryRemaining} días`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.daysOfInventoryRemaining <= 14
                                  ? "bg-rose-500"
                                  : item.daysOfInventoryRemaining <= 30
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Math.max((item.daysOfInventoryRemaining / 60) * 100, 5),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Demand / Alert Subscribers */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.alertSubscribers > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full text-xs">
                            <Users className="w-3 h-3" />
                            {item.alertSubscribers}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Suggested Reorder */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.suggestedReorderUnits > 0 ? (
                          <div>
                            <span className="font-extrabold text-rose-600 block text-xs">
                              +{item.suggestedReorderUnits} unidades
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Est: {formatCLP(item.estimatedReorderCostClp)}
                            </span>
                          </div>
                        ) : isStagnant ? (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded">
                            Frenar compras
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Stock suficiente</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/products/${item.id}/edit`}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
                          title="Ajustar stock o precio en catálogo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
