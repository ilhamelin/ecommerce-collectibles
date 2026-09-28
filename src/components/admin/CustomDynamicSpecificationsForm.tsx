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
  CustomCategoryEntity,
} from "@/lib/types/domain";

interface CustomDynamicSpecificationsFormProps {
  customCategoryLabel: string;
  customCategoryTemplate?: CustomCategoryEntity;
  value?: CustomCategorySpecifications;
  onChange: (specs: CustomCategorySpecifications) => void;
}

const generateId = () => `spec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const CustomDynamicSpecificationsForm: React.FC<CustomDynamicSpecificationsFormProps> = ({
  customCategoryLabel,
  customCategoryTemplate,
  value = {},
  onChange,
}) => {
  const categoryName = (customCategoryLabel || customCategoryTemplate?.name || "Producto Personalizado").trim();

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
    if (customCategoryTemplate?.availableSubtypes && customCategoryTemplate.availableSubtypes.length > 0) {
      return customCategoryTemplate.availableSubtypes;
    }
    if (existingDynamic.subtype) {
      return [existingDynamic.subtype];
    }
    return ["Estándar", "Edición Especial"];
  });

  const [selectedSubtype, setSelectedSubtype] = useState<string>(
    () => existingDynamic.subtype || value.customSubtype || (customCategoryTemplate?.availableSubtypes?.[0] || "")
  );

  const [newSubtypeName, setNewSubtypeName] = useState<string>("");
  const [editingSubtypeIdx, setEditingSubtypeIdx] = useState<number | null>(null);
  const [editingSubtypeText, setEditingSubtypeText] = useState<string>("");

  // Basic Specifications
  const [basicSpecs, setBasicSpecs] = useState<DynamicSpecItem[]>(() => {
    if (existingDynamic.basicSpecs && existingDynamic.basicSpecs.length > 0) {
      return existingDynamic.basicSpecs;
    }
    if (customCategoryTemplate?.basicSpecFields && customCategoryTemplate.basicSpecFields.length > 0) {
      return customCategoryTemplate.basicSpecFields.map((f) => ({
        id: f.id || generateId(),
        name: f.name,
        value: f.defaultValue || "",
      }));
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
    if (customCategoryTemplate?.advancedSpecFields && customCategoryTemplate.advancedSpecFields.length > 0) {
      return customCategoryTemplate.advancedSpecFields.map((f) => ({
        id: f.id || generateId(),
        name: f.name,
        value: f.defaultValue || "",
      }));
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
      {/* Subtypes Selector ("Tipo de..") */}
      {subtypes.length > 0 && (
        <div className="p-4 rounded-xl bg-[#004E72]/15 border border-[#004E72]/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF6E42]" />
              <span>Tipo de {categoryName} *</span>
              <span className="text-[11px] font-normal text-[#9bb5c2]">
                (Elige el subtipo específico para este producto)
              </span>
            </label>
            <span className="text-[11px] text-[#9bb5c2]">
              Activo:{" "}
              <strong className="text-[#FF6E42]">
                {selectedSubtype || "Ninguno seleccionado"}
              </strong>
            </span>
          </div>

          {/* Subtypes Pills (Clean clickable badges without edit/delete icons) */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {subtypes.map((sub, idx) => {
              const isSelected = selectedSubtype === sub;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSubtype(sub)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition select-none flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#FF6E42] text-[#092634] border-[#FF6E42] shadow-sm font-bold ring-2 ring-[#FF6E42]/60"
                      : "bg-[#092634] border-[#004E72]/60 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-[#F9F9F9]"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#092634] shrink-0" />}
                  <span>{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION A: ESPECIFICACIONES BÁSICAS */}
      {basicSpecs.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#004E72]/40 pb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
            <h3 className="text-xs font-bold text-[#FF6E42] uppercase tracking-wider">
              Especificaciones Básicas
            </h3>
            <span className="text-[11px] text-[#9bb5c2]">
              (Atributos clave mostrados en la cabecera técnica)
            </span>
          </div>

          {/* Standard 2-column responsive grid matching other categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {basicSpecs.map((spec) => {
              const templateField = customCategoryTemplate?.basicSpecFields.find(
                (f) => f.name.toLowerCase() === spec.name.toLowerCase() || f.id === spec.id
              );
              const placeholder = templateField?.placeholder || `ej: Valor de ${spec.name}`;
              const isRequired = Boolean(templateField?.required);

              return (
                <div key={spec.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9bb5c2] flex items-center justify-between">
                    <span>
                      {spec.name} {isRequired && <span className="text-[#FF6E42]">*</span>}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateBasicSpec(spec.id, { value: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION B: ESPECIFICACIONES AVANZADAS */}
      {advancedSpecs.length > 0 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center gap-2 border-b border-[#004E72]/40 pb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
            <h3 className="text-xs font-bold text-[#FF6E42] uppercase tracking-wider">
              Especificaciones Avanzadas
            </h3>
            <span className="text-[11px] text-[#9bb5c2]">
              (Detalles técnicos y de ingeniería especializados)
            </span>
          </div>

          {/* Standard 2-column responsive grid matching other categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {advancedSpecs.map((spec) => {
              const templateField = customCategoryTemplate?.advancedSpecFields.find(
                (f) => f.name.toLowerCase() === spec.name.toLowerCase() || f.id === spec.id
              );
              const placeholder = templateField?.placeholder || `ej: Valor de ${spec.name}`;
              const isRequired = Boolean(templateField?.required);

              return (
                <div key={spec.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-[#9bb5c2] flex items-center justify-between">
                    <span>
                      {spec.name} {isRequired && <span className="text-[#FF6E42]">*</span>}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateAdvancedSpec(spec.id, { value: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
