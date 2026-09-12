import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { WebhookSecurityService } from "../src/lib/services/WebhookSecurityService";
import { WebhookSignatureError } from "../src/lib/errors/DomainErrors";

describe("Webhook Cryptographic Security (HMAC-SHA256 & Timing-Safe)", () => {
  const webhookSecret = "whsec_test_super_secret_collectibles_key_2026";
  const rawBody = JSON.stringify({
    provider: "STRIPE",
    eventId: "evt_123456",
    transactionId: "txn_78910",
    orderId: "ord-test-makima",
    amount: 50.0,
    status: "succeeded",
    timestamp: Date.now(),
  });

  it("should successfully verify valid HMAC-SHA256 signature", () => {
    const validSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    const header = `t=1725900000,v1=${validSignature}`;
    const isValid = WebhookSecurityService.verifyHmacSignature(rawBody, header, webhookSecret, "STRIPE");

    expect(isValid).toBe(true);
  });

  it("should reject tampered payload or invalid signature with WebhookSignatureError", () => {
    const fakeSignature = "bad_signature_00000000000000000000000000000000000000000000000000000000";
    const header = `v1=${fakeSignature}`;

    expect(() => {
      WebhookSecurityService.verifyHmacSignature(rawBody, header, webhookSecret, "STRIPE");
    }).toThrowError(WebhookSignatureError);
  });
});
