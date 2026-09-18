import { ConfirmedOrderEntity } from "../types/domain";
import {
  isMercadoPagoConfigured,
  createMercadoPagoPreference,
} from "./mercadopago";
import { isFlowConfigured, createFlowPaymentOrder } from "./flow";

export interface GatewayCheckoutResponse {
  requiresRedirect: boolean;
  redirectUrl: string | null;
  gatewayName: "MERCADO_PAGO" | "FLOW" | "SIMULATED_SANDBOX" | "DIRECT_TRANSFER";
  mode: "LIVE" | "SANDBOX" | "SIMULATED";
  preferenceId?: string;
  message: string;
}

/**
 * Initiates the payment process with the appropriate gateway for an order.
 */
export async function initiatePaymentGateway(
  order: ConfirmedOrderEntity,
  baseUrl: string
): Promise<GatewayCheckoutResponse> {
  const method = order.paymentMethod;

  // 1. Direct Bank Transfer does not require payment gateway redirect
  if (method === "BANK_TRANSFER") {
    return {
      requiresRedirect: false,
      redirectUrl: `/order-confirmation/${order.id}`,
      gatewayName: "DIRECT_TRANSFER",
      mode: "LIVE",
      message: "Transferencia bancaria registrada. Pendiente de recepción de comprobante.",
    };
  }

  // 2. Flow.cl (Prioridad para Débito / Transbank Webpay Plus)
  if (method === "WEBPAY" && isFlowConfigured()) {
    try {
      const flowResult = await createFlowPaymentOrder(order, baseUrl);
      if (flowResult) {
        return {
          requiresRedirect: true,
          redirectUrl: flowResult.url,
          gatewayName: "FLOW",
          mode: process.env.FLOW_SANDBOX_MODE !== "false" ? "SANDBOX" : "LIVE",
          message: "Orden de pago Webpay Plus generada con Flow Chile.",
        };
      }
    } catch (err) {
      console.error("[PaymentGateway] Error initiating Flow:", err);
    }
  }

  // 3. Mercado Pago (Checkout Pro / Tarjetas de crédito / Cuenta MP)
  if (method === "MERCADO_PAGO" || method === "WEBPAY") {
    if (isMercadoPagoConfigured()) {
      try {
        const preference = await createMercadoPagoPreference({ order, baseUrl });
        if (preference) {
          const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";
          const isSandbox = process.env.MERCADOPAGO_SANDBOX_MODE !== "false" || token.startsWith("TEST-");
          const redirectUrl = isSandbox
            ? (preference.sandboxInitPoint || preference.initPoint)
            : (preference.initPoint || preference.sandboxInitPoint);

          return {
            requiresRedirect: true,
            redirectUrl,
            gatewayName: "MERCADO_PAGO",
            mode: isSandbox ? "SANDBOX" : "LIVE",
            preferenceId: preference.id,
            message: "Preferencia generada exitosamente en Mercado Pago Chile.",
          };
        }
      } catch (err) {
        console.error("[PaymentGateway] Error generating Mercado Pago preference:", err);
      }
    }
  }

  // 4. Realistic Interactive Sandbox Simulator
  // (Used when Mercado Pago credentials are not yet pasted in .env.local)
  if (method === "MERCADO_PAGO" || method === "WEBPAY") {
    const simulatedUrl = `/checkout/sandbox-payment?orderId=${encodeURIComponent(order.id)}&amount=${Math.round(order.totalChargedNow)}`;
    return {
      requiresRedirect: true,
      redirectUrl: simulatedUrl,
      gatewayName: "SIMULATED_SANDBOX",
      mode: "SIMULATED",
      message: "Modo Sandbox Activo: Simulador de cobro con tarjeta y Mercado Pago listo para pruebas.",
    };
  }

  // Default fallback
  return {
    requiresRedirect: false,
    redirectUrl: `/order-confirmation/${order.id}`,
    gatewayName: "DIRECT_TRANSFER",
    mode: "LIVE",
    message: "Orden creada.",
  };
}
