"use client";

import React, { useState, useEffect, useId, useCallback } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Check,
  Layers,
  Sliders,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Hash,
} from "lucide-react";
import {
  CustomCategorySpecifications,
  CustomDynamicCategorySpecs,
  DynamicSpecItem,
} from "@/lib/types/domain";

interface CustomDynamicSpecificationsFormProps {
  customCategoryLabel: string;
  value?: CustomCategorySpecifications;
  onChange: (specs: CustomCategorySpecifications) => void;
}

const generateId = () => `spec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const CustomDynamicSpecificationsForm: React.FC<CustomDynamicSpecificationsFormProps> = ({
  customCategoryLabel,
  value = {},
  onChange,
}) => {
  const categoryName = (customCategoryLabel || "Producto Personalizado").trim();

  // Extract initial dynamic specs or fallback from flat custom map
  const existingDynamic: CustomDynamicCategorySpecs =
    value.customDynamic || {
      categoryName,
      subtype: value.customSubtype || "",
      availableSubtypes: value.availableSubtypes || [],
      basicSpecs: value.basicSpecs || [],
      advancedSpecs: value.advancedSpecs || [],
    };

  // Subtypes state
  const [subtypes, setSubtypes] = useState<string[]>(() => {
    if (existingDynamic.availableSubtypes && existingDynamic.availableSubtypes.length > 0) {
      return existingDynamic.availableSubtypes;
    }
    if (existingDynamic.subtype) {
      return [existingDynamic.subtype];
    }
    return ["Estándar", "Edición Especial"];
  });

  const [selectedSubtype, setSelectedSubtype] = useState<string>(
    () => existingDynamic.subtype || value.customSubtype || ""
  );

  const [newSubtypeName, setNewSubtypeName] = useState<string>("");
  const [editingSubtypeIdx, setEditingSubtypeIdx] = useState<number | null>(null);
  const [editingSubtypeText, setEditingSubtypeText] = useState<string>("");

  // Basic Specifications
  const [basicSpecs, setBasicSpecs] = useState<DynamicSpecItem[]>(() => {
    if (existingDynamic.basicSpecs && existingDynamic.basicSpecs.length > 0) {
      return existingDynamic.basicSpecs;
    }
    // If flat custom exists, initialize first 2 specs
    if (value.custom && typeof value.custom === "object") {
      const entries = Object.entries(value.custom).filter(
        ([k]) => !k.toLowerCase().startsWith("tipo de")
      );
      if (entries.length > 0) {
        return entries.slice(0, 3).map(([name, val]) => ({
          id: generateId(),
          name,
          value: String(val),
        }));
      }
    }
    return [
      { id: generateId(), name: "Material Principal", value: "" },
      { id: generateId(), name: "Dimensiones / Tamaño", value: "" },
    ];
  });

  // Advanced Specifications
  const [advancedSpecs, setAdvancedSpecs] = useState<DynamicSpecItem[]>(() => {
    if (existingDynamic.advancedSpecs && existingDynamic.advancedSpecs.length > 0) {
      return existingDynamic.advancedSpecs;
    }
    if (value.custom && typeof value.custom === "object") {
      const entries = Object.entries(value.custom).filter(
        ([k]) => !k.toLowerCase().startsWith("tipo de")
      );
      if (entries.length > 3) {
        return entries.slice(3).map(([name, val]) => ({
          id: generateId(),
          name,
          value: String(val),
        }));
      }
    }
    return [
      { id: generateId(), name: "Conectividad / Interfaz", value: "" },
      { id: generateId(), name: "Garantía de Fábrica", value: "" },
    ];
  });

  const [newBasicName, setNewBasicName] = useState("");
  const [newBasicValue, setNewBasicValue] = useState("");
  const [newAdvancedName, setNewAdvancedName] = useState("");
  const [newAdvancedValue, setNewAdvancedValue] = useState("");

  // Emit changes to parent
  const syncToParent = useCallback(
    (
      currentSubtypes: string[],
      currentSubtype: string,
      currentBasic: DynamicSpecItem[],
      currentAdvanced: DynamicSpecItem[]
    ) => {
      const flatMap: Record<string, string> = {};

      if (currentSubtype.trim()) {
        flatMap[`Tipo de ${categoryName}`] = currentSubtype.trim();
      }

      currentBasic.forEach((s) => {
        if (s.name.trim()) {
          flatMap[s.name.trim()] = s.value.trim();
        }
      });

      currentAdvanced.forEach((s) => {
        if (s.name.trim()) {
          flatMap[s.name.trim()] = s.value.trim();
        }
      });

      const updatedDynamic: CustomDynamicCategorySpecs = {
        categoryName,
        subtype: currentSubtype,
        availableSubtypes: currentSubtypes,
        basicSpecs: currentBasic,
        advancedSpecs: currentAdvanced,
      };

      onChange({
        ...value,
        categoryType: "OTHER",
        customCategoryName: categoryName,
        customSubtype: currentSubtype,
        availableSubtypes: currentSubtypes,
        basicSpecs: currentBasic,
        advancedSpecs: currentAdvanced,
        customDynamic: updatedDynamic,
        custom: flatMap,
      });
    },
    [categoryName, onChange, value]
  );

  // Subtype handlers
  const handleAddSubtype = () => {
    const trimmed = newSubtypeName.trim();
    if (!trimmed) return;
    if (subtypes.includes(trimmed)) {
      setSelectedSubtype(trimmed);
      setNewSubtypeName("");
      return;
    }
    const nextSubtypes = [...subtypes, trimmed];
    const nextSelected = selectedSubtype || trimmed;
    setSubtypes(nextSubtypes);
    setSelectedSubtype(nextSelected);
    setNewSubtypeName("");
    syncToParent(nextSubtypes, nextSelected, basicSpecs, advancedSpecs);
  };

  const handleSelectSubtype = (sub: string) => {
    const nextSelected = selectedSubtype === sub ? "" : sub;
    setSelectedSubtype(nextSelected);
    syncToParent(subtypes, nextSelected, basicSpecs, advancedSpecs);
  };

  const handleRemoveSubtype = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = subtypes[idx];
    const nextSubtypes = subtypes.filter((_, i) => i !== idx);
    let nextSelected = selectedSubtype;
    if (selectedSubtype === target) {
      nextSelected = nextSubtypes[0] || "";
    }
    setSubtypes(nextSubtypes);
    setSelectedSubtype(nextSelected);
    syncToParent(nextSubtypes, nextSelected, basicSpecs, advancedSpecs);
  };

  const handleStartEditSubtype = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubtypeIdx(idx);
    setEditingSubtypeText(subtypes[idx]);
  };

  const handleSaveEditSubtype = (idx: number) => {
    const trimmed = editingSubtypeText.trim();
    if (!trimmed) {
      setEditingSubtypeIdx(null);
      return;
    }
    const oldName = subtypes[idx];
    const nextSubtypes = [...subtypes];
    nextSubtypes[idx] = trimmed;
    let nextSelected = selectedSubtype;
    if (selectedSubtype === oldName) {
      nextSelected = trimmed;
    }
    setSubtypes(nextSubtypes);
    setSelectedSubtype(nextSelected);
    setEditingSubtypeIdx(null);
    syncToParent(nextSubtypes, nextSelected, basicSpecs, advancedSpecs);
  };

  // Basic specs handlers
  const handleAddBasicSpec = () => {
    const newSpec: DynamicSpecItem = {
      id: generateId(),
      name: newBasicName.trim() || `Especificación ${basicSpecs.length + 1}`,
      value: newBasicValue.trim(),
    };
    const next = [...basicSpecs, newSpec];
    setBasicSpecs(next);
    setNewBasicName("");
    setNewBasicValue("");
    syncToParent(subtypes, selectedSubtype, next, advancedSpecs);
  };

  const handleUpdateBasicSpec = (id: string, patch: Partial<DynamicSpecItem>) => {
    const next = basicSpecs.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setBasicSpecs(next);
    syncToParent(subtypes, selectedSubtype, next, advancedSpecs);
  };

  const handleRemoveBasicSpec = (id: string) => {
    const next = basicSpecs.filter((s) => s.id !== id);
    setBasicSpecs(next);
    syncToParent(subtypes, selectedSubtype, next, advancedSpecs);
  };

  // Advanced specs handlers
  const handleAddAdvancedSpec = () => {
    const newSpec: DynamicSpecItem = {
      id: generateId(),
      name: newAdvancedName.trim() || `Atributo Avanzado ${advancedSpecs.length + 1}`,
      value: newAdvancedValue.trim(),
    };
    const next = [...advancedSpecs, newSpec];
    setAdvancedSpecs(next);
    setNewAdvancedName("");
    setNewAdvancedValue("");
    syncToParent(subtypes, selectedSubtype, basicSpecs, next);
  };

  const handleUpdateAdvancedSpec = (id: string, patch: Partial<DynamicSpecItem>) => {
    const next = advancedSpecs.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setAdvancedSpecs(next);
    syncToParent(subtypes, selectedSubtype, basicSpecs, next);
  };

  const handleRemoveAdvancedSpec = (id: string) => {
    const next = advancedSpecs.filter((s) => s.id !== id);
    setAdvancedSpecs(next);
    syncToParent(subtypes, selectedSubtype, basicSpecs, next);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dynamic Subtype Management ("Tipo de..") */}
      <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF6E42]" />
            Tipo de {categoryName} *
            <span className="text-[11px] font-normal text-[#9bb5c2]">
              (Elige o agrega el subtipo específico para este producto)
            </span>
          </label>
          <span className="text-[11px] text-[#9bb5c2]">
            Activo:{" "}
            <strong className="text-[#FF6E42]">
              {selectedSubtype || "Ninguno seleccionado"}
            </strong>
          </span>
        </div>

        {/* Subtypes Chips / Grid */}
        <div className="flex flex-wrap gap-2 pt-1">
          {subtypes.map((sub, idx) => {
            const isSelected = selectedSubtype === sub;
            const isEditing = editingSubtypeIdx === idx;

            if (isEditing) {
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-[#092634] border border-[#FF6E42] rounded-xl px-2.5 py-1.5"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingSubtypeText}
                    onChange={(e) => setEditingSubtypeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEditSubtype(idx);
                      } else if (e.key === "Escape") {
                        setEditingSubtypeIdx(null);
                      }
                    }}
                    className="bg-transparent text-xs text-white outline-none w-28 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEditSubtype(idx)}
                    className="p-1 rounded hover:bg-[#004E72] text-emerald-400"
                    title="Guardar nombre"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={idx}
                onClick={() => handleSelectSubtype(sub)}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition select-none shadow-sm ${
                  isSelected
                    ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] ring-2 ring-[#FF6E42]/60 shadow-md"
                    : "bg-[#092634] border-[#004E72]/60 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-[#F9F9F9]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6E42] shrink-0" />}
                  <span>{sub}</span>
                </div>

                {/* Inline Actions (Rename & Delete) */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition pl-1 border-l border-white/10">
                  <button
                    type="button"
                    onClick={(e) => handleStartEditSubtype(idx, e)}
                    className="p-1 rounded hover:text-white hover:bg-white/10"
                    title="Renombrar este tipo"
                  >
                    <span className="text-[10px]">✏️</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSubtype(idx, e)}
                    className="p-1 rounded hover:text-rose-400 hover:bg-rose-500/10"
                    title="Quitar este tipo"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input to add a new subtype */}
        <div className="flex items-center gap-2 pt-1 max-w-md">
          <input
            type="text"
            value={newSubtypeName}
            onChange={(e) => setNewSubtypeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtype();
              }
            }}
            placeholder={`ej: Smart TV 4K, Edición Limitada, etc.`}
            className="flex-1 px-3 py-2 rounded-xl bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42] placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={handleAddSubtype}
            className="px-3.5 py-2 rounded-xl bg-[#FF6E42] hover:bg-[#FF6E42]/90 text-[#092634] font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Tipo</span>
          </button>
        </div>
      </div>

      {/* SECTION A: ESPECIFICACIONES BÁSICAS */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
            <h3 className="text-xs font-bold text-[#FF6E42] uppercase tracking-wider">
              Especificaciones Básicas
            </h3>
            <span className="text-[11px] text-[#9bb5c2]">
              (Atributos clave mostrados en la cabecera técnica)
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddBasicSpec}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004E72]/40 hover:bg-[#004E72] text-[#F9F9F9] text-xs font-semibold border border-[#004E72] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF6E42]" />
            <span>Agregar Fila Básica</span>
          </button>
        </div>

        {basicSpecs.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[#004E72]/60 text-center text-xs text-[#9bb5c2] space-y-2">
            <p>No hay especificaciones básicas añadidas aún.</p>
            <button
              type="button"
              onClick={handleAddBasicSpec}
              className="text-[#FF6E42] hover:underline font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Crear la primera especificación básica
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {basicSpecs.map((spec, index) => (
              <div
                key={spec.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#092634] border border-[#004E72]/50 items-center hover:border-[#004E72] transition"
              >
                {/* Nombre de la Especificación */}
                <div className="sm:col-span-4 space-y-1">
                  <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                    Nombre Atributo #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={spec.name}
                    onChange={(e) => handleUpdateBasicSpec(spec.id, { name: e.target.value })}
                    placeholder="ej: Resolución, Capacidad, Potencia"
                    className="w-full px-3 py-2 rounded-lg bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>

                {/* Valor de la Especificación */}
                <div className="sm:col-span-7 space-y-1">
                  <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                    Valor del Atributo
                  </span>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateBasicSpec(spec.id, { value: e.target.value })}
                    placeholder="ej: 3840 x 2160 (4K), 1 TB NVMe, etc."
                    className="w-full px-3 py-2 rounded-lg bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>

                {/* Botón Quitar */}
                <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveBasicSpec(spec.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition cursor-pointer"
                    title="Quitar especificación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION B: ESPECIFICACIONES AVANZADAS */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
            <h3 className="text-xs font-bold text-[#FF6E42] uppercase tracking-wider">
              Especificaciones Avanzadas
            </h3>
            <span className="text-[11px] text-[#9bb5c2]">
              (Detalles técnicos y de ingeniería especializados)
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddAdvancedSpec}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004E72]/40 hover:bg-[#004E72] text-[#F9F9F9] text-xs font-semibold border border-[#004E72] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF6E42]" />
            <span>Agregar Fila Avanzada</span>
          </button>
        </div>

        {advancedSpecs.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[#004E72]/60 text-center text-xs text-[#9bb5c2] space-y-2">
            <p>No hay especificaciones avanzadas añadidas aún.</p>
            <button
              type="button"
              onClick={handleAddAdvancedSpec}
              className="text-[#FF6E42] hover:underline font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Crear la primera especificación avanzada
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {advancedSpecs.map((spec, index) => (
              <div
                key={spec.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#092634] border border-[#004E72]/50 items-center hover:border-[#004E72] transition"
              >
                {/* Nombre de la Especificación */}
                <div className="sm:col-span-4 space-y-1">
                  <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                    Nombre Atributo #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={spec.name}
                    onChange={(e) => handleUpdateAdvancedSpec(spec.id, { name: e.target.value })}
                    placeholder="ej: Tecnología de Panel, Conectividad, Puertos"
                    className="w-full px-3 py-2 rounded-lg bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>

                {/* Valor de la Especificación */}
                <div className="sm:col-span-7 space-y-1">
                  <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                    Valor del Atributo
                  </span>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateAdvancedSpec(spec.id, { value: e.target.value })}
                    placeholder="ej: QD-OLED 144Hz, 4x HDMI 2.1 eARC, etc."
                    className="w-full px-3 py-2 rounded-lg bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>

                {/* Botón Quitar */}
                <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveAdvancedSpec(spec.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition cursor-pointer"
                    title="Quitar especificación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
