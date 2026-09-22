/**
 * @file aftershipService.ts
 * @description Implementación del adaptador de tracking para AfterShip API v2025-01.
 * Maneja llamadas REST seguras hacia AfterShip, mapeo de checkpoints y tolerancia a fallos.
 */

import {
  ITrackingService,
  TrackingResult,
  TrackingStatus,
  TrackingCheckpoint,
  AfterShipApiResponse,
  AfterShipApiTracking,
  AfterShipApiCheckpoint,
} from "@/lib/types/tracking";
import { resolveCourier } from "@/lib/tracking/chilean-couriers";

export class AfterShipService implements ITrackingService {
  private readonly apiKey: string | null;
  private readonly baseUrl = "https://api.aftership.com/tracking/2025-01";

  constructor(apiKeyOverride?: string) {
    this.apiKey = apiKeyOverride ?? process.env.AFTERSHIP_API_KEY ?? null;
  }

  /**
   * Resuelve el slug de courier reconocido por AfterShip a partir de un nombre común chileno.
   * @param courierName Nombre o identificador del courier.
   * @returns Slug normalizado de AfterShip (ej: "starken", "chilexpress", "bluex", "correos-chile").
   */
  public normalizeCourierSlug(courierName?: string | null): string {
    const raw = (courierName || "").toLowerCase().trim();
    if (raw.includes("chilexpress")) return "chilexpress";
    if (raw.includes("blue")) return "bluex";
    if (raw.includes("correo")) return "correos-chile";
    if (raw.includes("dhl")) return "dhl";
    if (raw.includes("fedex")) return "fedex";
    if (raw.includes("japan")) return "japan-post";
    return "starken"; // Default en Chile para OmniCollector
  }

  /**
   * Mapea los tags de estado de AfterShip al enum unificado TrackingStatus.
   * @param tag Tag de AfterShip (ej: "InTransit", "Delivered", "OutForDelivery").
   */
  public mapStatus(tag?: string): TrackingStatus {
    const normalized = (tag || "").toLowerCase();
    switch (normalized) {
      case "info_received":
      case "inforeceived":
        return "INFO_RECEIVED";
      case "in_transit":
      case "intransit":
        return "IN_TRANSIT";
      case "out_for_delivery":
      case "outfordelivery":
        return "OUT_FOR_DELIVERY";
      case "delivered":
        return "DELIVERED";
      case "exception":
        return "EXCEPTION";
      case "attempt_fail":
      case "attemptfail":
        return "FAILED_ATTEMPT";
      default:
        return "PENDING";
    }
  }

  /**
   * Registra un nuevo paquete para seguimiento continuo en AfterShip.
   * @param trackingNumber Número de Orden de Transporte (OT).
   * @param courierSlug Slug del transportista (ej: "starken").
   * @param orderId Identificador de la orden en el e-commerce.
   */
  public async createTracking(
    trackingNumber: string,
    courierSlug: string,
    orderId: string
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.warn("[AfterShipService] Operando sin AFTERSHIP_API_KEY. Registro omitido.");
      return false;
    }

    const cleanOT = trackingNumber.trim();
    const slug = this.normalizeCourierSlug(courierSlug);

