"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Tv,
  Cpu,
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
  HardDrive,
  CircuitBoard,
  MemoryStick,
  Zap,
  Fan,
  Box,
  Wind,
} from "lucide-react";
import {
  CustomCategorySpecifications,
  ConsoleSpecifications,
  HardwareSpecifications,
  HardwareSubtype,
  GpuSpecifications,
  CpuSpecifications,
  MotherboardSpecifications,
  RamSpecifications,
  HddSpecifications,
  SsdSpecifications,
  PowerSupplySpecifications,
  CoolerCpuSpecifications,
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
    if (l.includes("consola")) return "CONSOLE";
    if (l.includes("hardware") || l.includes("componente") || l.includes("ssd") || l.includes("ram") || l.includes("gpu") || l.includes("tarjeta gr") || l.includes("procesador")) return "HARDWARE";
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

  // Hardware Subtype: TARJETA_DE_VIDEO | PROCESADORES | PLACA_MADRE | RAM | DISCO_DURO | SSD | GABINETE | FUENTE_DE_PODER | COOLER_CPU | VENTILADORES
  const [hardwareType, setHardwareType] = useState<HardwareSubtype>(
    () => (value?.hardware?.hardwareType as any) || "TARJETA_DE_VIDEO"
  );

  // Keep local accessoryType & hardwareType state in sync if value changes externally (e.g. via AI auto-fill)
  useEffect(() => {
    if (value?.gamingAccessory?.accessoryType) {
      setAccessoryType(value.gamingAccessory.accessoryType as any);
    }
  }, [value?.gamingAccessory?.accessoryType]);

  useEffect(() => {
    if (value?.hardware?.hardwareType) {
      setHardwareType(value.hardware.hardwareType as any);
    }
  }, [value?.hardware?.hardwareType]);

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

  const updateHardware = (patch: Partial<HardwareSpecifications>) => {
    const nextHardware: HardwareSpecifications = {
      hardwareType: hardwareType,
      componentType: "",
      brand: "",
      model: "",
      interfaceOrSocket: "",
      capacityOrSpeed: "",
      formFactor: "",
      powerConsumptionTdp: "",
      warrantyYears: "",
      featuredHighlights: "",
      ...(value.hardware || {}),
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: nextHardware,
    });
  };

  const updateGpu = (patch: Partial<GpuSpecifications>) => {
    const currentGpu = value.hardware?.gpu || {
      manufacturer: "",
      gpu: "",
      memory: "",
      bus: "",
      coreClocks: "",
      memoryClock: "",
    };
    const nextGpu: GpuSpecifications = {
      ...currentGpu,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "TARJETA_DE_VIDEO",
        gpu: nextGpu,
      },
    });
  };

  const updateCpu = (patch: Partial<CpuSpecifications>) => {
    const currentCpu = value.hardware?.cpu || {
      frequency: "",
      turboFrequency: "",
      coresThreads: "",
      cache: "",
      socket: "",
    };
    const nextCpu: CpuSpecifications = {
      ...currentCpu,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "PROCESADORES",
        cpu: nextCpu,
      },
    });
  };

  const updateMotherboard = (patch: Partial<MotherboardSpecifications>) => {
    const currentMb = value.hardware?.motherboard || {
      manufacturer: "",
      socket: "",
      chipset: "",
      memorySlots: "",
      memoryChannels: "",
      format: "",
    };
    const nextMb: MotherboardSpecifications = {
      ...currentMb,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "PLACA_MADRE",
        motherboard: nextMb,
      },
    });
  };

  const updateRam = (patch: Partial<RamSpecifications>) => {
    const currentRam = value.hardware?.ram || {
      capacity: "",
      type: "",
      speed: "",
      format: "",
    };
    const nextRam: RamSpecifications = {
      ...currentRam,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "RAM",
        ram: nextRam,
      },
    });
  };

  const updateHdd = (patch: Partial<HddSpecifications>) => {
    const currentHdd = value.hardware?.hdd || {
      type: "",
      line: "",
      capacity: "",
      rpm: "",
      size: "",
      bus: "",
      buffer: "",
    };
    const nextHdd: HddSpecifications = {
      ...currentHdd,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "DISCO_DURO",
        hdd: nextHdd,
      },
    });
  };

  const updateSsd = (patch: Partial<SsdSpecifications>) => {
    const currentSsd = value.hardware?.ssd || {
      line: "",
      capacity: "",
      format: "",
      bus: "",
      hasDram: "",
      nandType: "",
      controller: "",
      sequentialRead: "",
      sequentialWrite: "",
    };
    const nextSsd: SsdSpecifications = {
      ...currentSsd,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "SSD",
        ssd: nextSsd,
      },
    });
  };

  const updatePowerSupply = (patch: Partial<PowerSupplySpecifications>) => {
    const currentPsu = value.hardware?.powerSupply || {
      power: "",
      certification: "",
      size: "",
      activePfc: "",
      modular: "",
    };
    const nextPsu: PowerSupplySpecifications = {
      ...currentPsu,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "FUENTE_DE_PODER",
        powerSupply: nextPsu,
      },
    });
  };

  const updateCoolerCpu = (patch: Partial<CoolerCpuSpecifications>) => {
    const currentCooler = value.hardware?.coolerCpu || {
      brand: "",
      type: "",
      weight: "",
      rpm: "",
      noise: "",
      airflow: "",
      height: "",
      fanSize: "",
      hasHeatpipes: "",
      compatibleSockets: "",
    };
    const nextCooler: CoolerCpuSpecifications = {
      ...currentCooler,
      ...patch,
    };
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "COOLER_CPU",
        coolerCpu: nextCooler,
      },
    });
  };

  const updateCabinet = (patch: any) => {
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "GABINETE",
        cabinet: {
          ...(value.hardware?.cabinet || {}),
          ...patch,
        },
      },
    });
  };

  const updateFan = (patch: any) => {
    onChange({
      ...value,
      categoryType: "HARDWARE",
      hardware: {
        ...value.hardware,
        hardwareType: "VENTILADORES",
        fan: {
          ...(value.hardware?.fan || {}),
          ...patch,
        },
      },
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

  const hardwareData = value.hardware || {
    componentType: "",
    brand: "",
    model: "",
    interfaceOrSocket: "",
    capacityOrSpeed: "",
    formFactor: "",
    powerConsumptionTdp: "",
    warrantyYears: "",
    featuredHighlights: "",
  };

  const rawGpu: any = value.hardware?.gpu || {};
  const gpuData: GpuSpecifications = {
    manufacturer: rawGpu.manufacturer || "",
    gpu: rawGpu.gpu || "",
    memory: rawGpu.memory || "",
    bus: rawGpu.bus || "",
    coreClocks: rawGpu.coreClocks || rawGpu.coreFrequencies || "",
    memoryClock: rawGpu.memoryClock || rawGpu.memoryFrequency || "",
    coreName: rawGpu.coreName || rawGpu.core || "",
    profile: rawGpu.profile || "",
    cooling: rawGpu.cooling || "",
    slots: rawGpu.slots || "",
    length: rawGpu.length || "",
    lighting: rawGpu.lighting || "",
    hasBackplate: rawGpu.hasBackplate || rawGpu.backplate || "",
    powerConnectors: rawGpu.powerConnectors || "",
    videoPorts: rawGpu.videoPorts || "",
  };

  const rawCpu: any = value.hardware?.cpu || {};
  const cpuData: CpuSpecifications = {
    frequency: rawCpu.frequency || "",
    turboFrequency: rawCpu.turboFrequency || "",
    coresThreads: rawCpu.coresThreads || "",
    cache: rawCpu.cache || "",
    socket: rawCpu.socket || "",
    coreName: rawCpu.coreName || rawCpu.core || "",
    manufacturingProcess: rawCpu.manufacturingProcess || "",
    tdp: rawCpu.tdp || "",
    cooler: rawCpu.cooler || "",
    integratedGraphics: rawCpu.integratedGraphics || "",
  };

  const motherboardData: MotherboardSpecifications = value.hardware?.motherboard || {
    manufacturer: "",
    socket: "",
    chipset: "",
    memorySlots: "",
    memoryChannels: "",
    format: "",
    rgbSupport: "",
    videoPorts: "",
    powerPorts: "",
    sliSupport: "",
    crossfireSupport: "",
    raidSupport: "",
    connectors: "",
    ports: "",
    expansions: "",
  };

  const rawRam: any = value.hardware?.ram || {};
  const ramData: RamSpecifications = {
    capacity: rawRam.capacity || "",
    type: rawRam.type || "",
    speed: rawRam.speed || "",
    format: rawRam.format || "",
    voltage: rawRam.voltage || "",
    latencyClCas: rawRam.latencyClCas || rawRam.casLatency || "",
    latencyTrcd: rawRam.latencyTrcd || rawRam.trcdLatency || "",
    latencyTrp: rawRam.latencyTrp || rawRam.trpLatency || "",
    latencyTras: rawRam.latencyTras || rawRam.trasLatency || "",
    eccSupport: rawRam.eccSupport || "",
    fullBufferedSupport: rawRam.fullBufferedSupport || "",
  };

  const hddData: HddSpecifications = value.hardware?.hdd || {
    type: "",
    line: "",
    capacity: "",
    rpm: "",
    size: "",
    bus: "",
    buffer: "",
  };

  const ssdData: SsdSpecifications = value.hardware?.ssd || {
    line: "",
    capacity: "",
    format: "",
    bus: "",
    hasDram: "",
    nandType: "",
    controller: "",
    sequentialRead: "",
    sequentialWrite: "",
  };

  const rawPsu: any = value.hardware?.powerSupply || {};
  const psuData: PowerSupplySpecifications = {
    power: rawPsu.power || "",
    certification: rawPsu.certification || "",
    size: rawPsu.size || "",
    activePfc: rawPsu.activePfc || "",
    modular: rawPsu.modular || "",
    rail12vCurrent: rawPsu.rail12vCurrent || rawPsu.current12v || "",
    rail5vCurrent: rawPsu.rail5vCurrent || rawPsu.current5v || "",
    rail33vCurrent: rawPsu.rail33vCurrent || rawPsu.current3v || "",
    powerConnectors: rawPsu.powerConnectors || "",
  };

  const rawCooler: any = value.hardware?.coolerCpu || {};
  const coolerData: CoolerCpuSpecifications = {
    brand: rawCooler.brand || "",
    type: rawCooler.type || "",
    weight: rawCooler.weight || "",
    rpm: rawCooler.rpm || "",
    noise: rawCooler.noise || "",
    airflow: rawCooler.airflow || "",
    height: rawCooler.height || "",
    fanSize: rawCooler.fanSize || "",
    hasHeatpipes: rawCooler.hasHeatpipes || "",
    compatibleSockets: rawCooler.compatibleSockets || "",
  };

  const rawCabinet: any = value.hardware?.cabinet || {};
  const cabinetData: any = {
    format: rawCabinet.format || "",
    motherboardSupport: rawCabinet.motherboardSupport || "E-ATX, ATX, Micro-ATX, Mini-ITX",
    sidePanel: rawCabinet.sidePanel || "",
    gpuMaxDimensions: rawCabinet.gpuMaxDimensions || rawCabinet.maxGpuLength || "",
    cpuCoolerMaxHeight: rawCabinet.cpuCoolerMaxHeight || rawCabinet.maxCoolerHeight || "",
  };

  const rawFan: any = value.hardware?.fan || {};
  const fanData: any = {
    brand: rawFan.brand || "",
    size: rawFan.size || "",
    rpm: rawFan.rpm || "",
    noise: rawFan.noise || rawFan.noiseLevel || "",
    airflow: rawFan.airflow || "",
    bearingType: rawFan.bearingType || rawFan.bearing || "",
    lighting: rawFan.lighting || "",
    connector: rawFan.connector || rawFan.connectorPins || "",
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
            { id: "HARDWARE", label: "Hardware", icon: Cpu },
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

      {/* TEMPLATE 1: CONSOLAS */}
      {activeTemplate === "CONSOLE" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded-xl">
            <Tv className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Ficha de Especificaciones Técnicas para Consolas de Videojuegos</span>
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

      {/* TEMPLATE: HARDWARE & COMPONENTES */}
      {/* TEMPLATE: HARDWARE & COMPONENTES */}
      {activeTemplate === "HARDWARE" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Sub-selector: Tipo de Hardware */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#F9F9F9] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#FF6E42]" />
              Tipo de Hardware *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { id: "TARJETA_DE_VIDEO", label: "Tarjeta de Video", icon: Cpu },
                { id: "PROCESADORES", label: "Procesadores", icon: Zap },
                { id: "PLACA_MADRE", label: "Placa Madre", icon: CircuitBoard },
                { id: "RAM", label: "Ram", icon: MemoryStick },
                { id: "DISCO_DURO", label: "Disco Duro", icon: HardDrive },
                { id: "SSD", label: "SSD", icon: HardDrive },
                { id: "GABINETE", label: "Gabinete", icon: Box },
                { id: "FUENTE_DE_PODER", label: "Fuente de Poder", icon: Zap },
                { id: "COOLER_CPU", label: "Cooler CPU", icon: Wind },
                { id: "VENTILADORES", label: "Ventiladores", icon: Fan },
              ].map((hw) => {
                const Icon = hw.icon;
                const isSelected = hardwareType === hw.id;
                return (
                  <button
                    key={hw.id}
                    type="button"
                    onClick={() => {
                      setHardwareType(hw.id as any);
                      onChange({
                        ...value,
                        categoryType: "HARDWARE",
                        hardware: {
                          ...value.hardware,
                          hardwareType: hw.id,
                        },
                      });
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center ${
                      isSelected
                        ? "bg-[#004E72] border-[#FF6E42] text-[#F9F9F9] shadow-md ring-1 ring-[#FF6E42]"
                        : "bg-[#004E72]/15 border-[#004E72]/40 text-[#9bb5c2] hover:bg-[#004E72]/30 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-[#FF6E42]" : "text-[#9bb5c2]"}`} />
                    <span className="text-[11px] font-bold leading-tight">{hw.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. TARJETA DE VIDEO */}
          {hardwareType === "TARJETA_DE_VIDEO" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-2 rounded-xl">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Especificaciones de Tarjeta de Video (Básicas y Avanzadas)</span>
              </div>

              {/* Básicas */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Fabricante *</label>
                    <input
                      type="text"
                      value={gpuData.manufacturer || ""}
                      onChange={(e) => updateGpu({ manufacturer: e.target.value })}
                      placeholder="ej: ASUS / MSI / Gigabyte / EVGA / Zotac"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">GPU *</label>
                    <input
                      type="text"
                      value={gpuData.gpu || ""}
                      onChange={(e) => updateGpu({ gpu: e.target.value })}
                      placeholder="ej: NVIDIA GeForce RTX 5070 / AMD Radeon RX 7800 XT"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Memoria *</label>
                    <input
                      type="text"
                      value={gpuData.memory || ""}
                      onChange={(e) => updateGpu({ memory: e.target.value })}
                      placeholder="ej: 12 GB GDDR6 / 16 GB GDDR6X"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Bus *</label>
                    <input
                      type="text"
                      value={gpuData.bus || ""}
                      onChange={(e) => updateGpu({ bus: e.target.value })}
                      placeholder="ej: 192-bit / 256-bit"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Frecuencias core (base / boost / OC) *</label>
                    <input
                      type="text"
                      value={gpuData.coreClocks || ""}
                      onChange={(e) => updateGpu({ coreClocks: e.target.value })}
                      placeholder="ej: Base: 2160 MHz / Boost: 2550 MHz / OC: 2610 MHz"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Frecuencia memorias *</label>
                    <input
                      type="text"
                      value={gpuData.memoryClock || ""}
                      onChange={(e) => updateGpu({ memoryClock: e.target.value })}
                      placeholder="ej: 21 Gbps (2625 MHz)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avanzadas */}
              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Núcleo</label>
                    <input
                      type="text"
                      value={gpuData.coreName || ""}
                      onChange={(e) => updateGpu({ coreName: e.target.value })}
                      placeholder="ej: GB205 / AD104"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Perfil</label>
                    <input
                      type="text"
                      value={gpuData.profile || ""}
                      onChange={(e) => updateGpu({ profile: e.target.value })}
                      placeholder="ej: Estándar ATX / Low Profile"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Refrigeración</label>
                    <input
                      type="text"
                      value={gpuData.cooling || ""}
                      onChange={(e) => updateGpu({ cooling: e.target.value })}
                      placeholder="ej: Dual Fan / Triple Fan / Torx Fan 5.0"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Slots</label>
                    <input
                      type="text"
                      value={gpuData.slots || ""}
                      onChange={(e) => updateGpu({ slots: e.target.value })}
                      placeholder="ej: 2 Slots / 2.5 Slots / 3 Slots"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Largo</label>
                    <input
                      type="text"
                      value={gpuData.length || ""}
                      onChange={(e) => updateGpu({ length: e.target.value })}
                      placeholder="ej: 242 mm / 300 mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Iluminación</label>
                    <input
                      type="text"
                      value={gpuData.lighting || ""}
                      onChange={(e) => updateGpu({ lighting: e.target.value })}
                      placeholder="ej: ARGB Mystic Light / Sin LED"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">¿Backplate?</label>
                    <input
                      type="text"
                      value={gpuData.hasBackplate || ""}
                      onChange={(e) => updateGpu({ hasBackplate: e.target.value })}
                      placeholder="ej: Sí, metálico reforzado con ventilación de flujo"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Conectores de poder</label>
                    <input
                      type="text"
                      value={gpuData.powerConnectors || ""}
                      onChange={(e) => updateGpu({ powerConnectors: e.target.value })}
                      placeholder="ej: 1x 16-pin 12V-2x6 / 2x 8-pin PCIe"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Puertos de video</label>
                    <input
                      type="text"
                      value={gpuData.videoPorts || ""}
                      onChange={(e) => updateGpu({ videoPorts: e.target.value })}
                      placeholder="ej: 3x DisplayPort 1.4a, 1x HDMI 2.1a"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PROCESADORES */}
          {hardwareType === "PROCESADORES" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded-xl">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Especificaciones de Procesadores (Básicas y Avanzadas)</span>
              </div>

              {/* Básicas */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Frecuencia *</label>
                    <input
                      type="text"
                      value={cpuData.frequency || ""}
                      onChange={(e) => updateCpu({ frequency: e.target.value })}
                      placeholder="ej: 3.8 GHz / 4.2 GHz"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Frecuencia turbo máxima *</label>
                    <input
                      type="text"
                      value={cpuData.turboFrequency || ""}
                      onChange={(e) => updateCpu({ turboFrequency: e.target.value })}
                      placeholder="ej: 5.4 GHz / 5.7 GHz"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Núcleos / hilos *</label>
                    <input
                      type="text"
                      value={cpuData.coresThreads || ""}
                      onChange={(e) => updateCpu({ coresThreads: e.target.value })}
                      placeholder="ej: 8 núcleos / 16 hilos"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Caché *</label>
                    <input
                      type="text"
                      value={cpuData.cache || ""}
                      onChange={(e) => updateCpu({ cache: e.target.value })}
                      placeholder="ej: 32 MB L3 + 8 MB L2 (Total 40 MB)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-[#9bb5c2]">Socket *</label>
                    <input
                      type="text"
                      value={cpuData.socket || ""}
                      onChange={(e) => updateCpu({ socket: e.target.value })}
                      placeholder="ej: Socket AM5 / LGA1700 / LGA1851"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avanzadas */}
              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Núcleo</label>
                    <input
                      type="text"
                      value={cpuData.coreName || ""}
                      onChange={(e) => updateCpu({ coreName: e.target.value })}
                      placeholder="ej: Zen 4 / Raptor Lake Refresh"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Proceso de manufactura</label>
                    <input
                      type="text"
                      value={cpuData.manufacturingProcess || ""}
                      onChange={(e) => updateCpu({ manufacturingProcess: e.target.value })}
                      placeholder="ej: 5 nm TSMC FinFET / Intel 7"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">TDP</label>
                    <input
                      type="text"
                      value={cpuData.tdp || ""}
                      onChange={(e) => updateCpu({ tdp: e.target.value })}
                      placeholder="ej: 65 W / 105 W / 125 W"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Cooler</label>
                    <input
                      type="text"
                      value={cpuData.cooler || ""}
                      onChange={(e) => updateCpu({ cooler: e.target.value })}
                      placeholder="ej: Incluido Wraith Stealth / No incluido"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-[#9bb5c2]">Gráficos integrados</label>
                    <input
                      type="text"
                      value={cpuData.integratedGraphics || ""}
                      onChange={(e) => updateCpu({ integratedGraphics: e.target.value })}
                      placeholder="ej: AMD Radeon Graphics (2 CUs) / Intel UHD Graphics 770 / No posee"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. PLACA MADRE */}
          {hardwareType === "PLACA_MADRE" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-500/30 px-3 py-2 rounded-xl">
                <CircuitBoard className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Especificaciones de Placa Madre (Básicas y Avanzadas)</span>
              </div>

              {/* Básicas */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Fabricante *</label>
                    <input
                      type="text"
                      value={motherboardData.manufacturer || ""}
                      onChange={(e) => updateMotherboard({ manufacturer: e.target.value })}
                      placeholder="ej: ASUS ROG / MSI / Gigabyte AORUS / ASRock"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Socket *</label>
                    <input
                      type="text"
                      value={motherboardData.socket || ""}
                      onChange={(e) => updateMotherboard({ socket: e.target.value })}
                      placeholder="ej: Socket AM5 / LGA1700 / LGA1851"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Chipset *</label>
                    <input
                      type="text"
                      value={motherboardData.chipset || ""}
                      onChange={(e) => updateMotherboard({ chipset: e.target.value })}
                      placeholder="ej: AMD B650 / AMD X670E / Intel Z790 / B760"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Slots memorias *</label>
                    <input
                      type="text"
                      value={motherboardData.memorySlots || ""}
                      onChange={(e) => updateMotherboard({ memorySlots: e.target.value })}
                      placeholder="ej: 4x DDR5 DIMM (hasta 192 GB)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Canales memoria *</label>
                    <input
                      type="text"
                      value={motherboardData.memoryChannels || ""}
                      onChange={(e) => updateMotherboard({ memoryChannels: e.target.value })}
                      placeholder="ej: Dual Channel"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Formato *</label>
                    <input
                      type="text"
                      value={motherboardData.format || ""}
                      onChange={(e) => updateMotherboard({ format: e.target.value })}
                      placeholder="ej: ATX (30.5 x 24.4 cm) / Micro-ATX / Mini-ITX"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Soporte RGB</label>
                    <input
                      type="text"
                      value={motherboardData.rgbSupport || ""}
                      onChange={(e) => updateMotherboard({ rgbSupport: e.target.value })}
                      placeholder="ej: 3x 3-pin ARGB Gen 2 + 1x 4-pin RGB"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Puertos de video</label>
                    <input
                      type="text"
                      value={motherboardData.videoPorts || ""}
                      onChange={(e) => updateMotherboard({ videoPorts: e.target.value })}
                      placeholder="ej: 1x HDMI 2.1 (4K 60Hz), 1x DisplayPort 1.4"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Puertos de energía</label>
                    <input
                      type="text"
                      value={motherboardData.powerPorts || ""}
                      onChange={(e) => updateMotherboard({ powerPorts: e.target.value })}
                      placeholder="ej: 1x 24-pin ATX, 2x 8-pin EPS 12V"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avanzadas */}
              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Soporte SLI</label>
                    <input
                      type="text"
                      value={motherboardData.sliSupport || ""}
                      onChange={(e) => updateMotherboard({ sliSupport: e.target.value })}
                      placeholder="ej: No compatible"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Soporte CrossFire</label>
                    <input
                      type="text"
                      value={motherboardData.crossfireSupport || ""}
                      onChange={(e) => updateMotherboard({ crossfireSupport: e.target.value })}
                      placeholder="ej: Compatible con AMD 2-Way CrossFireX"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Soporte RAID</label>
                    <input
                      type="text"
                      value={motherboardData.raidSupport || ""}
                      onChange={(e) => updateMotherboard({ raidSupport: e.target.value })}
                      placeholder="ej: RAID 0, 1, 10 para unidades SATA y M.2 NVMe"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Conectores</label>
                    <input
                      type="text"
                      value={motherboardData.connectors || ""}
                      onChange={(e) => updateMotherboard({ connectors: e.target.value })}
                      placeholder="ej: 4x SATA 6Gb/s, 3x M.2 (1x PCIe 5.0 x4 + 2x PCIe 4.0 x4), 1x Header USB-C frontal"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Puertos</label>
                    <input
                      type="text"
                      value={motherboardData.ports || ""}
                      onChange={(e) => updateMotherboard({ ports: e.target.value })}
                      placeholder="ej: 1x USB 3.2 Gen 2x2 Type-C (20Gbps), 3x USB 3.2 Gen 2, 4x USB 2.0, 2.5G LAN, Wi-Fi 6E"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Expansiones</label>
                    <input
                      type="text"
                      value={motherboardData.expansions || ""}
                      onChange={(e) => updateMotherboard({ expansions: e.target.value })}
                      placeholder="ej: 1x PCIe 5.0 x16 (SafeSlot), 1x PCIe 4.0 x16 (soporta x4), 2x PCIe 4.0 x1"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. RAM */}
          {hardwareType === "RAM" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-2 rounded-xl">
                <MemoryStick className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Especificaciones de Memoria RAM (Básicas y Avanzadas)</span>
              </div>

              {/* Básicas */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Capacidad *</label>
                    <input
                      type="text"
                      value={ramData.capacity || ""}
                      onChange={(e) => updateRam({ capacity: e.target.value })}
                      placeholder="ej: 32 GB (2x 16 GB Kit)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tipo *</label>
                    <input
                      type="text"
                      value={ramData.type || ""}
                      onChange={(e) => updateRam({ type: e.target.value })}
                      placeholder="ej: DDR5 / DDR4"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Velocidad *</label>
                    <input
                      type="text"
                      value={ramData.speed || ""}
                      onChange={(e) => updateRam({ speed: e.target.value })}
                      placeholder="ej: 6000 MT/s (PC5-48000) / 3600 MHz"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Formato *</label>
                    <input
                      type="text"
                      value={ramData.format || ""}
                      onChange={(e) => updateRam({ format: e.target.value })}
                      placeholder="ej: UDIMM de 288 contactos / SO-DIMM"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avanzadas */}
              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Voltaje</label>
                    <input
                      type="text"
                      value={ramData.voltage || ""}
                      onChange={(e) => updateRam({ voltage: e.target.value })}
                      placeholder="ej: 1.35 V / 1.40 V"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Latencia Cl (CAS)</label>
                    <input
                      type="text"
                      value={ramData.latencyClCas || ""}
                      onChange={(e) => updateRam({ latencyClCas: e.target.value })}
                      placeholder="ej: CL30 / CL36"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Latencia Trcd</label>
                    <input
                      type="text"
                      value={ramData.latencyTrcd || ""}
                      onChange={(e) => updateRam({ latencyTrcd: e.target.value })}
                      placeholder="ej: 36"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Latencia Trp</label>
                    <input
                      type="text"
                      value={ramData.latencyTrp || ""}
                      onChange={(e) => updateRam({ latencyTrp: e.target.value })}
                      placeholder="ej: 36"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Latencia Tras</label>
                    <input
                      type="text"
                      value={ramData.latencyTras || ""}
                      onChange={(e) => updateRam({ latencyTras: e.target.value })}
                      placeholder="ej: 76"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Soporte ECC</label>
                    <input
                      type="text"
                      value={ramData.eccSupport || ""}
                      onChange={(e) => updateRam({ eccSupport: e.target.value })}
                      placeholder="ej: On-Die ECC (No ECC registrado)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Soporte full buffered</label>
                    <input
                      type="text"
                      value={ramData.fullBufferedSupport || ""}
                      onChange={(e) => updateRam({ fullBufferedSupport: e.target.value })}
                      placeholder="ej: Unbuffered (No registrado)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. DISCO DURO */}
          {hardwareType === "DISCO_DURO" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 bg-teal-950/30 border border-teal-500/30 px-3 py-2 rounded-xl">
                <HardDrive className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Especificaciones de Disco Duro (HDD)</span>
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
                      value={hddData.type || ""}
                      onChange={(e) => updateHdd({ type: e.target.value })}
                      placeholder="ej: HDD Interno / Externo portátil"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Línea *</label>
                    <input
                      type="text"
                      value={hddData.line || ""}
                      onChange={(e) => updateHdd({ line: e.target.value })}
                      placeholder="ej: Seagate Barracuda / Western Digital Blue / IronWolf"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Capacidad *</label>
                    <input
                      type="text"
                      value={hddData.capacity || ""}
                      onChange={(e) => updateHdd({ capacity: e.target.value })}
                      placeholder="ej: 2 TB / 4 TB / 8 TB"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">RPM *</label>
                    <input
                      type="text"
                      value={hddData.rpm || ""}
                      onChange={(e) => updateHdd({ rpm: e.target.value })}
                      placeholder="ej: 7200 RPM / 5400 RPM"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tamaño *</label>
                    <input
                      type="text"
                      value={hddData.size || ""}
                      onChange={(e) => updateHdd({ size: e.target.value })}
                      placeholder="ej: 3.5 pulgadas / 2.5 pulgadas"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Bus *</label>
                    <input
                      type="text"
                      value={hddData.bus || ""}
                      onChange={(e) => updateHdd({ bus: e.target.value })}
                      placeholder="ej: SATA III (6.0 Gb/s) / USB 3.2"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Búfer *</label>
                    <input
                      type="text"
                      value={hddData.buffer || ""}
                      onChange={(e) => updateHdd({ buffer: e.target.value })}
                      placeholder="ej: 256 MB Caché / 64 MB"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. SSD */}
          {hardwareType === "SSD" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-950/30 border border-sky-500/30 px-3 py-2 rounded-xl">
                <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Especificaciones de Unidad de Estado Sólido (SSD)</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Línea *</label>
                    <input
                      type="text"
                      value={ssdData.line || ""}
                      onChange={(e) => updateSsd({ line: e.target.value })}
                      placeholder="ej: Samsung 990 PRO / Kingston KC3000 / Crucial T500"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Capacidad *</label>
                    <input
                      type="text"
                      value={ssdData.capacity || ""}
                      onChange={(e) => updateSsd({ capacity: e.target.value })}
                      placeholder="ej: 1 TB / 2 TB / 4 TB"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Formato *</label>
                    <input
                      type="text"
                      value={ssdData.format || ""}
                      onChange={(e) => updateSsd({ format: e.target.value })}
                      placeholder="ej: M.2 2280 con heatsink / 2.5 pulgadas SATA"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Bus *</label>
                    <input
                      type="text"
                      value={ssdData.bus || ""}
                      onChange={(e) => updateSsd({ bus: e.target.value })}
                      placeholder="ej: PCIe 4.0 x4, NVMe 2.0 / PCIe 5.0 x4"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">¿Posee DRAM? *</label>
                    <input
                      type="text"
                      value={ssdData.hasDram || ""}
                      onChange={(e) => updateSsd({ hasDram: e.target.value })}
                      placeholder="ej: Sí, 2 GB LPDDR4 / DRAM-less con HMB"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tipo memoria NAND *</label>
                    <input
                      type="text"
                      value={ssdData.nandType || ""}
                      onChange={(e) => updateSsd({ nandType: e.target.value })}
                      placeholder="ej: 3D TLC V-NAND / QLC 176 capas"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Controladora *</label>
                    <input
                      type="text"
                      value={ssdData.controller || ""}
                      onChange={(e) => updateSsd({ controller: e.target.value })}
                      placeholder="ej: Samsung Pascal / Phison PS5018-E18 / InnoGrit"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Lectura secuencial (según fabricante) *</label>
                    <input
                      type="text"
                      value={ssdData.sequentialRead || ""}
                      onChange={(e) => updateSsd({ sequentialRead: e.target.value })}
                      placeholder="ej: Hasta 7.450 MB/s"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Escritura secuencial (según fabricante) *</label>
                    <input
                      type="text"
                      value={ssdData.sequentialWrite || ""}
                      onChange={(e) => updateSsd({ sequentialWrite: e.target.value })}
                      placeholder="ej: Hasta 6.900 MB/s"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. GABINETE */}
          {hardwareType === "GABINETE" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400 bg-violet-950/30 border border-violet-500/30 px-3 py-2 rounded-xl">
                <Box className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Especificaciones de Gabinete Gamer</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Formato / Tamaño *</label>
                    <input
                      type="text"
                      value={cabinetData.format || ""}
                      onChange={(e) => updateCabinet({ format: e.target.value })}
                      placeholder="ej: Mid Tower / Full Tower / Mini-ITX"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Soporte Placas Madre *</label>
                    <input
                      type="text"
                      value={cabinetData.motherboardSupport || ""}
                      onChange={(e) => updateCabinet({ motherboardSupport: e.target.value })}
                      placeholder="ej: E-ATX, ATX, Micro-ATX, Mini-ITX"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Panel Lateral</label>
                    <input
                      type="text"
                      value={cabinetData.sidePanel || ""}
                      onChange={(e) => updateCabinet({ sidePanel: e.target.value })}
                      placeholder="ej: Vidrio Templado 4mm / Mesh Meshificado"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Largo Máximo GPU</label>
                    <input
                      type="text"
                      value={cabinetData.gpuMaxDimensions || ""}
                      onChange={(e) => updateCabinet({ gpuMaxDimensions: e.target.value })}
                      placeholder="ej: Hasta 410 mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-[#9bb5c2]">Altura Máxima Cooler CPU</label>
                    <input
                      type="text"
                      value={cabinetData.cpuCoolerMaxHeight || ""}
                      onChange={(e) => updateCabinet({ cpuCoolerMaxHeight: e.target.value })}
                      placeholder="ej: Hasta 180 mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. FUENTE DE PODER */}
          {hardwareType === "FUENTE_DE_PODER" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 bg-yellow-950/30 border border-yellow-500/30 px-3 py-2 rounded-xl">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Especificaciones de Fuente de Poder (Básicas y Avanzadas)</span>
              </div>

              {/* Básicas */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Potencia *</label>
                    <input
                      type="text"
                      value={psuData.power || ""}
                      onChange={(e) => updatePowerSupply({ power: e.target.value })}
                      placeholder="ej: 850 W / 1000 W"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Certificación *</label>
                    <input
                      type="text"
                      value={psuData.certification || ""}
                      onChange={(e) => updatePowerSupply({ certification: e.target.value })}
                      placeholder="ej: 80 Plus Gold / Cybenetics Platinum"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tamaño *</label>
                    <input
                      type="text"
                      value={psuData.size || ""}
                      onChange={(e) => updatePowerSupply({ size: e.target.value })}
                      placeholder="ej: ATX (150 x 86 x 140 mm) / SFX"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">PFC activo *</label>
                    <input
                      type="text"
                      value={psuData.activePfc || ""}
                      onChange={(e) => updatePowerSupply({ activePfc: e.target.value })}
                      placeholder="ej: Sí, PFC Activo (>0.99 a carga plena)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-[#9bb5c2]">Modular *</label>
                    <input
                      type="text"
                      value={psuData.modular || ""}
                      onChange={(e) => updatePowerSupply({ modular: e.target.value })}
                      placeholder="ej: Totalmente Modular (Full Modular) / Semi-modular"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Avanzadas */}
              <div className="space-y-3 pt-2 border-t border-[#004E72]/30">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Avanzadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Corriente en la línea de 12 V</label>
                    <input
                      type="text"
                      value={psuData.rail12vCurrent || ""}
                      onChange={(e) => updatePowerSupply({ rail12vCurrent: e.target.value })}
                      placeholder="ej: 70.8 A (849.6 W)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Corriente en la línea de 5 V</label>
                    <input
                      type="text"
                      value={psuData.rail5vCurrent || ""}
                      onChange={(e) => updatePowerSupply({ rail5vCurrent: e.target.value })}
                      placeholder="ej: 20 A"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Corriente en la línea de 3.3 V</label>
                    <input
                      type="text"
                      value={psuData.rail33vCurrent || ""}
                      onChange={(e) => updatePowerSupply({ rail33vCurrent: e.target.value })}
                      placeholder="ej: 20 A"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Conectores de energía</label>
                    <input
                      type="text"
                      value={psuData.powerConnectors || ""}
                      onChange={(e) => updatePowerSupply({ powerConnectors: e.target.value })}
                      placeholder="ej: 1x 12V-2x6 (PCIe 5.1 600W), 4x PCIe 6+2 pin, 2x EPS 8-pin, 8x SATA"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. COOLER CPU */}
          {hardwareType === "COOLER_CPU" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-3 py-2 rounded-xl">
                <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Especificaciones de Cooler CPU</span>
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
                      value={coolerData.brand || ""}
                      onChange={(e) => updateCoolerCpu({ brand: e.target.value })}
                      placeholder="ej: DeepCool / Thermalright / Noctua / Corsair"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tipo *</label>
                    <input
                      type="text"
                      value={coolerData.type || ""}
                      onChange={(e) => updateCoolerCpu({ type: e.target.value })}
                      placeholder="ej: Refrigeración Líquida AIO 360mm / Torre de Aire Dual"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Peso *</label>
                    <input
                      type="text"
                      value={coolerData.weight || ""}
                      onChange={(e) => updateCoolerCpu({ weight: e.target.value })}
                      placeholder="ej: 1.250 g / 850 g"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">RPM *</label>
                    <input
                      type="text"
                      value={coolerData.rpm || ""}
                      onChange={(e) => updateCoolerCpu({ rpm: e.target.value })}
                      placeholder="ej: 500 - 2.100 RPM ±10%"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Ruido *</label>
                    <input
                      type="text"
                      value={coolerData.noise || ""}
                      onChange={(e) => updateCoolerCpu({ noise: e.target.value })}
                      placeholder="ej: 19 - 31.6 dBA"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Flujo de aire *</label>
                    <input
                      type="text"
                      value={coolerData.airflow || ""}
                      onChange={(e) => updateCoolerCpu({ airflow: e.target.value })}
                      placeholder="ej: 72.8 CFM"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Altura *</label>
                    <input
                      type="text"
                      value={coolerData.height || ""}
                      onChange={(e) => updateCoolerCpu({ height: e.target.value })}
                      placeholder="ej: 157 mm (Torre) / 27 mm (Radiador)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tamaño ventilador *</label>
                    <input
                      type="text"
                      value={coolerData.fanSize || ""}
                      onChange={(e) => updateCoolerCpu({ fanSize: e.target.value })}
                      placeholder="ej: 3x 120 mm / 2x 140 mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">¿Heatpipes? *</label>
                    <input
                      type="text"
                      value={coolerData.hasHeatpipes || ""}
                      onChange={(e) => updateCoolerCpu({ hasHeatpipes: e.target.value })}
                      placeholder="ej: 6x 6mm de cobre sinterizado / No aplica (AIO)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs text-[#9bb5c2]">Sockets compatibles *</label>
                    <input
                      type="text"
                      value={coolerData.compatibleSockets || ""}
                      onChange={(e) => updateCoolerCpu({ compatibleSockets: e.target.value })}
                      placeholder="ej: Intel LGA1700/1851/1200/115X, AMD AM5/AM4"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. VENTILADORES */}
          {hardwareType === "VENTILADORES" && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 bg-teal-950/30 border border-teal-500/30 px-3 py-2 rounded-xl">
                <Fan className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Especificaciones de Ventiladores (Fans)</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-[#FF6E42] uppercase tracking-wider">
                  Especificaciones Básicas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Marca</label>
                    <input
                      type="text"
                      value={fanData.brand || ""}
                      onChange={(e) => updateFan({ brand: e.target.value })}
                      placeholder="ej: Lian Li / Corsair / Noctua / be quiet!"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Tamaño</label>
                    <input
                      type="text"
                      value={fanData.size || ""}
                      onChange={(e) => updateFan({ size: e.target.value })}
                      placeholder="ej: 120 mm / 140 mm"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">RPM</label>
                    <input
                      type="text"
                      value={fanData.rpm || ""}
                      onChange={(e) => updateFan({ rpm: e.target.value })}
                      placeholder="ej: 800 - 2000 RPM (PWM)"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Ruido</label>
                    <input
                      type="text"
                      value={fanData.noise || ""}
                      onChange={(e) => updateFan({ noise: e.target.value })}
                      placeholder="ej: 28 dBA"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Flujo de aire</label>
                    <input
                      type="text"
                      value={fanData.airflow || ""}
                      onChange={(e) => updateFan({ airflow: e.target.value })}
                      placeholder="ej: 64.5 CFM"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[#9bb5c2]">Iluminación</label>
                    <input
                      type="text"
                      value={fanData.lighting || ""}
                      onChange={(e) => updateFan({ lighting: e.target.value })}
                      placeholder="ej: ARGB direccionable / Espejo infinito"
                      className="w-full px-3 py-2 rounded-xl bg-[#004E72]/20 border border-[#004E72]/60 text-[#F9F9F9] text-xs focus:border-[#FF6E42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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
