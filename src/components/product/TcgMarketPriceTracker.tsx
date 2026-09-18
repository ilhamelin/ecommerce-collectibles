"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  DollarSign,
  Activity,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { TcgMarketPriceGuide } from "@/lib/types/domain";
import { formatCLP } from "@/lib/utils/currency";

interface TcgMarketPriceTrackerProps {
  guide: TcgMarketPriceGuide;
  productName: string;
}

type Timeframe = "30D" | "90D" | "1Y" | "ALL";

export function TcgMarketPriceTracker({
  guide,
  productName,
}: TcgMarketPriceTrackerProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1Y");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Filter history points based on timeframe
  const filteredPoints = useMemo(() => {
    const all = guide.priceHistory;
    if (timeframe === "30D") return all.slice(-2);
    if (timeframe === "90D") return all.slice(-4);
    if (timeframe === "1Y") return all.slice(-12);
    return all;
  }, [guide.priceHistory, timeframe]);

  // Compute SVG coordinates
  const { pathD, areaD, points, minPrice, maxPrice } = useMemo(() => {
    if (!filteredPoints || filteredPoints.length === 0) {
      return { pathD: "", areaD: "", points: [], minPrice: 0, maxPrice: 0 };
    }

    const prices = filteredPoints.map((p) => p.priceClp);
    const minP = Math.min(...prices) * 0.95;
    const maxP = Math.max(...prices) * 1.05;
    const range = maxP - minP || 1;

    const width = 600;
    const height = 180;
    const padding = 20;

    const computedPoints = filteredPoints.map((p, idx) => {
      const x =
        padding +
        (idx / Math.max(filteredPoints.length - 1, 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((p.priceClp - minP) / range) * (height - padding * 2);
      return { x, y, data: p };
    });

    // Create SVG Path
    const d = computedPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    // Area path for gradient under curve
    const lastX = computedPoints[computedPoints.length - 1].x;
    const firstX = computedPoints[0].x;
    const area = `${d} L ${lastX},${height} L ${firstX},${height} Z`;

    return {
      pathD: d,
      areaD: area,
      points: computedPoints,
      minPrice: minP,
      maxPrice: maxP,
    };
  }, [filteredPoints]);

  const activePoint =
    hoveredPointIndex !== null ? points[hoveredPointIndex] : points[points.length - 1];

  const currentPercentage =
    timeframe === "30D"
      ? guide.change30dPercent
      : timeframe === "90D"
      ? guide.change90dPercent
      : guide.change1yPercent;

  return (
    <div className="rounded-3xl bg-[#091E2A] border border-[#004E72]/50 text-white p-6 space-y-6 shadow-xl">
      {/* Header & Metrics */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-[#004E72]/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-[#FF6B35]">
              TCG Price Guide Tracker
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              MERCADO EN VIVO
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            Valuador de Mercado & Cotización Histórica
          </h3>
          <p className="text-xs text-[#9bb5c2] font-mono">
            Fair Market Value (FMV) ponderado por calificaciones certificadas
          </p>
        </div>

        {/* Current FMV Display */}
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black text-[#FF6B35] font-mono">
            {formatCLP(guide.estimatedFmvClp)}
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-gray-300">
            <span>~ ${guide.estimatedFmvUsd.toLocaleString()} USD</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +{currentPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Timeframe selector & Chart Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#05141D] border border-white/5 text-xs font-bold">
          {(["30D", "90D", "1Y", "ALL"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg transition ${
                timeframe === tf
                  ? "bg-[#FF6B35] text-white shadow"
                  : "text-[#9bb5c2] hover:text-white"
              }`}
            >
              {tf === "1Y" ? "1 AÑO" : tf === "ALL" ? "HISTÓRICO" : tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#9bb5c2]">
          <span className="inline-flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Liquidez: <strong className="text-white">{guide.liquidityRating}</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Volumen auditado: <strong>320+ transacciones</strong>
          </span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative p-4 rounded-2xl bg-[#05141D] border border-[#004E72]/40 overflow-hidden">
        {/* Tooltip on Active Point */}
        {activePoint && (
          <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
            <span className="text-gray-400 font-mono">
              Punto Seleccionado: <strong className="text-white">{activePoint.data.label}</strong>
            </span>
            <span className="text-[#FF6B35] font-mono font-bold text-sm">
              {formatCLP(activePoint.data.priceClp)}
            </span>
          </div>
        )}

        <svg
          viewBox="0 0 600 180"
          className="w-full h-44 sm:h-52 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="tcgChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background area fill */}
          {areaD && <path d={areaD} fill="url(#tcgChartGradient)" />}

          {/* Stroke line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#FF6B35"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Point circles */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPointIndex === idx ? 5 : 3.5}
                fill={hoveredPointIndex === idx ? "#FFFFFF" : "#FF6B35"}
                stroke="#091E2A"
                strokeWidth="1.5"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPointIndex(idx)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-2">
          <span>{filteredPoints[0]?.label}</span>
          <span>
            {filteredPoints[Math.floor(filteredPoints.length / 2)]?.label}
          </span>
          <span>{filteredPoints[filteredPoints.length - 1]?.label}</span>
        </div>
      </div>

      {/* Grade Valuation Comparison Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#9bb5c2]">
            Matriz Comparativa de Valuación por Grado
          </h4>
          <span className="text-[11px] text-gray-400">
            Multiplicador base vs Raw
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {guide.gradesComparison.map((gc) => (
            <div
              key={gc.grade}
              className={`p-3 rounded-2xl border transition-all ${
                gc.isCurrentItem
                  ? "bg-gradient-to-br from-[#1F3A5F] to-[#0E2038] border-[#FF6B35] ring-2 ring-[#FF6B35]/30 shadow-md"
                  : "bg-[#05141D] border-[#004E72]/30 hover:border-[#004E72]/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">
                  {gc.label}
                </span>
                {gc.isCurrentItem && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#FF6B35] text-white font-bold uppercase">
                    Pieza Actual
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-black font-mono text-white">
                  {formatCLP(gc.estimatedPriceClp)}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {gc.multiplierVsRaw}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Benchmark Sales Table */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-[#9bb5c2]">
          Ventas de Referencia Verificadas Recientes (Subastas & Plataformas)
        </h4>

        <div className="rounded-2xl bg-[#05141D] border border-[#004E72]/40 overflow-hidden divide-y divide-[#004E72]/20">
          {guide.recentBenchmarkSales.map((sale, idx) => (
            <div
              key={idx}
              className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <span className="font-bold text-white block">
                    {sale.platform}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {sale.date} • Grado: {sale.grade}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-gray-100 block">
                  {formatCLP(sale.priceClp)}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 justify-end">
                  <CheckCircle2 className="w-3 h-3" /> Verificada
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
