"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sliders,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Sparkles,
  Tv,
  Monitor,
  Cpu,
  Gamepad2,
  Headphones,
  Box,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
  HardDrive,
  Shield,
  Zap,
  Save,
  HelpCircle,
  Eye,
} from "lucide-react";
import { categoryClient } from "@/lib/services/categoryClient";
import type { CustomCategoryTemplateField } from "@/lib/types/domain";

// Selectable modern icons for category branding
const AVAILABLE_ICONS = [
  { id: "Tv", label: "Pantallas / TV", icon: Tv },
  { id: "Monitor", label: "Monitores", icon: Monitor },
  { id: "Cpu", label: "Hardware / PC", icon: Cpu },
  { id: "Gamepad2", label: "Gaming / Mandos", icon: Gamepad2 },
  { id: "Headphones", label: "Audio / Headsets", icon: Headphones },
  { id: "Box", label: "Cajas / Packs", icon: Box },
  { id: "Shirt", label: "Indumentaria", icon: Shirt },
  { id: "BookOpen", label: "Libros / Cómics", icon: BookOpen },
  { id: "Gift", label: "Merch / Regalos", icon: Gift },
  { id: "Disc3", label: "Discos / OST", icon: Disc3 },
  { id: "HardDrive", label: "Almacenamiento", icon: HardDrive },
  { id: "Zap", label: "Energía / Fuentes", icon: Zap },
  { id: "Shield", label: "Coleccionables", icon: Shield },
  { id: "Sliders", label: "Accesorios", icon: Sliders },
  { id: "Sparkles", label: "Especial", icon: Sparkles },
  { id: "Tag", label: "Etiqueta", icon: Tag },
];

