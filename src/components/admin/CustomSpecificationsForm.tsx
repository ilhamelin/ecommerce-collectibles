"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Tv,
  Headphones,
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  Shirt,
  BookOpen,
  Gift,
  Disc3,
  Sliders,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  CustomCategorySpecifications,
  ConsoleSpecifications,
  GamingAccessorySpecifications,
  MouseSpecifications,
  KeyboardSpecifications,
  HeadsetSpecifications,
  ControllerSpecifications,
  ApparelSpecifications,
  BookSpecifications,
  MerchSpecifications,
  AudioSpecifications,
} from "@/lib/types/domain";

interface CustomSpecificationsFormProps {
  customCategoryLabel: string;
  value?: CustomCategorySpecifications;
  onChange: (specs: CustomCategorySpecifications) => void;
}

export const CustomSpecificationsForm: React.FC<CustomSpecificationsFormProps> = ({
  customCategoryLabel,
  value = {},
  onChange,
}) => {
  // Infer active template from customCategoryLabel, or allow manual override
  const getInitialTemplate = (label: string): string => {
    const l = (label || "").toLowerCase();
    if (l.includes("consola") || l.includes("hardware")) return "CONSOLE";
    if (
      l.includes("accesorio") ||
      l.includes("gaming") ||
      l.includes("mouse") ||
      l.includes("teclado") ||
      l.includes("audifono") ||
      l.includes("headset")
    )
      return "GAMING_ACCESSORY";
    if (l.includes("ropa") || l.includes("estilo") || l.includes("poleron") || l.includes("polera"))
      return "APPAREL";
    if (l.includes("manga") || l.includes("artbook") || l.includes("libro") || l.includes("comic"))
      return "BOOK";
    if (l.includes("merch") || l.includes("decoraci") || l.includes("peluche") || l.includes("taza"))
      return "MERCH";
    if (l.includes("audio") || l.includes("ost") || l.includes("soundtrack") || l.includes("vinilo"))
      return "AUDIO";
    return "CONSOLE";
  };

  const [activeTemplate, setActiveTemplate] = useState<string>(() =>
    value?.categoryType || getInitialTemplate(customCategoryLabel)
  );

  // Synchronize active template when value.categoryType changes (e.g. via AI auto-fill) or when customCategoryLabel changes
  useEffect(() => {
    if (value?.categoryType) {
      setActiveTemplate(value.categoryType);
    } else if (customCategoryLabel) {
      setActiveTemplate(getInitialTemplate(customCategoryLabel));
    }
  }, [value?.categoryType, customCategoryLabel]);

  // Gaming Accessory Subtype: MOUSE | KEYBOARD | HEADSET | CONTROLLER
  const [accessoryType, setAccessoryType] = useState<"MOUSE" | "KEYBOARD" | "HEADSET" | "CONTROLLER">(
    () => (value?.gamingAccessory?.accessoryType as any) || "MOUSE"
  );

  // Keep local accessoryType state in sync if value changes externally (e.g. via AI auto-fill)
  useEffect(() => {
    if (value?.gamingAccessory?.accessoryType) {
      setAccessoryType(value.gamingAccessory.accessoryType as any);
    }
  }, [value?.gamingAccessory?.accessoryType]);

  // Helper to update specific sub-specifications
  const updateConsole = (patch: Partial<ConsoleSpecifications>) => {
    const nextConsole: ConsoleSpecifications = {
      baseModel: "",
      capacity: "",
      format: "",
      controllersIncluded: "",
      bundleIncluded: "",
      ports: "",
      gameCompatibility: "",
      featuredHighlights: "",
      ...(value.console || {}),
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "CONSOLE",
      console: nextConsole,
    });
  };

  const updateMouse = (patch: Partial<MouseSpecifications>) => {
    const currentMouse = value.gamingAccessory?.mouse || {
      brand: "",
      tracking: "",
      buttonCount: "",
      maxDpi: "",
      wiring: "",
      weight: "",
    };
    const nextMouse: MouseSpecifications = {
      ...currentMouse,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "GAMING_ACCESSORY",
      gamingAccessory: {
        ...value.gamingAccessory,
        accessoryType: "MOUSE",
        mouse: nextMouse,
      },
    });
  };

  const updateKeyboard = (patch: Partial<KeyboardSpecifications>) => {
    const currentKeyboard = value.gamingAccessory?.keyboard || {
      brand: "",
      type: "",
      category: "",
    };
    const nextKeyboard: KeyboardSpecifications = {
      ...currentKeyboard,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "GAMING_ACCESSORY",
      gamingAccessory: {
        ...value.gamingAccessory,
        accessoryType: "KEYBOARD",
        keyboard: nextKeyboard,
      },
    });
  };

  const updateHeadset = (patch: Partial<HeadsetSpecifications>) => {
    const currentHeadset = value.gamingAccessory?.headset || {
      type: "",
    };
    const nextHeadset: HeadsetSpecifications = {
      ...currentHeadset,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "GAMING_ACCESSORY",
      gamingAccessory: {
        ...value.gamingAccessory,
        accessoryType: "HEADSET",
        headset: nextHeadset,
      },
    });
  };

  const updateController = (patch: Partial<ControllerSpecifications>) => {
    const currentController = value.gamingAccessory?.controller || {
      brand: "",
      platformCompatibility: "",
      connectionType: "",
    };
    const nextController: ControllerSpecifications = {
      ...currentController,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "GAMING_ACCESSORY",
      gamingAccessory: {
        ...value.gamingAccessory,
        accessoryType: "CONTROLLER",
        controller: nextController,
      },
    });
  };

  const updateApparel = (patch: Partial<ApparelSpecifications>) => {
    onChange({
      ...value,
      categoryType: "APPAREL",
      apparel: {
        ...(value.apparel || {}),
        ...patch,
      },
    });
  };

  const updateBook = (patch: Partial<BookSpecifications>) => {
    onChange({
      ...value,
      categoryType: "BOOK",
      book: {
        ...(value.book || {}),
        ...patch,
      },
    });
  };

  const updateMerch = (patch: Partial<MerchSpecifications>) => {
    onChange({
      ...value,
      categoryType: "MERCH",
      merch: {
        ...(value.merch || {}),
        ...patch,
      },
    });
  };

  const updateAudio = (patch: Partial<AudioSpecifications>) => {
    onChange({
      ...value,
      categoryType: "AUDIO",
      audio: {
        ...(value.audio || {}),
        ...patch,
      },
    });
  };

  const consoleData = value.console || {
    baseModel: "",
    capacity: "",
    format: "",
    controllersIncluded: "",
    bundleIncluded: "",
    ports: "",
    gameCompatibility: "",
    featuredHighlights: "",
  };

  const mouseData = value.gamingAccessory?.mouse || {
    brand: "",
    tracking: "",
    buttonCount: "",
    maxDpi: "",
    wiring: "",
    weight: "",
    dimensions: "",
    adjustableDpi: "",
    color: "",
    pollingRate: "",
    adjustableWeight: "",
    handedness: "",
    technology: "",
    lighting: "",
    powerSource: "",
  };

  const keyboardData = value.gamingAccessory?.keyboard || {
    brand: "",
    partNumber: "",
    type: "",
    category: "",
    backlight: "",
    switchType: "",
    wiring: "",
    connectionTechnology: "",
    macroKeys: "",
    hasWristRest: "",
    hasMediaKeys: "",
  };

  const headsetData = value.gamingAccessory?.headset || {
    type: "",
    microphone: "",
    frequencyResponse: "",
    color: "",
    lighting: "",
    connectivity: "",
    activeNoiseCancelling: "",
    inLineControls: "",
    driverSize: "",
    impedance: "",
    cableLength: "",
  };

  const controllerData = value.gamingAccessory?.controller || {
    brand: "",
    platformCompatibility: "",
    connectionType: "",
    feedbackHaptic: "",
    weight: "",
    color: "",
    layout: "",
    batteryLife: "",
    rechargeableBattery: "",
    programmableBackPaddles: "",
    triggerStops: "",
    audioJack: "",
    hallEffectSticks: "",
    lighting: "",
    softwareCustomization: "",
  };

  const apparelData = value.apparel || {};
  const bookData = value.book || {};
  const merchData = value.merch || {};
  const audioData = value.audio || {};

  return (
    <div className="p-6 rounded-2xl bg-[#092634] border border-[#004E72]/50 space-y-5 shadow-md animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#004E72]/40 pb-4">
        <div>
          <h2 className="text-sm font-bold text-[#F9F9F9] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6E42]"></span>
            6. Ficha de Especificaciones Técnicas Especializadas
          </h2>
          <p className="text-xs text-[#9bb5c2] mt-0.5">
            Personaliza los atributos técnicos detallados para esta categoría en la ficha pública del producto.
          </p>
        </div>

        {/* Template Quick Switcher */}
        <div className="flex flex-wrap gap-1.5 pt-1 sm:pt-0">
          {[
            { id: "CONSOLE", label: "Consolas", icon: Tv },
            { id: "GAMING_ACCESSORY", label: "Accesorio Gaming", icon: Headphones },
            { id: "APPAREL", label: "Ropa & Estilo", icon: Shirt },
            { id: "BOOK", label: "Manga / Libros", icon: BookOpen },
            { id: "MERCH", label: "Merchandising", icon: Gift },
            { id: "AUDIO", label: "Audio / OST", icon: Disc3 },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = activeTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTemplate(t.id);
                  onChange({ ...value, categoryType: t.id });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? "bg-[#FF6E42] text-[#092634] border-[#FF6E42] shadow-sm font-bold"
                    : "bg-[#004E72]/20 text-[#9bb5c2] border-[#004E72]/50 hover:text-white hover:border-[#FF6E42]/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TEMPLATE 1: CONSOLAS / HARDWARE */}
      {activeTemplate === "CONSOLE" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded-xl">
            <Tv className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ficha de Especificaciones para Consolas & Sistemas de Hardware</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9bb5c2]">Modelo Base *</label>
              <input
                type="text"
                value={consoleData.baseModel || ""}
                onChange={(e) => updateConsole({ baseModel: e.target.value })}
                placeholder="ej: PlayStation 5 Slim / Xbox Series X / Nintendo Switch OLED"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9bb5c2]">Capacidad de Almacenamiento *</label>
              <input
                type="text"
                value={consoleData.capacity || ""}
                onChange={(e) => updateConsole({ capacity: e.target.value })}
                placeholder="ej: 1 TB SSD NVMe Ultra-rápido / 64 GB eMMC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9bb5c2]">Formato de la Consola *</label>
              <input
                type="text"
                value={consoleData.format || ""}
                onChange={(e) => updateConsole({ format: e.target.value })}
                placeholder="ej: Sobremesa con Lector de Discos Blu-ray Ultra HD / Híbrida portátil"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9bb5c2]">Controles Incluidos *</label>
              <input
                type="text"
                value={consoleData.controllersIncluded || ""}
                onChange={(e) => updateConsole({ controllersIncluded: e.target.value })}
                placeholder="ej: 1x Control Inalámbrico DualSense Blanco / 2x Joy-Con Neón"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#9bb5c2]">Bundle / Juegos Incluidos</label>
              <input
                type="text"
                value={consoleData.bundleIncluded || ""}
                onChange={(e) => updateConsole({ bundleIncluded: e.target.value })}
                placeholder="ej: Incluye cupón de descarga digital de Marvel's Spider-Man 2 + ASTRO's PLAYROOM preinstalado"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#9bb5c2]">Puertos & Conectividad *</label>
              <input
                type="text"
                value={consoleData.ports || ""}
                onChange={(e) => updateConsole({ ports: e.target.value })}
                placeholder="ej: 1x HDMI 2.1 (4K 120Hz/8K), 2x USB-C frontal, 2x USB-A 3.2 posterior, Ethernet Gigabit, Wi-Fi 6"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#9bb5c2]">Compatibilidad con Juegos *</label>
              <input
                type="text"
                value={consoleData.gameCompatibility || ""}
                onChange={(e) => updateConsole({ gameCompatibility: e.target.value })}
                placeholder="ej: Catálogo completo de PS5 y retrocompatibilidad nativa con más de 4.000 juegos de PS4 con Game Boost"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#9bb5c2]">Características Destacadas *</label>
              <textarea
                rows={2}
                value={consoleData.featuredHighlights || ""}
                onChange={(e) => updateConsole({ featuredHighlights: e.target.value })}
                placeholder="ej: Audio 3D Tempest envolvente, gatillos adaptativos con respuesta háptica, Ray Tracing acelerado por hardware y tiempos de carga instantáneos"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:outline-none focus:border-[#FF6E42]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 2: ACCESORIO GAMING (MOUSE / TECLADO / AUDÍFONOS) */}
      {activeTemplate === "GAMING_ACCESSORY" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Sub-selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#FF6E42]" />
              Tipo de Accesorio Gaming *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "MOUSE", label: "Mouse Gaming", icon: MouseIcon },
                { id: "KEYBOARD", label: "Teclado Gaming", icon: KeyboardIcon },
                { id: "HEADSET", label: "Audífonos / Headset", icon: Headphones },
                { id: "CONTROLLER", label: "Control / Joystick", icon: Gamepad2 },
              ].map((acc) => {
                const Icon = acc.icon;
                const isSelected = accessoryType === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setAccessoryType(acc.id as any);
                      onChange({
                        ...value,
                        categoryType: "GAMING_ACCESSORY",
                        gamingAccessory: {
                          ...value.gamingAccessory,
                          accessoryType: acc.id,
                        },
                      });
                    }}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-2 transition cursor-pointer text-center ${
                      isSelected
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <span className="text-xs font-bold">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUB-SECTION: MOUSE */}
          {accessoryType === "MOUSE" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-2 rounded-xl">
                <MouseIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Especificaciones de Mouse Gamer (Básicos y Avanzados)</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Marca *</label>
                    <input
                      type="text"
                      value={mouseData.brand || ""}
                      onChange={(e) => updateMouse({ brand: e.target.value })}
                      placeholder="ej: Razer / Logitech G / SteelSeries"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tracking (Sensor) *</label>
                    <input
                      type="text"
                      value={mouseData.tracking || ""}
                      onChange={(e) => updateMouse({ tracking: e.target.value })}
                      placeholder="ej: Sensor Óptico Focus Pro 30K / HERO 2"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Cantidad de Botones *</label>
                    <input
                      type="text"
                      value={mouseData.buttonCount || ""}
                      onChange={(e) => updateMouse({ buttonCount: e.target.value })}
                      placeholder="ej: 6 botones programables"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">DPI Máximo *</label>
                    <input
                      type="text"
                      value={mouseData.maxDpi || ""}
                      onChange={(e) => updateMouse({ maxDpi: e.target.value })}
                      placeholder="ej: 30.000 DPI / 25.600 DPI"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Cableado / Conexión *</label>
                    <input
                      type="text"
                      value={mouseData.wiring || ""}
                      onChange={(e) => updateMouse({ wiring: e.target.value })}
                      placeholder="ej: Inalámbrico 2.4GHz + Bluetooth / Cable Speedflex"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Peso *</label>
                    <input
                      type="text"
                      value={mouseData.weight || ""}
                      onChange={(e) => updateMouse({ weight: e.target.value })}
                      placeholder="ej: 63 gramos (Ultraligero)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tamaño / Dimensiones</label>
                    <input
                      type="text"
                      value={mouseData.dimensions || ""}
                      onChange={(e) => updateMouse({ dimensions: e.target.value })}
                      placeholder="ej: 128 x 68 x 44 mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">DPI Ajustable</label>
                    <input
                      type="text"
                      value={mouseData.adjustableDpi || ""}
                      onChange={(e) => updateMouse({ adjustableDpi: e.target.value })}
                      placeholder="ej: Sí, 5 perfiles configurables por botón"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Color</label>
                    <input
                      type="text"
                      value={mouseData.color || ""}
                      onChange={(e) => updateMouse({ color: e.target.value })}
                      placeholder="ej: Negro Mate / Blanco Mercury"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Polling Rate</label>
                    <input
                      type="text"
                      value={mouseData.pollingRate || ""}
                      onChange={(e) => updateMouse({ pollingRate: e.target.value })}
                      placeholder="ej: 1000 Hz / 4000 Hz / 8000 Hz HyperPolling"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Peso Ajustable</label>
                    <input
                      type="text"
                      value={mouseData.adjustableWeight || ""}
                      onChange={(e) => updateMouse({ adjustableWeight: e.target.value })}
                      placeholder="ej: No (Estructura fija ultraligera) / Sí con pesas de 10g"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Lateralidad</label>
                    <input
                      type="text"
                      value={mouseData.handedness || ""}
                      onChange={(e) => updateMouse({ handedness: e.target.value })}
                      placeholder="ej: Diestro Ergonómico / Ambidiestro"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tecnología</label>
                    <input
                      type="text"
                      value={mouseData.technology || ""}
                      onChange={(e) => updateMouse({ technology: e.target.value })}
                      placeholder="ej: Switches Ópticos Gen-3 de 90M de clicks"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Iluminación</label>
                    <input
                      type="text"
                      value={mouseData.lighting || ""}
                      onChange={(e) => updateMouse({ lighting: e.target.value })}
                      placeholder="ej: Razer Chroma RGB 16.8M / Sin RGB para menor peso"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Fuente de Alimentación</label>
                    <input
                      type="text"
                      value={mouseData.powerSource || ""}
                      onChange={(e) => updateMouse({ powerSource: e.target.value })}
                      placeholder="ej: Batería recargable USB-C hasta 90 horas"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION: TECLADO */}
          {accessoryType === "KEYBOARD" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-500/30 px-3 py-2 rounded-xl">
                <KeyboardIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Especificaciones de Teclado Gamer Mecánico / Membrana</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Marca *</label>
                  <input
                    type="text"
                    value={keyboardData.brand || ""}
                    onChange={(e) => updateKeyboard({ brand: e.target.value })}
                    placeholder="ej: Corsair / Keychron / HyperX / Razer"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Part Number / Modelo</label>
                  <input
                    type="text"
                    value={keyboardData.partNumber || ""}
                    onChange={(e) => updateKeyboard({ partNumber: e.target.value })}
                    placeholder="ej: RZ03-04370100-R3U1"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Tipo *</label>
                  <input
                    type="text"
                    value={keyboardData.type || ""}
                    onChange={(e) => updateKeyboard({ type: e.target.value })}
                    placeholder="ej: Mecánico / Mecha-membrana / Magnético HE"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Categoría de Formato *</label>
                  <input
                    type="text"
                    value={keyboardData.category || ""}
                    onChange={(e) => updateKeyboard({ category: e.target.value })}
                    placeholder="ej: TKL 80% / 60% Compacto / Full Size 100%"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Retroiluminación</label>
                  <input
                    type="text"
                    value={keyboardData.backlight || ""}
                    onChange={(e) => updateKeyboard({ backlight: e.target.value })}
                    placeholder="ej: RGB tecla por tecla personalizable"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Tipo de Switch</label>
                  <input
                    type="text"
                    value={keyboardData.switchType || ""}
                    onChange={(e) => updateKeyboard({ switchType: e.target.value })}
                    placeholder="ej: Cherry MX Red Lineal / Razer Green Clicky"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Cableado</label>
                  <input
                    type="text"
                    value={keyboardData.wiring || ""}
                    onChange={(e) => updateKeyboard({ wiring: e.target.value })}
                    placeholder="ej: Cable USB-C a USB-A trenzado desmontable"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">Tecnología de Conexión</label>
                  <input
                    type="text"
                    value={keyboardData.connectionTechnology || ""}
                    onChange={(e) => updateKeyboard({ connectionTechnology: e.target.value })}
                    placeholder="ej: Wireless 2.4GHz + Bluetooth 5.0 + Cable"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]"># Teclas Macro</label>
                  <input
                    type="text"
                    value={keyboardData.macroKeys || ""}
                    onChange={(e) => updateKeyboard({ macroKeys: e.target.value })}
                    placeholder="ej: 6 teclas dedicadas G-Keys / Programables vía software"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#9bb5c2]">¿Apoya Muñecas?</label>
                  <input
                    type="text"
                    value={keyboardData.hasWristRest || ""}
                    onChange={(e) => updateKeyboard({ hasWristRest: e.target.value })}
                    placeholder="ej: Sí, magnético acolchado viscoelástico / No"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#9bb5c2]">¿Teclas Multimedia?</label>
                  <input
                    type="text"
                    value={keyboardData.hasMediaKeys || ""}
                    onChange={(e) => updateKeyboard({ hasMediaKeys: e.target.value })}
                    placeholder="ej: Dial rotatorio de volumen metálico + 4 botones dedicados"
                    className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION: AUDÍFONOS */}
          {accessoryType === "HEADSET" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-2 rounded-xl">
                <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Especificaciones de Audífonos Gamer (Básicos y Secundarios)</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tipo *</label>
                    <input
                      type="text"
                      value={headsetData.type || ""}
                      onChange={(e) => updateHeadset({ type: e.target.value })}
                      placeholder="ej: Over-ear Circumauricular Cerrado / In-ear"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Micrófono *</label>
                    <input
                      type="text"
                      value={headsetData.microphone || ""}
                      onChange={(e) => updateHeadset({ microphone: e.target.value })}
                      placeholder="ej: Desmontable cardioide HyperClear / Retráctil"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Respuesta en Frecuencia *</label>
                    <input
                      type="text"
                      value={headsetData.frequencyResponse || ""}
                      onChange={(e) => updateHeadset({ frequencyResponse: e.target.value })}
                      placeholder="ej: 12 Hz - 28.000 Hz (Hi-Res)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Color</label>
                    <input
                      type="text"
                      value={headsetData.color || ""}
                      onChange={(e) => updateHeadset({ color: e.target.value })}
                      placeholder="ej: Negro mate con toques titanio / Blanco glaciar"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Iluminación</label>
                    <input
                      type="text"
                      value={headsetData.lighting || ""}
                      onChange={(e) => updateHeadset({ lighting: e.target.value })}
                      placeholder="ej: RGB en copas / Sin iluminación para mayor autonomía"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Conectividad *</label>
                    <input
                      type="text"
                      value={headsetData.connectivity || ""}
                      onChange={(e) => updateHeadset({ connectivity: e.target.value })}
                      placeholder="ej: Wireless 2.4GHz de baja latencia + BT 5.3 + Jack 3.5mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Secundarias
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">¿Cancelación Activa de Ruido (ANC)?</label>
                    <input
                      type="text"
                      value={headsetData.activeNoiseCancelling || ""}
                      onChange={(e) => updateHeadset({ activeNoiseCancelling: e.target.value })}
                      placeholder="ej: Sí, ANC híbrido con 4 micrófonos y modo transparencia"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">¿Controles en el Cable / Copa?</label>
                    <input
                      type="text"
                      value={headsetData.inLineControls || ""}
                      onChange={(e) => updateHeadset({ inLineControls: e.target.value })}
                      placeholder="ej: Rueda de volumen, botón mute de micro y balance de chat en copa"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tamaño Driver</label>
                    <input
                      type="text"
                      value={headsetData.driverSize || ""}
                      onChange={(e) => updateHeadset({ driverSize: e.target.value })}
                      placeholder="ej: 50 mm de Titanio TriForce"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Impedancia</label>
                    <input
                      type="text"
                      value={headsetData.impedance || ""}
                      onChange={(e) => updateHeadset({ impedance: e.target.value })}
                      placeholder="ej: 32 Ohms @ 1 kHz"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-[#9bb5c2]">Largo del Cable</label>
                    <input
                      type="text"
                      value={headsetData.cableLength || ""}
                      onChange={(e) => updateHeadset({ cableLength: e.target.value })}
                      placeholder="ej: 1.5 m cable 3.5mm + 1.8 m cable de carga USB-C trenzado"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION: CONTROLLER / GAMEPAD */}
          {accessoryType === "CONTROLLER" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded-xl">
                <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Especificaciones de Control / Gamepad (Básicos y Avanzados)</span>
              </div>

              {/* Especificaciones Básicas */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Marca *</label>
                    <input
                      type="text"
                      value={controllerData.brand || ""}
                      onChange={(e) => updateController({ brand: e.target.value })}
                      placeholder="ej: Sony PlayStation / Xbox / Nintendo / Razer / 8BitDo"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Compatibilidad de Plataforma *</label>
                    <input
                      type="text"
                      value={controllerData.platformCompatibility || ""}
                      onChange={(e) => updateController({ platformCompatibility: e.target.value })}
                      placeholder="ej: PS5, PS4, PC Windows, Mac, iOS, Android"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tipo de Conexión *</label>
                    <input
                      type="text"
                      value={controllerData.connectionType || ""}
                      onChange={(e) => updateController({ connectionType: e.target.value })}
                      placeholder="ej: Inalámbrico Bluetooth + Cable USB-C de baja latencia"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Respuesta Háptica / Vibración *</label>
                    <input
                      type="text"
                      value={controllerData.feedbackHaptic || ""}
                      onChange={(e) => updateController({ feedbackHaptic: e.target.value })}
                      placeholder="ej: Respuesta háptica inmersiva de doble motor y gatillos adaptativos"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Peso *</label>
                    <input
                      type="text"
                      value={controllerData.weight || ""}
                      onChange={(e) => updateController({ weight: e.target.value })}
                      placeholder="ej: 280 gramos (Ergonómico balanceado)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Color / Edición</label>
                    <input
                      type="text"
                      value={controllerData.color || ""}
                      onChange={(e) => updateController({ color: e.target.value })}
                      placeholder="ej: Blanco Clásico / Midnight Black / Edición Limitada"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Distribución / Layout de Botones</label>
                    <input
                      type="text"
                      value={controllerData.layout || ""}
                      onChange={(e) => updateController({ layout: e.target.value })}
                      placeholder="ej: Asimétrico Xbox Style / Simétrico PlayStation Style (D-Pad + 4 botones de acción + 2 bumpers + 2 triggers)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Especificaciones Avanzadas */}
              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Autonomía de Batería</label>
                    <input
                      type="text"
                      value={controllerData.batteryLife || ""}
                      onChange={(e) => updateController({ batteryLife: e.target.value })}
                      placeholder="ej: Hasta 12 a 15 horas de uso continuo"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tipo de Batería</label>
                    <input
                      type="text"
                      value={controllerData.rechargeableBattery || ""}
                      onChange={(e) => updateController({ rechargeableBattery: e.target.value })}
                      placeholder="ej: Batería interna recargable de 1560 mAh Li-ion"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Palancas / Botones Traseros (Paddles)</label>
                    <input
                      type="text"
                      value={controllerData.programmableBackPaddles || ""}
                      onChange={(e) => updateController({ programmableBackPaddles: e.target.value })}
                      placeholder="ej: 2 o 4 botones traseros remapeables"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Bloqueo de Gatillos (Trigger Stops)</label>
                    <input
                      type="text"
                      value={controllerData.triggerStops || ""}
                      onChange={(e) => updateController({ triggerStops: e.target.value })}
                      placeholder="ej: Sí, topes ajustables de 3 posiciones para disparo rápido"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Puerto de Audio / Jack 3.5mm</label>
                    <input
                      type="text"
                      value={controllerData.audioJack || ""}
                      onChange={(e) => updateController({ audioJack: e.target.value })}
                      placeholder="ej: Conector de audio de 3.5 mm para audífonos y micrófono"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Joysticks Magnéticos / Efecto Hall</label>
                    <input
                      type="text"
                      value={controllerData.hallEffectSticks || ""}
                      onChange={(e) => updateController({ hallEffectSticks: e.target.value })}
                      placeholder="ej: Joysticks con tecnología Hall Effect (anti-drift)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Iluminación / Barra de Luz</label>
                    <input
                      type="text"
                      value={controllerData.lighting || ""}
                      onChange={(e) => updateController({ lighting: e.target.value })}
                      placeholder="ej: Barra luminosa interactiva integrada + RGB"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-[#9bb5c2]">Software de Personalización</label>
                    <input
                      type="text"
                      value={controllerData.softwareCustomization || ""}
                      onChange={(e) => updateController({ softwareCustomization: e.target.value })}
                      placeholder="ej: Configuración de perfiles, zonas muertas y sensibilidad de palancas vía app oficial"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEMPLATE 3: ROPA & ESTILO */}
      {activeTemplate === "APPAREL" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-400 bg-pink-950/30 border border-pink-500/30 px-3 py-2 rounded-xl">
            <Shirt className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Ficha de Especificaciones para Ropa, Vestimenta & Streetwear Gamer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Talla</label>
              <input
                type="text"
                value={apparelData.size || ""}
                onChange={(e) => updateApparel({ size: e.target.value })}
                placeholder="ej: S / M / L / XL / XXL / Oversize"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Género / Corte</label>
              <input
                type="text"
                value={apparelData.gender || ""}
                onChange={(e) => updateApparel({ gender: e.target.value })}
                placeholder="ej: Unisex / Regular Fit / Oversized Harajuku"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Tipo de Prenda</label>
              <input
                type="text"
                value={apparelData.apparelType || ""}
                onChange={(e) => updateApparel({ apparelType: e.target.value })}
                placeholder="ej: Polerón Hoodie con Capucha / Polera 100% Algodón"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-[#9bb5c2]">Material Textil</label>
              <input
                type="text"
                value={apparelData.material || ""}
                onChange={(e) => updateApparel({ material: e.target.value })}
                placeholder="ej: 100% Algodón Peinado de 280 gsm con costuras reforzadas"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Licencia Oficial</label>
              <input
                type="text"
                value={apparelData.license || ""}
                onChange={(e) => updateApparel({ license: e.target.value })}
                placeholder="ej: Licencia Oficial Toei Animation / Crunchyroll"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs text-[#9bb5c2]">Instrucciones de Cuidado / Lavado</label>
              <input
                type="text"
                value={apparelData.careInstructions || ""}
                onChange={(e) => updateApparel({ careInstructions: e.target.value })}
                placeholder="ej: Lavar con agua fría del revés, secar a la sombra, no planchar sobre el estampado"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 4: MANGA / ARTBOOK */}
      {activeTemplate === "BOOK" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-950/30 border border-orange-500/30 px-3 py-2 rounded-xl">
            <BookOpen className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Ficha de Especificaciones para Manga, Artbooks & Cómics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Editorial</label>
              <input
                type="text"
                value={bookData.publisher || ""}
                onChange={(e) => updateBook({ publisher: e.target.value })}
                placeholder="ej: Ivrea / Panini Manga / Norma Editorial / VIZ"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Idioma</label>
              <input
                type="text"
                value={bookData.language || ""}
                onChange={(e) => updateBook({ language: e.target.value })}
                placeholder="ej: Español Neutro / Japonés Original / Inglés"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">N° de Páginas</label>
              <input
                type="text"
                value={bookData.pages || ""}
                onChange={(e) => updateBook({ pages: e.target.value })}
                placeholder="ej: 192 páginas b/n + 4 a color"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Encuadernación</label>
              <input
                type="text"
                value={bookData.binding || ""}
                onChange={(e) => updateBook({ binding: e.target.value })}
                placeholder="ej: Rústica con Sobrecubierta (Tankōbon) / Tapa Dura"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Dimensiones</label>
              <input
                type="text"
                value={bookData.dimensions || ""}
                onChange={(e) => updateBook({ dimensions: e.target.value })}
                placeholder="ej: 11.5 x 17 cm (Formato estándar japonés)"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">ISBN / Código</label>
              <input
                type="text"
                value={bookData.isbn || ""}
                onChange={(e) => updateBook({ isbn: e.target.value })}
                placeholder="ej: 978-4-08-882000-0"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 5: MERCHANDISING */}
      {activeTemplate === "MERCH" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 bg-yellow-950/30 border border-yellow-500/30 px-3 py-2 rounded-xl">
            <Gift className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>Ficha de Especificaciones para Merchandising, Llaveros, Peluches & Decoración</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Tipo de Artículo</label>
              <input
                type="text"
                value={merchData.itemType || ""}
                onChange={(e) => updateMerch({ itemType: e.target.value })}
                placeholder="ej: Peluche Plushie / Llavero Acrílico con Purpurina / Lámpara 3D"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Material de Fabricación</label>
              <input
                type="text"
                value={merchData.material || ""}
                onChange={(e) => updateMerch({ material: e.target.value })}
                placeholder="ej: Felpa suave de poliéster hipoalergénico / Acrílico 4mm"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Dimensiones</label>
              <input
                type="text"
                value={merchData.dimensions || ""}
                onChange={(e) => updateMerch({ dimensions: e.target.value })}
                placeholder="ej: 22 cm de alto x 15 cm ancho"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Franquicia / Licencia</label>
              <input
                type="text"
                value={merchData.franchise || ""}
                onChange={(e) => updateMerch({ franchise: e.target.value })}
                placeholder="ej: Pokémon Center Japón / Genshin Impact Oficial"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 6: AUDIO / OST */}
      {activeTemplate === "AUDIO" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-950/30 border border-purple-500/30 px-3 py-2 rounded-xl">
            <Disc3 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Ficha de Especificaciones para Bandas Sonoras (OST), Vinilos & Audio Coleccionista</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Formato de Audio</label>
              <input
                type="text"
                value={audioData.format || ""}
                onChange={(e) => updateAudio({ format: e.target.value })}
                placeholder="ej: 2x Vinilo LP 180g Color Splatter / CD Boxset"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">N° de Discos / Pistas</label>
              <input
                type="text"
                value={audioData.discCount || ""}
                onChange={(e) => updateAudio({ discCount: e.target.value })}
                placeholder="ej: 2 Discos (34 temas orquestados)"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">Sello Discográfico</label>
              <input
                type="text"
                value={audioData.recordLabel || ""}
                onChange={(e) => updateAudio({ recordLabel: e.target.value })}
                placeholder="ej: Square Enix Music / Milan Records / Laced Records"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9bb5c2]">¿Incluye Artbook / Booklet?</label>
              <input
                type="text"
                value={audioData.includesArtbook || ""}
                onChange={(e) => updateAudio({ includesArtbook: e.target.value })}
                placeholder="ej: Sí, librillo a todo color de 24 páginas con entrevistas"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-[#9bb5c2]">Pistas Destacadas / Compositor</label>
              <input
                type="text"
                value={audioData.featuredTracks || ""}
                onChange={(e) => updateAudio({ featuredTracks: e.target.value })}
                placeholder="ej: Compositor Nobuo Uematsu • Incluye 'One-Winged Angel' y 'Aerith's Theme'"
                className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
