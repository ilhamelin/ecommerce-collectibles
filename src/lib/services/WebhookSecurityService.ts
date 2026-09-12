import crypto from "crypto";
import { WebhookSignatureError } from "../errors/DomainErrors";
import { PaymentWebhookPayloadDTO, PaymentWebhookPayloadSchema } from "../validations/schemas";

export class WebhookSecurityService {
  /**
   * Verifies an HMAC-SHA256 signature using timing-safe comparison to prevent timing attacks.
   *
   * @param rawBody Raw request body as string
   * @param signatureHeader Signature passed in headers (e.g. stripe-signature, x-signature)
   * @param secret Shared webhook signing secret
   * @param provider Provider identifier for contextual logging
   */
  public static verifyHmacSignature(
    rawBody: string,
    signatureHeader: string,
    secret: string,
    provider: "STRIPE" | "MERCADO_PAGO" | "WEBPAY" = "STRIPE"
  ): boolean {
    if (!rawBody || !signatureHeader || !secret) {
      throw new WebhookSignatureError(provider);
    }

    try {
      // Calculate expected signature using HMAC SHA-256
      const computedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("hex");

      // Extract raw hex if header has format "t=...,v1=..." or "sha256=..."
      let incomingSig = signatureHeader;
      if (signatureHeader.includes("v1=")) {
        const parts = signatureHeader.split(",");
        const v1Part = parts.find((p) => p.trim().startsWith("v1="));
        if (v1Part) {
          incomingSig = v1Part.trim().substring(3);
        }
      } else if (signatureHeader.startsWith("sha256=")) {
        incomingSig = signatureHeader.substring(7);
      }

      const expectedBuffer = Buffer.from(computedSignature, "utf8");
      const incomingBuffer = Buffer.from(incomingSig, "utf8");

      if (expectedBuffer.length !== incomingBuffer.length) {
        throw new WebhookSignatureError(provider);
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, incomingBuffer);
      if (!isValid) {
        throw new WebhookSignatureError(provider);
      }

      return true;
    } catch (err) {
      if (err instanceof WebhookSignatureError) throw err;
      throw new WebhookSignatureError(provider);
    }
  }

  /**
   * Validates and parses raw webhook payload against the domain schema
   */
  public static parseAndValidatePayload(rawPayload: unknown): PaymentWebhookPayloadDTO {
    return PaymentWebhookPayloadSchema.parse(rawPayload);
  }
}
