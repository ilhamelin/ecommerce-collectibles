import { createHmac, timingSafeEqual } from "node:crypto";
/** Mercado Pago signs the manifest, not the JSON body. IDs must match the queried payment. */
export function verifyMercadoPagoSignature(dataId: string, requestId: string | null, signature: string | null, secret: string | undefined): boolean {
  if (!secret?.trim() || !requestId || !signature || !/^[a-zA-Z0-9_-]{1,150}$/.test(dataId) || !/^[a-zA-Z0-9_-]{1,150}$/.test(requestId)) return false;
  const parts = signature.split(",").map(value => value.trim());
  const ts = parts.find(value => value.startsWith("ts="))?.slice(3); const hash = parts.find(value => value.startsWith("v1="))?.slice(3);
  if (!ts || !/^\d{10,13}$/.test(ts) || !hash || !/^[a-fA-F0-9]{64}$/.test(hash)) return false;
  const expected = createHmac("sha256", secret.trim()).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest();
  return timingSafeEqual(expected, Buffer.from(hash, "hex"));
}
