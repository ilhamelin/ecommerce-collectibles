"use client";

import React, { useState } from "react";
import { Truck, MapPin, Clock, ShieldCheck, Check, Store } from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";

interface RegionData {
  name: string;
  comunas: string[];
  baseDays: string;
  starkenRate: number;
  chilexpressRate: number;
  blueExpressRate: number;
}

const CHILE_REGIONS: Record<string, RegionData> = {
  RM: {
    name: "Región Metropolitana de Santiago",
    comunas: [
      "Santiago Centro",
      "Providencia",
      "Las Condes",
      "Ñuñoa",
      "La Florida",
      "Maipú",
      "Puente Alto",
      "San Miguel",
      "Vitacura",
      "Peñalolén",
      "Macul",
      "Quinta Normal",
    ],
    baseDays: "24 a 48 horas hábiles",
    starkenRate: 3490,
    chilexpressRate: 3990,
    blueExpressRate: 2990,
  },
  VALPO: {
    name: "Región de Valparaíso",
    comunas: ["Viña del Mar", "Valparaíso", "Concón", "Quilpué", "Villa Alemana", "Quillota", "San Antonio"],
    baseDays: "24 a 48 horas hábiles",
    starkenRate: 3990,
    chilexpressRate: 4490,
    blueExpressRate: 3490,
  },
  BIOBIO: {
    name: "Región del Biobío",
    comunas: ["Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Coronel", "Los Ángeles"],
    baseDays: "48 a 72 horas hábiles",
    starkenRate: 4490,
    chilexpressRate: 4990,
    blueExpressRate: 3990,
  },
  COQUIMBO: {
    name: "Región de Coquimbo",
    comunas: ["La Serena", "Coquimbo", "Ovalle", "Illapel"],
    baseDays: "48 a 72 horas hábiles",
    starkenRate: 4490,
    chilexpressRate: 4990,
    blueExpressRate: 3990,
  },
  ANTOFAGASTA: {
    name: "Región de Antofagasta",
    comunas: ["Antofagasta", "Calama", "Tocopilla", "Mejillones"],
    baseDays: "2 a 4 días hábiles",
    starkenRate: 5490,
    chilexpressRate: 5990,
    blueExpressRate: 4990,
  },
  ARAUCANIA: {
    name: "Región de La Araucanía",
    comunas: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol"],
    baseDays: "2 a 3 días hábiles",
    starkenRate: 4690,
    chilexpressRate: 5190,
    blueExpressRate: 4190,
  },
  LOS_LAGOS: {
    name: "Región de Los Lagos",
    comunas: ["Puerto Montt", "Puerto Varas", "Osorno", "Castro", "Ancud"],
    baseDays: "3 a 4 días hábiles",
    starkenRate: 5290,
    chilexpressRate: 5790,
    blueExpressRate: 4790,
  },
};