export default function NewCategoryPage() {
  const router = useRouter();

  // Basic category metadata
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Tv");

  // Subtypes ("Tipo de...")
  const [subtypes, setSubtypes] = useState<string[]>(["Estándar", "Edición Especial"]);
  const [newSubtypeName, setNewSubtypeName] = useState("");

  // Basic Specification Fields
  const [basicFields, setBasicFields] = useState<CustomCategoryTemplateField[]>([
    {
      id: "f-b1",
      name: "Resolución",
      placeholder: "ej: 3840 x 2160 (4K UHD)",
      defaultValue: "",
      required: true,
    },
    {
      id: "f-b2",
      name: "Tamaño de Pantalla",
      placeholder: "ej: 65 pulgadas (165 cm)",
      defaultValue: "",
      required: false,
    },
    {
      id: "f-b3",
      name: "Tasa de Refresco",
      placeholder: "ej: 144 Hz nativo",
      defaultValue: "",
      required: false,
    },
  ]);

  // Advanced Specification Fields
  const [advancedFields, setAdvancedFields] = useState<CustomCategoryTemplateField[]>([
    {
      id: "f-a1",
      name: "Tecnología de Panel",
      placeholder: "ej: QD-OLED / Mini LED",
      defaultValue: "",
      required: false,
    },
    {
      id: "f-a2",
      name: "Formatos HDR",
      placeholder: "ej: Dolby Vision, HDR10+, HLG",
      defaultValue: "",
      required: false,
    },
    {
      id: "f-a3",
      name: "Puertos de Entrada",
      placeholder: "ej: 4x HDMI 2.1 (eARC, ALLM, VRR), 2x USB",
      defaultValue: "",
      required: false,
    },
  ]);

  // New field draft inputs
  const [newBasicName, setNewBasicName] = useState("");
  const [newBasicPlaceholder, setNewBasicPlaceholder] = useState("");
  const [newAdvancedName, setNewAdvancedName] = useState("");
  const [newAdvancedPlaceholder, setNewAdvancedPlaceholder] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-generate slug from name if not manually modified
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

  // Subtype actions
  const handleAddSubtype = () => {
    const trimmed = newSubtypeName.trim();
    if (!trimmed) return;
    if (!subtypes.includes(trimmed)) {
      setSubtypes([...subtypes, trimmed]);
    }
    setNewSubtypeName("");
  };

  const handleRemoveSubtype = (idx: number) => {
    setSubtypes(subtypes.filter((_, i) => i !== idx));
  };

  // Basic field actions
  const handleAddBasicField = () => {
    const trimmed = newBasicName.trim();
    if (!trimmed) return;
    const newField: CustomCategoryTemplateField = {
      id: `bf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      placeholder: newBasicPlaceholder.trim() || `ej: Valor de ${trimmed}`,
      defaultValue: "",
      required: false,
    };
    setBasicFields([...basicFields, newField]);
    setNewBasicName("");
    setNewBasicPlaceholder("");
  };

  const handleRemoveBasicField = (id: string) => {
    setBasicFields(basicFields.filter((f) => f.id !== id));
  };

  const handleUpdateBasicField = (id: string, patch: Partial<CustomCategoryTemplateField>) => {
    setBasicFields(basicFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  // Advanced field actions
  const handleAddAdvancedField = () => {
    const trimmed = newAdvancedName.trim();
    if (!trimmed) return;
    const newField: CustomCategoryTemplateField = {
      id: `af-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      placeholder: newAdvancedPlaceholder.trim() || `ej: Valor de ${trimmed}`,
      defaultValue: "",
      required: false,
    };
    setAdvancedFields([...advancedFields, newField]);
    setNewAdvancedName("");
    setNewAdvancedPlaceholder("");
  };

  const handleRemoveAdvancedField = (id: string) => {
    setAdvancedFields(advancedFields.filter((f) => f.id !== id));
  };

  const handleUpdateAdvancedField = (id: string, patch: Partial<CustomCategoryTemplateField>) => {
    setAdvancedFields(advancedFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("El nombre de la categoría es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await categoryClient.createCategory({
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-"),
      iconName,
      description: description.trim(),
      availableSubtypes: subtypes.filter(Boolean),
      basicSpecFields: basicFields.filter((f) => f.name.trim()),
      advancedSpecFields: advancedFields.filter((f) => f.name.trim()),
    });

    setIsSubmitting(false);

    if (res.success && res.category) {
      setSuccessMsg(`¡Categoría "${res.category.name}" creada exitosamente! Redirigiendo al formulario de producto...`);
      setTimeout(() => {
        router.push(`/admin/products/new?newCategory=${res.category?.id}`);
      }, 1500);
    } else {
      setErrorMsg(res.error || "Ocurrió un error al registrar la nueva categoría.");
    }
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find((i) => i.id === iconName)?.icon || Layers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            Panel de Administración • Creador de Categorías
          </div>
          <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-3">
            <span>Diseñador de Nueva Categoría & Ficha Técnica</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30">
              Formulario Personalizado
            </span>
          </h1>
          <p className="text-sm text-[#555555]">
            Crea un nuevo tipo de producto definiendo sus subtipos y la totalidad de los inputs técnicos que compondrán su ficha oficial.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] text-xs font-semibold border border-[#E5E5E5] transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6B35]" /> Volver a Crear Producto
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Builder (Left 8) + Live Preview (Right 4) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Identidad de la Categoría */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                1. Identidad de la Nueva Categoría
              </h2>
              <span className="text-xs text-[#9bb5c2]">Paso 1 de 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FF6E42]" />
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ej: Televisores, Juegos de Mesa, Cómics, Instrumentos Musicales..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/70 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9bb5c2]">Identificador de URL / Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ej: televisores"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/50 text-[#F9F9F9] text-xs font-mono focus:outline-none focus:border-[#FF6E42]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9bb5c2]">Descripción / Propósito</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ej: Pantallas 4K OLED, smart TVs y monitores para gaming"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/50 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
                />
              </div>
            </div>

            {/* Icon Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6E42]" />
                Icono Distintivo en el Panel de Productos
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = iconName === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIconName(item.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                        isSelected
                          ? "bg-[#004E72] border-[#FF6E42] text-white ring-2 ring-[#FF6E42]/60 shadow-md"
                          : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[#FF6E42]" : ""}`} />
                      <span className="text-[10px] truncate max-w-full font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 2: Configuración de "Tipo de..." (Subtipos) */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                2. Subtipos Disponibles ("Tipo de {name || "Categoría"}")
              </h2>
              <span className="text-xs text-[#9bb5c2]">Paso 2 de 4</span>
            </div>

            <p className="text-xs text-[#9bb5c2]">
              Configura las opciones de tipo que el administrador podrá seleccionar al publicar productos dentro de esta categoría (ej: OLED, QLED, Smart TV).
            </p>

            {/* Subtypes List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {subtypes.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#004E72]/30 border border-[#004E72] text-[#F9F9F9] text-xs font-semibold shadow-sm"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtype(idx)}
                    className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                    title="Eliminar opción de tipo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Input to add subtype */}
            <div className="flex items-center gap-2 pt-2 max-w-md">
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
                placeholder="ej: Smart TV 4K, Mini LED, etc."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
              />
              <button
                type="button"
                onClick={handleAddSubtype}
                className="px-3.5 py-2 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF6E42]" />
                <span>Agregar Tipo</span>
              </button>
            </div>
          </div>

          {/* STEP 3: Diseñador de Campos de Especificaciones Básicas */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                3. Plantilla de Especificaciones Básicas
              </h2>
              <span className="text-xs text-[#9bb5c2]">Paso 3 de 4</span>
            </div>

            <p className="text-xs text-[#9bb5c2]">
              Define los inputs principales que aparecerán en la cabecera técnica del producto.
            </p>

            <div className="space-y-2.5">
              {basicFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/50 items-center hover:border-[#004E72] transition"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                      Nombre del Input #{idx + 1} *
                    </span>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleUpdateBasicField(field.id, { name: e.target.value })}
                      placeholder="ej: Resolución, Capacidad"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                      Texto de Ayuda / Placeholder
                    </span>
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) => handleUpdateBasicField(field.id, { placeholder: e.target.value })}
                      placeholder="ej: 3840 x 2160 (4K UHD)"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveBasicField(field.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Eliminar campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add basic field */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#004E72]/30 items-center">
              <input
                type="text"
                value={newBasicName}
                onChange={(e) => setNewBasicName(e.target.value)}
                placeholder="Nombre del nuevo atributo básico..."
                className="sm:col-span-5 px-3 py-2 rounded-xl bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
              />
              <input
                type="text"
                value={newBasicPlaceholder}
                onChange={(e) => setNewBasicPlaceholder(e.target.value)}
                placeholder="Texto placeholder de ejemplo..."
                className="sm:col-span-5 px-3 py-2 rounded-xl bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
              />
              <button
                type="button"
                onClick={handleAddBasicField}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF6E42]" />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* STEP 4: Diseñador de Campos de Especificaciones Avanzadas */}
          <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#004E72]/40 pb-3">
              <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
                4. Plantilla de Especificaciones Avanzadas
              </h2>
              <span className="text-xs text-[#9bb5c2]">Paso 4 de 4</span>
            </div>

            <p className="text-xs text-[#9bb5c2]">
              Define los atributos especializados de ingeniería y detalles técnicos secundarios para este producto.
            </p>

            <div className="space-y-2.5">
              {advancedFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/50 items-center hover:border-[#004E72] transition"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                      Nombre del Input Avanzado #{idx + 1} *
                    </span>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleUpdateAdvancedField(field.id, { name: e.target.value })}
                      placeholder="ej: Tecnología de Panel, Puertos"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1">
                    <span className="text-[10px] font-semibold text-[#9bb5c2] uppercase tracking-wider block">
                      Texto de Ayuda / Placeholder
                    </span>
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) => handleUpdateAdvancedField(field.id, { placeholder: e.target.value })}
                      placeholder="ej: QD-OLED / Mini LED"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveAdvancedField(field.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Eliminar campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add advanced field */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#004E72]/30 items-center">
              <input
                type="text"
                value={newAdvancedName}
                onChange={(e) => setNewAdvancedName(e.target.value)}
                placeholder="Nombre del nuevo atributo avanzado..."
                className="sm:col-span-5 px-3 py-2 rounded-xl bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
              />
              <input
                type="text"
                value={newAdvancedPlaceholder}
                onChange={(e) => setNewAdvancedPlaceholder(e.target.value)}
                placeholder="Texto placeholder de ejemplo..."
                className="sm:col-span-5 px-3 py-2 rounded-xl bg-[#092634] border border-[#004E72]/60 text-xs text-[#F9F9F9] focus:outline-none focus:border-[#FF6E42]"
              />
              <button
                type="button"
                onClick={handleAddAdvancedField}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#004E72] hover:bg-[#004E72]/80 text-[#F9F9F9] font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF6E42]" />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-xl bg-[#FF6E42] hover:bg-[#ff5421] text-[#092634] font-black text-sm tracking-wide transition shadow-lg shadow-[#FF6E42]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#092634] border-t-transparent rounded-full animate-spin" />
                  <span>Guardando Categoría...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar y Crear Categoría de Producto</span>
                </>
              )}
            </button>
            <Link
              href="/admin/products/new"
              className="py-3 px-5 rounded-xl bg-[#092634] hover:bg-[#004E72]/40 text-[#9bb5c2] hover:text-[#F9F9F9] border border-[#004E72]/60 font-semibold text-xs transition"
            >
              Cancelar
            </Link>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-3">
              <Eye className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider">
                Previsualización del Formulario
              </h3>
            </div>

            {/* Category Card Preview */}
            <div className="p-3.5 rounded-xl border-2 border-[#FF6B35] bg-[#092634] text-center space-y-2 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#004E72] flex items-center justify-center mx-auto text-[#FF6B35] shadow">
                <SelectedIconComponent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#F9F9F9]">{name || "Nombre de Categoría"}</h4>
                <p className="text-[11px] text-[#9bb5c2] line-clamp-1">{description || "Sin descripción aún"}</p>
              </div>
            </div>

            {/* Subtypes Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#1A1A1A] block">
                Tipo de {name || "Producto"}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subtypes.map((s, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                      i === 0
                        ? "bg-[#1F3A5F] text-white border-[#1F3A5F]"
                        : "bg-[#F7F7F5] text-[#666666] border-[#E5E5E5]"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Technical Specs Preview Table */}
            <div className="space-y-2 pt-2 border-t border-[#F0F0F0]">
              <span className="text-[11px] font-bold text-[#1F3A5F] block uppercase tracking-wider">
                Inputs Generados en Ficha Técnica
              </span>

              <div className="divide-y divide-[#F0F0F0] text-xs">
                <div className="py-1 font-bold text-[#FF6B35] text-[10px] uppercase">
                  Básicas ({basicFields.length})
                </div>
                {basicFields.map((f) => (
                  <div key={f.id} className="py-1.5 flex items-center justify-between text-[#555555]">
                    <span className="font-medium text-[#1A1A1A]">{f.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                      {f.placeholder || "ejemplo"}
                    </span>
                  </div>
                ))}

                <div className="py-1 font-bold text-[#1F3A5F] text-[10px] uppercase pt-2">
                  Avanzadas ({advancedFields.length})
                </div>
                {advancedFields.map((f) => (
                  <div key={f.id} className="py-1.5 flex items-center justify-between text-[#555555]">
                    <span className="font-medium text-[#1A1A1A]">{f.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                      {f.placeholder || "ejemplo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
