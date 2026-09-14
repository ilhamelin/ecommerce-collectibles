import nodemailer from "nodemailer";

export interface AlertEmailParams {
  recipientEmail: string;
  recipientName?: string;
  productName: string;
  productSku: string;
  productPrice: number;
  productOriginalPrice?: number;
  isOutOfStock: boolean;
  isPreOrder?: boolean;
  alertType: "STOCK_AVAILABLE" | "PRICE_DROP" | "CONFIRMATION";
  productUrl?: string;
}

/**
 * Creates or retrieves a configured nodemailer transporter.
 * Supports standard SMTP (Gmail, Outlook, Brevo, Resend SMTP, etc.)
 * If no SMTP credentials exist in environment variables, it creates a test account or safe sandbox.
 */
async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    if (host.includes("gmail")) {
      return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user, pass },
      });
    }
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback: Create ethereal test account for local testing if not configured
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    // If offline or network issues, create a json transport
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
}

/**
 * Renders a formal, high-conversion HTML email template with OmniCollector branding.
 */
export function buildAlertEmailHtml(params: AlertEmailParams): string {
  const {
    recipientEmail,
    recipientName = "Estimado(a) Coleccionista",
    productName,
    productSku,
    productPrice,
    productOriginalPrice,
    isOutOfStock,
    isPreOrder,
    alertType,
    productUrl = "https://omnicollector.cl/catalog",
  } = params;

  const formattedPrice = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(productPrice);

  const formattedOriginalPrice = productOriginalPrice
    ? new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
      }).format(productOriginalPrice)
    : null;

  let badgeColor = "#1F3A5F";
  let badgeText = "Alerta Registrada";
  let subjectHeadline = "Hemos registrado tu alerta de producto";
  let messageBody = `Te confirmamos que nos has solicitado notificarte inmediatamente cuando tengamos novedades sobre el inventario o promociones de este artículo.`;

  if (alertType === "CONFIRMATION") {
    badgeColor = "#2E9E5B";
    badgeText = isOutOfStock ? "Aviso de Reabastecimiento Activado" : "Aviso de Ofertas & Stock Activado";
    subjectHeadline = isOutOfStock
      ? "Confirmación: Te avisaremos cuando haya stock"
      : "Confirmación: Te avisaremos ante bajas de precio u ofertas";
    messageBody = isOutOfStock
      ? `Hemos registrado con éxito tu solicitud para <strong>${productName}</strong>. En cuanto recibamos nuevas unidades desde nuestros proveedores oficiales o distribuidores autorizados, recibirás un correo prioritario antes de que se agoten.`
      : `Hemos registrado con éxito tu solicitud para <strong>${productName}</strong>. Te mantendremos informado de forma prioritaria en caso de variaciones de precio, campañas de descuento o disponibilidad inmediata.`;
  } else if (alertType === "STOCK_AVAILABLE") {
    badgeColor = "#2E9E5B";
    badgeText = "¡Stock Disponible!";
    subjectHeadline = `¡Nuevas unidades disponibles: ${productName}!`;
    messageBody = `¡Buenas noticias! El producto que estabas esperando ya cuenta con unidades disponibles en nuestro inventario para despacho a todo Chile o reserva oficial.`;
  } else if (alertType === "PRICE_DROP") {
    badgeColor = "#FF6B35";
    badgeText = "¡Bajada de Precio / Descuento Especial!";
    subjectHeadline = `¡Oportunidad de colección: ${productName} tiene descuento!`;
    messageBody = `El producto que sigues ha entrado en una promoción especial en OmniCollector. Aprovecha las unidades con valor promocional antes de que expire la campaña.`;
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectHeadline}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F4F6F8;
      color: #1A1A1A;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F4F6F8;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1F3A5F 0%, #152842 100%);
      padding: 28px 30px;
      text-align: center;
      border-bottom: 3px solid #FF6B35;
    }
    .logo-title {
      font-size: 22px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .logo-title span {
      color: #FF6B35;
    }
    .logo-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .content {
      padding: 32px 30px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      background-color: ${badgeColor};
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      color: #0F172A;
      margin: 0 0 16px 0;
      font-weight: 800;
      line-height: 1.3;
    }
    p {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin: 0 0 18px 0;
    }
    .product-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .product-title {
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;
      margin: 0 0 6px 0;
    }
    .product-sku {
      font-family: monospace;
      font-size: 12px;
      color: #64748B;
      margin: 0 0 14px 0;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .current-price {
      font-size: 22px;
      font-weight: 900;
      color: #0F172A;
    }
    .original-price {
      font-size: 14px;
      color: #94A3B8;
      text-decoration: line-through;
    }
    .btn-cta {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background-color: #FF6B35;
      color: #FFFFFF !important;
      text-align: center;
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      margin: 25px 0 10px 0;
      transition: background-color 0.2s;
    }
    .footer {
      background-color: #F1F5F9;
      padding: 24px 30px;
      border-top: 1px solid #E2E8F0;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
    .footer-highlight {
      font-weight: 600;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo-title">OMNI<span>COLLECTOR</span></div>
        <div class="logo-sub">Chile • Nicho Coleccionista & Gaming</div>
      </div>

      <!-- Content -->
      <div class="content">
        <div class="badge">${badgeText}</div>
        <h1>${subjectHeadline}</h1>
        <p>Estimado(a) <strong>${recipientName}</strong>,</p>
        <p>${messageBody}</p>

        <!-- Product Card Box -->
        <div class="product-box">
          <div class="product-title">${productName}</div>
          <div class="product-sku">SKU: ${productSku} | Destinatario: ${recipientEmail}</div>
          <div class="price-row">
            <span class="current-price">${formattedPrice}</span>
            ${formattedOriginalPrice ? `<span class="original-price">${formattedOriginalPrice}</span>` : ""}
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748B;">
            ${isOutOfStock ? "● Estado actual: Agotado / Notificación Prioritaria Activa" : "● Estado actual: Disponible en catálogo"}
          </p>
        </div>

        <a href="${productUrl}" class="btn-cta" target="_blank">
          Ver Ficha del Producto en la Tienda
        </a>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-highlight">OmniCollector Chile</div>
        <div>Envíos a todo Chile vía Starken y Chilexpress | Productos 100% Originales y Licenciados</div>
        <div style="margin-top: 8px;">
          Atención y Soporte WhatsApp: <a href="https://wa.me/56958243917" style="color: #FF6B35; text-decoration: none; font-weight: bold;">+56 9 5824 3917</a>
        </div>
        <div style="margin-top: 12px; font-size: 11px; color: #94A3B8;">
          Recibes este correo porque te suscribiste a las alertas de stock o precio para este artículo en omnicollector.cl. Si no realizaste esta solicitud, puedes ignorar este mensaje.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends the alert confirmation email.
 */
export async function sendProductAlertEmail(params: AlertEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}> {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"OmniCollector Chile" <notificaciones@omnicollector.cl>';

    const subject =
      params.alertType === "STOCK_AVAILABLE"
        ? `[OmniCollector] ¡Stock Disponible para ${params.productName}!`
        : params.alertType === "PRICE_DROP"
        ? `[OmniCollector] ¡Oferta Especial en ${params.productName}!`
        : `[OmniCollector] Alerta confirmada: ${params.productName}`;

    const htmlContent = buildAlertEmailHtml(params);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.recipientEmail,
      subject,
      html: htmlContent,
    });

    let previewUrl: string | undefined;
    try {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) previewUrl = url;
    } catch {
      // Ignore if not a test account
    }

    console.log(`[EmailService] Alert email dispatched to ${params.recipientEmail}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err: any) {
    console.error("[EmailService] Error dispatching alert email:", err);
    const isGoogleAuthError =
      err?.code === "EAUTH" || err?.responseCode === 534 || String(err?.message || "").includes("534");
    return {
      success: false,
      error: isGoogleAuthError
        ? "Google bloqueó el acceso SMTP (Error 534 WebLoginRequired). Debes habilitar la Verificación en 2 pasos y crear una 'Contraseña de Aplicación' en https://myaccount.google.com/apppasswords"
        : err.message || "Error al despachar el correo",
    };
  }
}