export function ShippingCalculator() {
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>("RM");
  const [selectedComuna, setSelectedComuna] = useState<string>("Santiago Centro");
  const [selectedCourier, setSelectedCourier] = useState<"STARKEN" | "CHILEXPRESS" | "BLUE_EXPRESS" | "PICKUP">("STARKEN");

  const activeRegion = CHILE_REGIONS[selectedRegionKey] || CHILE_REGIONS.RM;

  const handleRegionChange = (newKey: string) => {
    setSelectedRegionKey(newKey);
    const reg = CHILE_REGIONS[newKey];
    if (reg && reg.comunas.length > 0) {
      setSelectedComuna(reg.comunas[0]);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E5E5E5] p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1F3A5F]/10 text-[#1F3A5F] flex items-center justify-center">
            <Truck className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div>
            <span className="text-xs font-black text-[#1A1A1A] block">
              Calculadora de Envíos para Chile
            </span>
            <span className="text-[10px] text-[#666666]">
              Despacho con empaque blindado a domicilio o sucursal
            </span>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
          Envíos Asegurados
        </span>
      </div>

      {/* Region and Comuna Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#1A1A1A] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#FF6B35]" />
            Región:
          </label>
          <select
            value={selectedRegionKey}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
          >
            {Object.entries(CHILE_REGIONS).map(([key, data]) => (
              <option key={key} value={key}>
                {data.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#1A1A1A]">
            Comuna de Destino:
          </label>
          <select
            value={selectedComuna}
            onChange={(e) => setSelectedComuna(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
          >
            {activeRegion.comunas.map((comuna) => (
              <option key={comuna} value={comuna}>
                {comuna}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Available Courier Rates */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-[#1A1A1A] block">
          Opciones disponibles para {selectedComuna}:
        </span>

        <div className="space-y-1.5 text-xs">
          {/* Starken */}
          <button
            type="button"
            onClick={() => setSelectedCourier("STARKEN")}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
              selectedCourier === "STARKEN"
                ? "bg-orange-50/60 border-[#FF6B35] shadow-xs"
                : "bg-white border-[#E5E5E5] hover:border-[#CCCCCC]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border flex items-center justify-center border-[#FF6B35]">
                {selectedCourier === "STARKEN" && <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-[#1A1A1A]">Starken Express</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF6B35]/15 text-[#FF6B35] font-bold">
                    RECOMENDADO
                  </span>
                </div>
                <span className="text-[10px] text-[#666666]">Entrega estimada: {activeRegion.baseDays}</span>
              </div>
            </div>
            <span className="font-mono font-black text-[#1A1A1A]">
              {formatCLP(activeRegion.starkenRate)}
            </span>
          </button>

          {/* Chilexpress */}
          <button
            type="button"
            onClick={() => setSelectedCourier("CHILEXPRESS")}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
              selectedCourier === "CHILEXPRESS"
                ? "bg-orange-50/60 border-[#FF6B35] shadow-xs"
                : "bg-white border-[#E5E5E5] hover:border-[#CCCCCC]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border flex items-center justify-center border-[#FF6B35]">
                {selectedCourier === "CHILEXPRESS" && <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />}
              </div>
              <div>
                <span className="font-black text-[#1A1A1A] block">Chilexpress Prioritario</span>
                <span className="text-[10px] text-[#666666]">Entrega al día siguiente hábil</span>
              </div>
            </div>
            <span className="font-mono font-black text-[#1A1A1A]">
              {formatCLP(activeRegion.chilexpressRate)}
            </span>
          </button>

          {/* Blue Express */}
          <button
            type="button"
            onClick={() => setSelectedCourier("BLUE_EXPRESS")}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
              selectedCourier === "BLUE_EXPRESS"
                ? "bg-orange-50/60 border-[#FF6B35] shadow-xs"
                : "bg-white border-[#E5E5E5] hover:border-[#CCCCCC]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border flex items-center justify-center border-[#FF6B35]">
                {selectedCourier === "BLUE_EXPRESS" && <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />}
              </div>
              <div>
                <span className="font-black text-[#1A1A1A] block">Blue Express Domicilio</span>
                <span className="text-[10px] text-[#666666]">Tarifa económica a todo el país</span>
              </div>
            </div>
            <span className="font-mono font-black text-[#1A1A1A]">
              {formatCLP(activeRegion.blueExpressRate)}
            </span>
          </button>

          {/* In-Store Pickup */}
          {selectedRegionKey === "RM" && (
            <button
              type="button"
              onClick={() => setSelectedCourier("PICKUP")}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                selectedCourier === "PICKUP"
                  ? "bg-emerald-50 border-emerald-500 shadow-xs"
                  : "bg-white border-[#E5E5E5] hover:border-[#CCCCCC]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border flex items-center justify-center border-emerald-500">
                  {selectedCourier === "PICKUP" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <div>
                  <span className="font-black text-emerald-800 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> Retiro en Tienda (Santiago Centro / Providencia)
                  </span>
                  <span className="text-[10px] text-emerald-700">Listo para retiro en 2 horas hábiles</span>
                </div>
              </div>
              <span className="font-mono font-black text-emerald-700 uppercase text-[11px]">
                ¡Gratis!
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Trust Micro-Badge */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#F0F0F0] text-[10px] text-[#666666]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Todos los envíos van 100% asegurados con número de seguimiento en tiempo real.</span>
      </div>
    </div>
  );
}
