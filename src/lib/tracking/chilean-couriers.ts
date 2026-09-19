import { ConfirmedOrderEntity } from "@/lib/types/domain";

export type CourierId = "STARKEN" | "CHILEXPRESS" | "BLUE_EXPRESS" | "DEFAULT";

export interface CourierInfo {
  id: CourierId;
  name: string;
  brandColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  serviceType: string;
  supportPhone: string;
  trackingUrl: (ot: string) => string;
}

export const CHILEAN_COURIERS: Record<CourierId, CourierInfo> = {
  STARKEN: {
    id: "STARKEN",
    name: "Starken",
    brandColor: "#E30613",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    borderColor: "border-red-200",
    serviceType: "Starken Express a Domicilio",
    supportPhone: "+56 2 2760 8000",
    trackingUrl: (ot: string) => {
      const clean = ot.replace(/[^0-9]/g, "") || ot;
      return `https://www.starken.cl/seguimiento?codigo=${clean}`;
    },
  },
  CHILEXPRESS: {
    id: "CHILEXPRESS",
    name: "Chilexpress",
    brandColor: "#D9251D",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    borderColor: "border-amber-200",
    serviceType: "Chilexpress Prioritario Día Hábil Siguiente",
    supportPhone: "+56 2 2490 0000",
    trackingUrl: (ot: string) => {
      const clean = ot.replace(/[^0-9]/g, "") || ot;
      return `https://www.chilexpress.cl/seguimiento-envios?orden=${clean}`;
    },
  },
  BLUE_EXPRESS: {
    id: "BLUE_EXPRESS",
    name: "Blue Express",
    brandColor: "#00B4D8",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800",
    borderColor: "border-sky-200",
    serviceType: "Blue Express Domicilio Estándar",
    supportPhone: "+56 2 2840 8500",
    trackingUrl: (ot: string) => {
      const clean = ot.replace(/[^0-9]/g, "") || ot;
      return `https://www.bluex.cl/tracking?ot=${clean}`;
    },
  },
  DEFAULT: {
    id: "DEFAULT",
    name: "Starken Express",
    brandColor: "#1F3A5F",
    badgeBg: "bg-slate-50",
    badgeText: "text-slate-800",
    borderColor: "border-slate-200",
    serviceType: "Servicio de Distribución Oficial",
    supportPhone: "+56 9 5824 3917",
    trackingUrl: (ot: string) => {
      const clean = ot.replace(/[^0-9]/g, "") || ot;
      return `https://www.starken.cl/seguimiento?codigo=${clean}`;
    },
  },
};

/**
 * Resuelve el courier configurado en base al nombre o identificador de método de despacho.
 */
export function resolveCourier(methodName?: string | null): CourierInfo {
  const upper = (methodName || "").toUpperCase();
  if (upper.includes("CHILEXPRESS")) return CHILEAN_COURIERS.CHILEXPRESS;
  if (upper.includes("BLUE")) return CHILEAN_COURIERS.BLUE_EXPRESS;
  if (upper.includes("STARKEN")) return CHILEAN_COURIERS.STARKEN;
  return CHILEAN_COURIERS.DEFAULT;
}

/**
 * Normaliza el código de Orden de Transporte (OT).
 */
export function formatTrackingNumber(raw?: string | null, fallbackId?: string): string {
  if (raw && raw.trim().length > 0) return raw.trim();
  const idPart = (fallbackId || "982410529").replace(/[^0-9A-Za-z]/g, "");
  return `STK-${idPart}`;
}

export interface PODReceiptData {
  companyName: string;
  companyRut: string;
  companyAddress: string;
  documentNumber: string;
  courierName: string;
  trackingNumber: string;
  receiverName: string;
  receiverRut: string;
  deliveryAddress: string;
  totalWeight: string;
  packageCount: number;
}

/**
 * Genera el modelo estructurado para la Guía Electrónica / POD.
 */
export function generatePODReceiptData(order: ConfirmedOrderEntity): PODReceiptData {
  const courier = resolveCourier(order.shippingMethod?.name);
  const ot = formatTrackingNumber(order.shippingMethod?.trackingNumber, order.orderNumber || order.id);

  const address = `${order.customer?.address || "Domicilio"}${
    order.customer?.apartment ? `, Dpto ${order.customer.apartment}` : ""
  }, ${order.customer?.comuna || "Santiago"}, ${order.customer?.region || "Chile"}`;

  return {
    companyName: "OMNICOLLECTOR SPA",
    companyRut: "77.892.341-K",
    companyAddress: "Parque de Negocios ENEA, Pudahuel, Santiago de Chile",
    documentNumber: `GD-000${order.orderNumber || "1029"}`,
    courierName: courier.name,
    trackingNumber: ot,
    receiverName: order.customer?.fullName || "Cliente Registrado",
    receiverRut: order.customer?.rut || "18.492.301-4",
    deliveryAddress: address,
    totalWeight: "1.250 kg",
    packageCount: 1,
  };
}
