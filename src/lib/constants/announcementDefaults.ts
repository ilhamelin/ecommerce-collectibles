export interface StoreAnnouncementData {
  enabled: boolean;

  // 1. Envíos y Despacho
  shippingText: string;
  shippingHighlight: string;
  shippingLink: string;
  shippingEnabled: boolean;

  // 2. Cuotas y Medios de Pago
  paymentText: string;
  paymentHighlight: string;
  paymentEnabled: boolean;

  // 3. Garantía y Autenticidad
  guaranteeText: string;
  guaranteeHighlight: string;
  guaranteeEnabled: boolean;

  // 4. WhatsApp y Soporte Directo
  whatsappLabel: string;
  whatsappPhone: string;
  whatsappLink: string;
  whatsappPulse: boolean;
  whatsappEnabled: boolean;

  // Estilos y Personalización Visual
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export const DEFAULT_ANNOUNCEMENT_DATA: StoreAnnouncementData = {
  enabled: true,

  // Item 1: Envíos
  shippingText: "Envíos a todo Chile",
  shippingHighlight: "(Starken / Chilexpress)",
  shippingLink: "/tracking",
  shippingEnabled: true,

  // Item 2: Cuotas
  paymentText: "Hasta 12 cuotas sin interés con",
  paymentHighlight: "Webpay & Mercado Pago",
  paymentEnabled: true,

  // Item 3: Originalidad
  guaranteeText: "Figuras 100% Originales & Licenciadas",
  guaranteeHighlight: "100% Originales & Licenciadas",
  guaranteeEnabled: true,

  // Item 4: WhatsApp
  whatsappLabel: "WhatsApp Atención:",
  whatsappPhone: "+56 9 5824 3917",
  whatsappLink: "https://wa.me/56958243917?text=Hola%2C%20tengo%20una%20consulta%20sobre%20un%20producto%20de%20la%20tienda",
  whatsappPulse: true,
  whatsappEnabled: true,

  // Colores del tema corporativo
  backgroundColor: "#1F3A5F",
  textColor: "#F9F9F9",
  accentColor: "#FF6B35",
};
