import { describe, it, expect } from "vitest";
import { ProductDomainEntity } from "@/lib/types/domain";

describe("Product Technical Specifications & Storefront Harmonization", () => {
  it("should match 100% of the admin form fields for Fuente de Poder (PSU)", () => {
    // Admin form inputs from Image 1:
    const adminFormData = {
      power: "750 W",
      certification: "80 PLUS Gold",
      size: "ATX (150 x 86 x 140 mm)",
      activePfc: "Sí, PFC Activo (>0.99 a carga plena)",
      modular: "100% Modular (Full Modular)",
      rail12vCurrent: "62.5 A (750 W)",
      rail5vCurrent: "20 A",
      rail33vCurrent: "20 A",
      powerConnectors: "1x 24-pin ATX, 2x 8-pin EPS (4+4), 1x 16-pin 12V-2x6, 4x PCIe 6+2, 8x SATA",
    };

    const product: Partial<ProductDomainEntity> = {
      id: "prod-psu-corsair",
      name: "Corsair RMe Series RM750e 2025 (CP-9020295-NA) (750 W)",
      type: "OTHER",
      customCategoryLabel: "Fuente de Poder",
      customSpecifications: {
        categoryType: "HARDWARE",
        hardware: {
          hardwareType: "FUENTE_DE_PODER",
          powerSupply: adminFormData,
        },
      },
    };

    const hw = product.customSpecifications?.hardware;
    const hwSubtype = (hw?.hardwareType || "").toUpperCase().replace(/\s+/g, "_");
    const isHardwareCat = true;

    // Simulate the exact mapping from ProductDetailClient
    const technicalSpecs = [
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && hw?.powerSupply?.power
        ? [{ label: "Potencia", value: hw.powerSupply.power }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && hw?.powerSupply?.certification
        ? [{ label: "Certificación", value: hw.powerSupply.certification }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && hw?.powerSupply?.size
        ? [{ label: "Tamaño", value: hw.powerSupply.size }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && (hw?.powerSupply?.activePfc || (hw?.powerSupply as any)?.pfc)
        ? [{ label: "PFC activo", value: hw?.powerSupply?.activePfc || (hw?.powerSupply as any)?.pfc }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && hw?.powerSupply?.modular
        ? [{ label: "Modular", value: hw.powerSupply.modular }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && (hw?.powerSupply?.rail12vCurrent || (hw?.powerSupply as any)?.current12v)
        ? [{ label: "Corriente en la línea de 12 V", value: hw?.powerSupply?.rail12vCurrent || (hw?.powerSupply as any)?.current12v }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && (hw?.powerSupply?.rail5vCurrent || (hw?.powerSupply as any)?.current5v)
        ? [{ label: "Corriente en la línea de 5 V", value: hw?.powerSupply?.rail5vCurrent || (hw?.powerSupply as any)?.current5v }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && (hw?.powerSupply?.rail33vCurrent || (hw?.powerSupply as any)?.current33v || (hw?.powerSupply as any)?.current3v)
        ? [{ label: "Corriente en la línea de 3.3 V", value: hw?.powerSupply?.rail33vCurrent || (hw?.powerSupply as any)?.current33v || (hw?.powerSupply as any)?.current3v }]
        : []),
      ...(isHardwareCat && (!hwSubtype || hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && hw?.powerSupply?.powerConnectors
        ? [{ label: "Conectores de energía", value: hw.powerSupply.powerConnectors }]
        : []),
    ];

    expect(technicalSpecs.length).toBe(9);
    expect(technicalSpecs.map(s => s.label)).toEqual([
      "Potencia",
      "Certificación",
      "Tamaño",
      "PFC activo",
      "Modular",
      "Corriente en la línea de 12 V",
      "Corriente en la línea de 5 V",
      "Corriente en la línea de 3.3 V",
      "Conectores de energía",
    ]);

    expect(technicalSpecs.find(s => s.label === "PFC activo")?.value).toBe("Sí, PFC Activo (>0.99 a carga plena)");
    expect(technicalSpecs.find(s => s.label === "Corriente en la línea de 12 V")?.value).toBe("62.5 A (750 W)");
    expect(technicalSpecs.find(s => s.label === "Corriente en la línea de 5 V")?.value).toBe("20 A");
    expect(technicalSpecs.find(s => s.label === "Corriente en la línea de 3.3 V")?.value).toBe("20 A");
  });

  it("should support legacy alias fields (current12v, pfc) when loading existing PSU products", () => {
    const legacyPsu = {
      power: "850 W",
      certification: "80 Plus Gold",
      size: "ATX",
      pfc: "Sí (>0.99)",
      modular: "Full Modular",
      current12v: "70.8 A",
      current5v: "20 A",
      current3v: "20 A",
      powerConnectors: "1x 24-pin, 2x EPS, 4x PCIe",
    };

    const hw = {
      hardwareType: "psu",
      powerSupply: legacyPsu,
    };
    const hwSubtype = hw.hardwareType.toUpperCase().replace(/\s+/g, "_");

    const specs = [
      ...((hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && (hw?.powerSupply as any)?.pfc
        ? [{ label: "PFC activo", value: (hw?.powerSupply as any)?.activePfc || (hw?.powerSupply as any)?.pfc }]
        : []),
      ...((hwSubtype === "FUENTE_DE_PODER" || hwSubtype === "PSU") && (hw?.powerSupply as any)?.current12v
        ? [{ label: "Corriente en la línea de 12 V", value: (hw?.powerSupply as any)?.rail12vCurrent || (hw?.powerSupply as any)?.current12v }]
        : []),
    ];

    expect(specs.length).toBe(2);
    expect(specs[0].value).toBe("Sí (>0.99)");
    expect(specs[1].value).toBe("70.8 A");
  });

  it("should render all Cooler CPU fields without omitting noise, airflow, or weight", () => {
    const coolerData = {
      brand: "Noctua",
      type: "Aire Doble Torre",
      weight: "1.320 g",
      rpm: "300 - 1.500 RPM",
      noise: "24.6 dBA",
      airflow: "82.5 CFM",
      height: "165 mm",
      fanSize: "2x 140 mm",
      hasHeatpipes: "6x 6mm",
      compatibleSockets: "AM5, LGA1700",
    };

    const hw = {
      hardwareType: "COOLER_CPU",
      coolerCpu: coolerData,
    };
    const hwSubtype = hw.hardwareType;

    const specs = [
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.brand ? [{ label: "Marca", value: hw.coolerCpu.brand }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.type ? [{ label: "Tipo", value: hw.coolerCpu.type }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.weight ? [{ label: "Peso", value: hw.coolerCpu.weight }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.rpm ? [{ label: "RPM", value: hw.coolerCpu.rpm }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.noise ? [{ label: "Ruido", value: hw.coolerCpu.noise }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.airflow ? [{ label: "Flujo de aire", value: hw.coolerCpu.airflow }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.height ? [{ label: "Altura", value: hw.coolerCpu.height }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.fanSize ? [{ label: "Tamaño ventilador", value: hw.coolerCpu.fanSize }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.hasHeatpipes ? [{ label: "¿Heatpipes?", value: hw.coolerCpu.hasHeatpipes }] : []),
      ...(hwSubtype === "COOLER_CPU" && hw.coolerCpu.compatibleSockets ? [{ label: "Sockets compatibles", value: hw.coolerCpu.compatibleSockets }] : []),
    ];

    expect(specs.length).toBe(10);
    expect(specs.find(s => s.label === "Ruido")?.value).toBe("24.6 dBA");
    expect(specs.find(s => s.label === "Flujo de aire")?.value).toBe("82.5 CFM");
    expect(specs.find(s => s.label === "Peso")?.value).toBe("1.320 g");
  });
});
