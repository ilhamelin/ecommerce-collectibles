"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Package,
  DollarSign,
  Globe2,
  Cpu,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function AdminRadarPage() {
  const [radarData, setRadarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [engineUsed, setEngineUsed] = useState<string>("GEMINI_AI");

  const fetchRadar = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/radar?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setRadarData(data.data);
        if (data.engine) setEngineUsed(data.engine);
      }
    } catch (err) {
      console.error("Error al cargar radar:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#1F3A5F]/20 border-t-[#FF6B35] rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-[#666666] font-medium">
          Sintonizando Radar de Mercado Japón & Preventas con Google Gemini...
        </p>
      </div>
    );
  }

  const isOfficialGemini = engineUsed === "GEMINI_AI";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1F3A5F] text-white">
              <Radio className="w-5 h-5 text-[#FF6B35] animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight">
                Radar de Preventas & Reediciones Japón
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isOfficialGemini ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✦ Google Gemini 1.5 Flash Oficial</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Motor Heurístico Local</span>
                  </span>
                )}
                <span className="text-xs text-[#666666]">
                  Actualizado: {new Date(radarData?.scannedAt || Date.now()).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRadar(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF6B35] ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Escaneando con IA..." : "Escanear Tendencias con IA"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#666666] font-semibold">
            <span>Alertas de Reedición</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#1F3A5F] font-mono">
            {radarData?.reissueAlerts?.length || 0}
          </div>
          <p className="text-[11px] text-[#666666]">Figuras con relanzamiento previsto</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#666666] font-semibold">
            <span>Margen Promedio Estimado</span>
            <DollarSign className="w-4 h-4 text-[#2E9E5B]" />
          </div>
          <div className="text-2xl font-black text-[#2E9E5B] font-mono">
            44.2%
          </div>
          <p className="text-[11px] text-[#666666]">Retorno proyectado sobre costo CIF</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#666666] font-semibold">
            <span>Fabricantes en Mira</span>
            <Globe2 className="w-4 h-4 text-[#1F3A5F]" />
          </div>
          <div className="text-2xl font-black text-[#1F3A5F] font-mono">
            Good Smile & Kotobukiya
          </div>
          <p className="text-[11px] text-[#666666]">Monitoreo de distribución oficial</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#666666] font-semibold">
            <span>Estrategia de Preventa</span>
            <ShieldCheck className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div className="text-2xl font-black text-[#FF6B35] font-mono">
            Pie 20% CLP
          </div>
          <p className="text-[11px] text-[#666666]">Riesgo cero de sobrestock</p>
        </div>
      </div>

      {/* Market Overview Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1F3A5F] to-[#152842] text-white shadow-md space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
          <Globe2 className="w-4 h-4" />
          <span>Panorama del Mercado Japonés & Logística Chile</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {radarData?.marketOverview}
        </p>
      </div>

      {/* Radar Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <span>Oportunidades de Preventa & Re-stock Detectadas</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1F3A5F] text-white font-mono font-bold">
              {radarData?.reissueAlerts?.length} activas
            </span>
          </h2>
          <Link
            href="/admin/products/new"
            className="text-xs font-bold text-[#FF6B35] hover:text-[#E85A24] transition flex items-center gap-1"
          >
            <span>Crear nueva preventa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {radarData?.reissueAlerts?.map((alert: any) => (
            <div
              key={alert.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FF6B35]/50 shadow-sm transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#1F3A5F] border border-slate-200">
                      {alert.manufacturer}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6B35] border border-orange-200">
                      {alert.franchise}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {alert.confidence}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#1A1A1A] leading-snug">
                  {alert.productName}
                </h3>

                <p className="text-xs text-[#666666] leading-relaxed">
                  {alert.reasoning}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#666666] block font-medium">Ventana de Llegada:</span>
                    <strong className="text-[#1F3A5F] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#FF6B35]" />
                      {alert.estimatedWindow}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#666666] block font-medium">Margen Proyectado:</span>
                    <strong className="text-[#2E9E5B] flex items-center gap-1 mt-0.5 font-mono">
                      <TrendingUp className="w-3 h-3" />
                      {alert.projectedMargin}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1F3A5F] font-semibold flex items-center justify-between">
                  <span>💡 {alert.suggestedAction}</span>
                  <Link
                    href={`/admin/products/new?name=${encodeURIComponent(alert.productName)}&preorder=true`}
                    className="px-3 py-1 rounded-lg bg-[#FF6B35] hover:bg-[#E85A24] text-white text-[11px] font-bold transition shrink-0 ml-2"
                  >
                    Publicar Preventa
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Hot Trends & Urgent Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Trends */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Tendencias en Ascenso en Chile</span>
          </div>
          <div className="space-y-2.5">
            {radarData?.hotTrends?.map((trend: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/50 border border-orange-100 text-xs text-[#1A1A1A] font-medium leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {idx + 1}
                </span>
                <span>{trend}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Recommendations */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Recomendaciones Estratégicas</span>
          </div>
          <div className="space-y-2.5">
            {radarData?.urgentRecommendations?.map((rec: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-[#1A1A1A] font-medium leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
