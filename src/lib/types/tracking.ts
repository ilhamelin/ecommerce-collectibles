/**
 * @file tracking.ts
 * @description Definiciones de tipos e interfaces estrictas para el ecosistema de tracking y logística.
 */

export type TrackingStatus =
  | "PENDING"
  | "INFO_RECEIVED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION"
  | "FAILED_ATTEMPT";

export interface TrackingCheckpoint {
  timestamp: string;
  location: string;
  message: string;
  status: TrackingStatus;
  rawTag?: string;
}

export interface TrackingResult {
  trackingNumber: string;
  courierSlug: string;
  courierName: string;
  status: TrackingStatus;
  estimatedDelivery: string | null;
  checkpoints: TrackingCheckpoint[];
  source: "AFTERSHIP_LIVE" | "AFTERSHIP_SANDBOX" | "LOCAL_FALLBACK";
  externalTrackingUrl?: string;
  updatedAt: string;
}

export interface AfterShipApiCheckpoint {
  checkpoint_time: string;
  location: string | null;
  message: string;
  tag: string;
  subtag_message?: string;
}

export interface AfterShipApiTracking {
  id?: string;
  tracking_number: string;
  slug: string;
  tag: string;
  subtag?: string;
  expected_delivery?: string | null;
  checkpoints?: AfterShipApiCheckpoint[];
}

export interface AfterShipApiResponse {
  meta: {
    code: number;
    message?: string;
    type?: string;
  };
  data?: {
    tracking?: AfterShipApiTracking;
    trackings?: AfterShipApiTracking[];
  };
}

export interface ITrackingService {
  /**
   * Registra un número de seguimiento en el proveedor logístico.
   */
  createTracking(trackingNumber: string, courierSlug: string, orderId: string): Promise<boolean>;

  /**
   * Consulta el estado de trazabilidad y bitácora en vivo.
   */
  getTracking(trackingNumber: string, courierSlug?: string): Promise<TrackingResult>;
}
