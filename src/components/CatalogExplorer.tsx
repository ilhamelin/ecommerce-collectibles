"use client";

import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";

interface ProductCardProps {
  sku: string;
  name: string;
  type: "VIDEO_GAME" | "FIGURE" | "COLLECTIBLE" | "BUNDLE";
  price: number;
  cost: number;
  stockAvailable: number;
  badge: string;
  specs: Record<string, string>;
  marginPercent: number;
}

export function CatalogExplorer() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const products: ProductCardProps[] = [
    {
      sku: "VG-ELDEN-PS5",
      name: "Elden Ring: Shadow of the Erdtree Edition (PS5)",
      type: "VIDEO_GAME",
      price: 79990,
      cost: 69990,
      stockAvailable: 25,
      badge: "Margen Retail 12.5% • Alta Rotación Chile",
      specs: {
        Plataforma: "PlayStation 5",
        Edición: "Física Deluxe con Voucher",
        Publisher: "Bandai Namco",
      },
      marginPercent: 12.5,
    },
    {
      sku: "FIG-MAKIMA-17",
      name: "Makima 1/7 Scale PVC Figure (Chainsaw Man)",
      type: "FIGURE",
      price: 249990,
      cost: 160000,
      stockAvailable: 15,
      badge: "Preventa 8 Meses • Pie 20% ($ 49.998 CLP)",
      specs: {
        Escala: "1/7 Scale (25cm)",
        Fabricante: "Good Smile Company",
        "Llegada Estimada": "Noviembre 2026",
      },
      marginPercent: 36.0,
    },
    {
      sku: "TCG-CHARIZARD-PSA9",
      name: "Charizard 1st Edition Shadowless Base Set (PSA 9)",
      type: "COLLECTIBLE",
      price: 4890000,
      cost: 4100000,
      stockAvailable: 1,
      badge: "Pieza Única Certificada • Gem Mint/Mint",
      specs: {
        Categoría: "TCG / Pokémon WOTC 1999",
        Certificación: "PSA 9 Mint (#88492019)",
        Idioma: "Inglés Original",
      },
      marginPercent: 16.2,
    },
    {
      sku: "BUN-ELDEN-MASTER",
      name: "Elden Lord Ultimate Collector Bundle (Composite)",
      type: "BUNDLE",
      price: 124990,
      cost: 97990,
      stockAvailable: 25,
      badge: "Patrón Composite • Margen 21.6% en CLP",
      specs: {
        "Contenido SKU": "1x Juego PS5 + 1x Pin Set + 1x Artbook",
        "Ahorro Cliente": "$ 24.980 CLP (16.7% OFF)",
        "Disponibilidad Atómica": "Sujeta al stock de cada componente",
      },
      marginPercent: 21.6,
    },
  ];

  const filtered =
    selectedCategory === "ALL" ? products : products.filter((p) => p.type === selectedCategory);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#F9F9F9] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FF6E42]" />
            Catálogo Especializado por Dominio Operacional (CLP)
          </h3>
          <p className="text-xs text-[#9bb5c2] mt-0.5">
            Modelado polimórfico con metadatos específicos por vertical (Videojuegos, Figuras, TCG y Bundles).
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#05161f] p-1.5 rounded-2xl border border-[#004E72]/40 text-xs">
          {[
            { id: "ALL", label: "Todos (4)" },
            { id: "VIDEO_GAME", label: "Videojuegos" },
            { id: "FIGURE", label: "Figuras Licenciadas" },
            { id: "COLLECTIBLE", label: "Coleccionables / TCG" },
            { id: "BUNDLE", label: "Bundles Dinámicos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition font-medium ${
                selectedCategory === tab.id
                  ? "bg-[#FF6E42] text-[#F9F9F9] font-bold shadow-sm"
                  : "text-[#9bb5c2] hover:text-[#F9F9F9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((prod) => (
          <div
            key={prod.sku}
            className="rounded-2xl p-5 bg-[#092634] border border-[#004E72]/50 hover:border-[#FF6E42]/60 transition-all flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#9bb5c2] font-semibold">{prod.sku}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    prod.type === "COLLECTIBLE"
                      ? "bg-[#FF6E42]/20 text-[#FF6E42] border-[#FF6E42]/40"
                      : "bg-[#004E72] text-[#F9F9F9] border-[#004E72]"
                  }`}
                >
                  {prod.type}
                </span>
              </div>

              <h4 className="font-bold text-[#F9F9F9] text-sm leading-snug line-clamp-2">{prod.name}</h4>

              <div className="text-[11px] text-[#9bb5c2] bg-[#05161f] p-2 rounded-xl border border-[#004E72]/30">
                {prod.badge}
              </div>

              <div className="space-y-1 text-xs border-t border-[#004E72]/30 pt-2">
                {Object.entries(prod.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-[#9bb5c2]">{k}:</span>
                    <span className="text-[#F9F9F9] font-medium text-right ml-2 line-clamp-1">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#004E72]/30 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-[#9bb5c2] block">PVP</span>
                  <div className="text-lg font-black text-[#F9F9F9] font-mono">{formatCLP(prod.price)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#9bb5c2] block">Margen</span>
                  <div className="text-xs font-mono font-bold text-[#FF6E42]">
                    {prod.marginPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#9bb5c2] flex justify-between">
                <span>Stock Disponible:</span>
                <span className="font-semibold text-[#F9F9F9]">{prod.stockAvailable} uds.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
