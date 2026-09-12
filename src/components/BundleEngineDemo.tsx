"use client";

import React, { useState } from "react";
import { Package, Layers, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { formatCLP, formatCLPShort } from "@/lib/utils/currency";

export function BundleEngineDemo() {
  const [discountPercent, setDiscountPercent] = useState<number>(16.66);

  const components = [
    { sku: "VG-ELDEN-PS5", name: "Elden Ring PS5 Edition", price: 79990, cost: 69990, stock: 25, req: 1 },
    { sku: "ACC-PIN-SET", name: "Elden Enamel Pin Set", price: 24990, cost: 8000, stock: 50, req: 1 },
    { sku: "ACC-ARTBOOK", name: "Lands Between Artbook", price: 44990, cost: 20000, stock: 30, req: 1 },
  ];

  const nominalSum = components.reduce((acc, c) => acc + c.price * c.req, 0); // 149.970 CLP
  const totalCost = components.reduce((acc, c) => acc + c.cost * c.req, 0); // 97.990 CLP

  const bundlePrice = Math.round(nominalSum * (1 - discountPercent / 100));
  const grossProfit = Math.round(bundlePrice - totalCost);
  const marginPercent = Number(((grossProfit / bundlePrice) * 100).toFixed(2));

  const supportedPerComponent = components.map((c) => Math.floor(c.stock / c.req));
  const bottleneckStock = Math.min(...supportedPerComponent); // 25

  const isViable = grossProfit > 0;

  return (
    <div className="rounded-2xl p-6 bg-[#092634] border border-[#004E72] shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#004E72]/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#FF6E42] font-semibold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            Motor B: Dynamic Bundling Engine (Composite Pattern en CLP)
          </div>
          <h3 className="text-xl font-bold text-[#F9F9F9] mt-1">
            Elden Lord Ultimate Collector Bundle (BUN-ELDEN-MASTER)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-xl bg-[#004E72] text-[#F9F9F9] border border-[#004E72]">
            Algoritmo Atómico: min(stock_i / req_i)
          </span>
          <span className="text-xs px-3 py-1 rounded-xl bg-[#05161f] text-[#FF6E42] border border-[#FF6E42]/40 font-bold">
            Stock Disponible: {bottleneckStock} bundles
          </span>
        </div>
      </div>

      {/* Component breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#9bb5c2] mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#FF6E42]" />
          Componentes Físicos Agrupados (SKUs Atómicos):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {components.map((c) => {
            const isBottleneck = c.stock === bottleneckStock;
            return (
              <div
                key={c.sku}
                className={`p-4 rounded-xl border transition-all ${
                  isBottleneck
                    ? "bg-[#05161f] border-[#FF6E42] shadow-md shadow-[#004E72]/20"
                    : "bg-[#05161f] border-[#004E72]/40"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-[#FF6E42] font-semibold">{c.sku}</span>
                  {isBottleneck && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6E42]/20 text-[#FF6E42] border border-[#FF6E42]/40 font-bold">
                      Cuello de Botella
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-[#F9F9F9] mt-1 line-clamp-1">{c.name}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-[#004E72]/30 pt-2 text-[#9bb5c2]">
                  <div>
                    <span>PVP:</span> <strong className="text-[#F9F9F9] block">{formatCLPShort(c.price)}</strong>
                  </div>
                  <div>
                    <span>Costo:</span> <strong className="text-[#F9F9F9] block">{formatCLPShort(c.cost)}</strong>
                  </div>
                  <div>
                    <span>Req:</span> <strong className="text-[#F9F9F9] block">{c.req} ud.</strong>
                  </div>
                  <div>
                    <span>Stock:</span>{" "}
                    <strong className={isBottleneck ? "text-[#FF6E42] font-bold block" : "text-[#F9F9F9] block"}>
                      {c.stock} uds.
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parametric Discount Slider */}
      <div className="bg-[#05161f] rounded-2xl p-5 border border-[#004E72]/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-sm font-bold text-[#F9F9F9] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF6E42]" />
              Compensación de Margen y Descuento Paramétrico en CLP
            </span>
            <p className="text-xs text-[#9bb5c2] mt-0.5">
              Ajusta el porcentaje de descuento del bundle para verificar la rentabilidad en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs bg-[#092634] px-3 py-1.5 rounded-xl border border-[#004E72]/50">
            <span className="text-[#9bb5c2]">Descuento:</span>
            <span className="text-[#FF6E42] font-bold">{discountPercent.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="45"
            step="0.5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#092634] rounded-lg appearance-none cursor-pointer accent-[#FF6E42]"
          />
          <div className="flex justify-between text-[11px] text-[#9bb5c2]">
            <span>0% ({formatCLPShort(nominalSum)})</span>
            <span className="text-[#FF6E42] font-semibold">16.7% ({formatCLPShort(124990)} Sugerido)</span>
            <span className="text-red-400">35%+ (Pérdida Crítica)</span>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#092634] border border-[#004E72]/40">
            <div className="text-[11px] text-[#9bb5c2]">Precio Final Bundle</div>
            <div className="text-lg font-bold text-[#F9F9F9] font-mono mt-0.5">{formatCLPShort(bundlePrice)}</div>
            <div className="text-[10px] text-[#9bb5c2] line-through">{formatCLPShort(nominalSum)}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#092634] border border-[#004E72]/40">
            <div className="text-[11px] text-[#9bb5c2]">Costo Componentes</div>
            <div className="text-lg font-bold text-[#F9F9F9] font-mono mt-0.5">{formatCLPShort(totalCost)}</div>
            <div className="text-[10px] text-[#9bb5c2]">Costo base fijo</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#092634] border border-[#004E72]/40">
            <div className="text-[11px] text-[#9bb5c2]">Margen Bruto ($)</div>
            <div
              className={`text-lg font-bold font-mono mt-0.5 ${
                grossProfit >= 0 ? "text-[#FF6E42]" : "text-red-400"
              }`}
            >
              {formatCLPShort(grossProfit)}
            </div>
            <div className="text-[10px] text-[#9bb5c2]">por paquete vendido</div>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              isViable ? "bg-[#092634] border-[#FF6E42]/60" : "bg-red-950/20 border-red-500/40"
            }`}
          >
            <div className="text-[11px] text-[#9bb5c2]">Margen Agregado (%)</div>
            <div
              className={`text-lg font-bold font-mono mt-0.5 ${
                isViable ? "text-[#FF6E42]" : "text-red-400"
              }`}
            >
              {marginPercent.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-[10px] mt-0.5 font-medium">
              {isViable ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-[#FF6E42]" />
                  <span className="text-[#FF6E42]">Rentable en CLP</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Margen Inviable</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
