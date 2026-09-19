import crypto from "crypto";
import { ConfirmedOrderEntity } from "../types/domain";

/**
 * Checks if Flow credentials are configured
 */
export function isFlowConfigured(): boolean {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  return Boolean(apiKey && secretKey && apiKey.trim().length > 5 && secretKey.trim().length > 5);
}

export function getFlowApiUrl(): string {
  const isSandbox = process.env.FLOW_SANDBOX_MODE !== "false";
  return isSandbox ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api";
}

/**
 * Signs parameters using HMAC-SHA256 according to Flow's official specification
 */
export function signFlowParams(params: Record<string, string | number>, secretKey: string): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
}

export interface FlowCreateOrderResult {
  url: string;
  token: string;
  flowOrder: number;
}

/**
 * Creates a payment order on Flow.cl
 */
export async function createFlowPaymentOrder(
  order: ConfirmedOrderEntity,
  baseUrl: string
): Promise<FlowCreateOrderResult | null> {
  if (!isFlowConfigured()) return null;

  const apiKey = process.env.FLOW_API_KEY!.trim();
  const secretKey = process.env.FLOW_SECRET_KEY!.trim();
  const flowUrl = getFlowApiUrl();

  const params: Record<string, any> = {
    apiKey,
    commerceOrder: order.orderNumber || order.id,
    subject: `Compra OmniCollector - Orden #${order.orderNumber}`,
    currency: "CLP",
    amount: Math.round(order.totalChargedNow),
    email: order.customer.email,
    urlConfirmation: `${baseUrl}/api/checkout/flow/webhook`,
    urlReturn: `${baseUrl}/order-confirmation/${order.id}`,
    paymentMethod: 1, // Webpay Plus
  };

  const s = signFlowParams(params, secretKey);
  params.s = s;

  try {
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => formData.append(k, String(v)));

    const res = await fetch(`${flowUrl}/payment/create`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.url && data.token) {
      console.log(`[Flow] Orden creada exitosamente: flowOrder=${data.flowOrder}, token=${data.token}`);
      return {
        url: `${data.url}?token=${data.token}`,
        token: data.token,
        flowOrder: data.flowOrder,
      };
    }

    console.error("[Flow] Error en respuesta de Flow API:", {
      status: res.status,
      data,
    });
    return null;
  } catch (err) {
    console.error("[Flow] Error connecting to Flow API:", err);
    return null;
  }
}

export interface FlowPaymentStatusResponse {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1: pendiente, 2: pagada, 3: rechazada, 4: anulada
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentData?: {
    date: string;
    media: string;
    conversionDate?: string;
    conversionRate?: number;
    amount?: number;
    currency?: string;
    fee?: number;
    balance?: number;
    transferDate?: string;
  };
}

/**
 * Gets payment status from Flow.cl by token
 */
export async function getFlowPaymentStatus(token: string): Promise<FlowPaymentStatusResponse | null> {
  if (!isFlowConfigured() || !token) return null;

  const apiKey = process.env.FLOW_API_KEY!.trim();
  const secretKey = process.env.FLOW_SECRET_KEY!.trim();
  const flowUrl = getFlowApiUrl();

  const params: Record<string, string> = {
    apiKey,
    token,
  };

  const s = signFlowParams(params, secretKey);
  params.s = s;

  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${flowUrl}/payment/getStatus?${query}`, {
      method: "GET",
    });

    if (!res.ok) {
      console.error(`[Flow] Error getStatus: HTTP ${res.status}`);
      return null;
    }

    const data: FlowPaymentStatusResponse = await res.json();
    return data;
  } catch (err) {
    console.error("[Flow] Error fetching payment status:", err);
    return null;
  }
}