    try {
      const response = await fetch(`${this.baseUrl}/trackings`, {
        method: "POST",
        headers: {
          "as-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracking: {
            tracking_number: cleanOT,
            slug,
            order_id: orderId,
            title: `Pedido OmniCollector #${orderId}`,
          },
        }),
      });

      if (!response.ok) {
        // Código 4004 indica que el tracking ya estaba registrado previamente en AfterShip
        const errorText = await response.text();
        if (response.status === 4004 || errorText.includes("already exists")) {
          return true;
        }
        console.error(
          `[AfterShipService] Fallo al crear tracking (${response.status}):`,
          errorText
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("[AfterShipService] Excepción de red en createTracking:", error);
      return false;
    }
  }

  /**
   * Consulta el estado de trazabilidad y checkpoints en AfterShip.
   * Si no hay API key o la consulta falla, retorna un fallback estructurado y seguro.
   * @param trackingNumber Código de seguimiento / OT.
   * @param courierSlug Slug o nombre del courier opcional.
   */
  public async getTracking(
    trackingNumber: string,
    courierSlug?: string
  ): Promise<TrackingResult> {
    const cleanOT = trackingNumber.trim();
    const resolvedSlug = this.normalizeCourierSlug(courierSlug);
    const courierMeta = resolveCourier(courierSlug);

    if (!this.apiKey) {
      return this.generateMockTrackingResult(cleanOT, resolvedSlug, courierMeta.name);
    }

    try {
      const endpoint = `${this.baseUrl}/trackings/${resolvedSlug}/${cleanOT}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "as-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        // Si el tracking específico por slug no responde, intentamos búsqueda por query param
        const fallbackEndpoint = `${this.baseUrl}/trackings?tracking_numbers=${cleanOT}`;
        const fallbackResponse = await fetch(fallbackEndpoint, {
          method: "GET",
          headers: {
            "as-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!fallbackResponse.ok) {
          console.warn(
            `[AfterShipService] Código HTTP ${response.status} en AfterShip. Usando fallback contextual.`
          );
          return this.generateMockTrackingResult(cleanOT, resolvedSlug, courierMeta.name);
        }

        const fallbackJson = (await fallbackResponse.json()) as AfterShipApiResponse;
        const trackingObj = fallbackJson.data?.trackings?.[0];
        if (!trackingObj) {
          return this.generateMockTrackingResult(cleanOT, resolvedSlug, courierMeta.name);
        }
        return this.transformAfterShipTracking(trackingObj, courierMeta.name, "AFTERSHIP_LIVE");
      }

      const json = (await response.json()) as AfterShipApiResponse;
      const trackingObj = json.data?.tracking;

      if (!trackingObj) {
        return this.generateMockTrackingResult(cleanOT, resolvedSlug, courierMeta.name);
      }

      return this.transformAfterShipTracking(trackingObj, courierMeta.name, "AFTERSHIP_LIVE");
    } catch (error) {
      console.error("[AfterShipService] Error en getTracking:", error);
      return this.generateMockTrackingResult(cleanOT, resolvedSlug, courierMeta.name);
    }
  }

  /**
   * Transforma la respuesta cruda de AfterShip a la entidad homogénea TrackingResult.
   */
  private transformAfterShipTracking(
    raw: AfterShipApiTracking,
    courierName: string,
    source: "AFTERSHIP_LIVE" | "AFTERSHIP_SANDBOX"
  ): TrackingResult {
    const rawCheckpoints: AfterShipApiCheckpoint[] = raw.checkpoints || [];

    const checkpoints: TrackingCheckpoint[] = rawCheckpoints.map((cp) => ({
      timestamp: cp.checkpoint_time,
      location: cp.location || "En tránsito",
      message: cp.subtag_message || cp.message,
      status: this.mapStatus(cp.tag),
      rawTag: cp.tag,
    }));

    return {
      trackingNumber: raw.tracking_number,
      courierSlug: raw.slug,
      courierName: courierName,
      status: this.mapStatus(raw.tag),
      estimatedDelivery: raw.expected_delivery || null,
      checkpoints,
      source,
      externalTrackingUrl: `https://track.aftership.com/${raw.slug}/${raw.tracking_number}`,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Genera un resultado de prueba local para cuando la API Key no esté provista o el paquete sea un mock.
   */
  public generateMockTrackingResult(
    trackingNumber: string,
    courierSlug: string,
    courierName: string
  ): TrackingResult {
    const now = Date.now();
    const hourMs = 3600000;

    const checkpoints: TrackingCheckpoint[] = [
      {
        timestamp: new Date(now - hourMs * 8).toISOString(),
        location: "Bodega Central OmniCollector - Pudahuel, Santiago",
        message: "Admisión de encomienda y embalaje Collector-Grade finalizado.",
        status: "INFO_RECEIVED",
        rawTag: "InfoReceived",
      },
      {
        timestamp: new Date(now - hourMs * 4).toISOString(),
        location: "Centro de Distribución Troncal ENEA",
        message: "Bulto clasificado en sorter automatizado hacia terminal de destino.",
        status: "IN_TRANSIT",
        rawTag: "InTransit",
      },
      {
        timestamp: new Date(now - hourMs * 1).toISOString(),
        location: "Agencia Regional de Distribución",
        message: "Asignado a móvil de reparto para entrega prioritaria en domicilio.",
        status: "OUT_FOR_DELIVERY",
        rawTag: "OutForDelivery",
      },
    ];

    return {
      trackingNumber,
      courierSlug,
      courierName,
      status: "OUT_FOR_DELIVERY",
      estimatedDelivery: new Date(now + hourMs * 4).toISOString(),
      checkpoints,
      source: "LOCAL_FALLBACK",
      externalTrackingUrl: undefined,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const afterShipService = new AfterShipService();
