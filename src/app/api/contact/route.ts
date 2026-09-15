import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().optional(),
  orderNumber: z.string().optional(),
  subject: z.enum([
    "PREORDER_INQUIRY",
    "TRACKING_STATUS",
    "SERNAC_WARRANTY",
    "WHOLESALE",
    "OTHER",
  ]),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(2000),
  // Honeypot field: must be empty for legitimate human users
  b_fax_field: z.string().optional(),
});

function sanitizeText(str: string): string {
  return str.replace(/<[^>]*>?/gm, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "ValidationError",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Anti-Bot Honeypot verification
    if (data.b_fax_field && data.b_fax_field.trim() !== "") {
      console.warn("[BOT_DETECTED] Honeypot field filled by automated submission");
      // Return 200 to trick the bot while ignoring the submission
      return NextResponse.json({
        success: true,
        message: "Tu mensaje ha sido recibido.",
      });
    }

    // 2. Sanitize fields against XSS/injections
    const sanitizedData = {
      name: sanitizeText(data.name),
      email: data.email.trim().toLowerCase(),
      phone: data.phone ? sanitizeText(data.phone) : "",
      orderNumber: data.orderNumber ? sanitizeText(data.orderNumber) : "",
      subject: data.subject,
      message: sanitizeText(data.message),
      receivedAt: new Date().toISOString(),
    };

    console.log("[CONTACT_MESSAGE_RECEIVED]", {
      from: sanitizedData.email,
      name: sanitizedData.name,
      subject: sanitizedData.subject,
    });

    return NextResponse.json(
      {
        success: true,
        message: "¡Mensaje recibido con éxito! Un especialista te responderá en menos de 2 horas hábiles.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[Contact API Error]", err);
    return NextResponse.json(
      { success: false, error: "InternalError", message: "No se pudo procesar tu mensaje." },
      { status: 500 }
    );
  }
}
