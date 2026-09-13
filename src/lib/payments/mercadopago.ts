import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { ConfirmedOrderEntity } from "../types/domain";

/**
 * Returns true if Mercado Pago credentials are configured in environment variables.
 */
export function isMercadoPagoConfigured(): boolean {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  return Boolean(token && token.trim().length > 10);
}

/**
 * Singleton instance of Mercado Pago Client
 */
let mpClientInstance: MercadoPagoConfig | null = null;

export function getMercadoPagoClient(): MercadoPagoConfig | null {
  if (!isMercadoPagoConfigured()) return null;

  if (!mpClientInstance) {
    mpClientInstance = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!.trim(),
      options: {
        timeout: 10000,
        idempotencyKey: `mp-client-${Date.now()}`,
      },
    });
  }

  return mpClientInstance;
}

export interface CreatePreferenceParams {
  order: ConfirmedOrderEntity;
  baseUrl: string;
}

export interface PreferenceResult {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

/**
 * Creates a Checkout Pro Preference on Mercado Pago.
 */
export async function createMercadoPagoPreference(
  params: CreatePreferenceParams
): Promise<PreferenceResult | null> {
  const client = getMercadoPagoClient();
  if (!client) return null;

  const { order, baseUrl } = params;
  const isSandbox = process.env.MERCADOPAGO_SANDBOX_MODE !== "false";

  // Build items array from order
  const items = order.items.map((item) => ({
    id: item.productId || item.sku,
    title: item.name.length > 250 ? item.name.substring(0, 247) + "..." : item.name,
    description: `SKU: ${item.sku} • OmniCollector Chile`,
    quantity: item.quantity,
    unit_price: item.isPartialDeposit ? Math.round(item.unitDeposit) : Math.round(item.unitPrice),
    currency_id: "CLP",
    picture_url: item.imageUrl,
  }));

  // If shipping cost exists, add shipping as an item or fee
  if (order.shippingCost > 0) {
    items.push({
      id: "shipping-fee",
      title: `Costo de Envío • ${order.shippingMethod.name}`,
      description: "Despacho asegurado a domicilio en Chile",
      quantity: 1,
      unit_price: Math.round(order.shippingCost),
      currency_id: "CLP",
      picture_url: undefined,
    });
  }

  // If coupon discount exists, adjust or apply
  // (In Mercado Pago, items sum must equal total, so if discount is present, adjust)
  const itemsTotal = items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);
  const targetTotal = Math.round(order.totalChargedNow);
  if (itemsTotal !== targetTotal && itemsTotal > 0) {
    const diff = targetTotal - itemsTotal;
    if (diff < 0) {
      // Apply discount item with negative or discount description
      // Mercado Pago rejects negative unit_price in some regions, so proportional scaling or item adjustment
      const scale = targetTotal / itemsTotal;
      items.forEach((it) => {
        it.unit_price = Math.max(1, Math.round(it.unit_price * scale));
      });
    }
  }

  // Split name
  const nameParts = (order.customer.fullName || "Coleccionista Chile").trim().split(" ");
  const firstName = nameParts[0] || "Coleccionista";
  const lastName = nameParts.slice(1).join(" ") || "Cliente";

  const preference = new Preference(client);

  const cleanRut = (order.customer.rut || "").replace(/[^0-9kK]/g, "").toUpperCase();

  // In Sandbox mode, if a real customer email registered in Mercado Libre is passed,
  // Mercado Pago blocks the transaction with "Una de las partes con la que intentas hacer el pago es de prueba".
  // We sanitize to a sandbox test email for Mercado Pago preference while keeping customer's real email in Firestore.
  const payerEmail = isSandbox && !order.customer.email.toLowerCase().includes("testuser")
    ? `test_payer_${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase()}@testuser.com`
    : order.customer.email;

  const response = await preference.create({
    body: {
      items,
      payer: {
        name: firstName,
        surname: lastName,
        email: payerEmail,
        phone: {
          number: order.customer.phone.replace(/[^0-9]/g, "").slice(-9),
        },
        identification: cleanRut ? {
          type: "RUT",
          number: cleanRut,
        } : undefined,
        address: {
          street_name: order.customer.address,
        },
      },
      back_urls: {
        success: `${baseUrl}/api/checkout/mercadopago/callback?orderId=${order.id}&status=approved`,
        pending: `${baseUrl}/api/checkout/mercadopago/callback?orderId=${order.id}&status=pending`,
        failure: `${baseUrl}/api/checkout/mercadopago/callback?orderId=${order.id}&status=failure`,
      },
      auto_return: baseUrl.startsWith("https://") ? "approved" : undefined,
      notification_url: baseUrl.startsWith("https://") ? `${baseUrl}/api/checkout/mercadopago/webhook` : undefined,
      external_reference: order.id,
      statement_descriptor: "OMNICOLLECTOR",
      payment_methods: {
        installments: 12, // Allow up to 12 installments in Chile
      },
    },
  });

  return {
    id: response.id || "",
    initPoint: response.init_point || "",
    sandboxInitPoint: response.sandbox_init_point || response.init_point || "",
  };
}

/**
 * Fetches transaction details from Mercado Pago using paymentId
 */
export async function getMercadoPagoPayment(paymentId: string | number) {
  const client = getMercadoPagoClient();
  if (!client) return null;

  try {
    const payment = new Payment(client);
    const response = await payment.get({ id: String(paymentId) });
    return response;
  } catch (err) {
    console.error(`[Mercado Pago] Error fetching payment ${paymentId}:`, err);
    return null;
  }
}
