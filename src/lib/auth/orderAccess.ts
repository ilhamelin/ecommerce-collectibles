import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { requestIdentity } from "./requestIdentity";
const localKey = "local-order-receipt-only-not-a-production-credential";
function receiptKey() {
  const session = process.env.ADMIN_SESSION_SECRET;
  const serviceKey = process.env.FIREBASE_PRIVATE_KEY;
  const secret = session && session.length >= 32 ? session : serviceKey && serviceKey.length >= 128 ? serviceKey : process.env.NODE_ENV !== "production" ? localKey : "";
  return secret ? createHash("sha256").update("omni-order-read:" + secret).digest() : null;
}
/** A guest receipt grants read access to exactly the server-created order, not admin authority. */
export function signOrderReceipt(id: string, lifetimeSeconds = 48 * 3600) {
  const key = receiptKey(); if (!key) return null;
  const payload = Buffer.from(JSON.stringify({ id, exp: Math.floor(Date.now() / 1000) + lifetimeSeconds })).toString("base64url");
  return payload + "." + createHmac("sha256", key).update(payload).digest("base64url");
}
export function verifyOrderReceipt(token: string | undefined, id: string) {
  const key = receiptKey(); if (!token || !key || token.length > 1024) return false;
  try {
    const [payload, signature, extra] = token.split("."); if (!payload || !signature || extra) return false;
    const expected = createHmac("sha256", key).update(payload).digest(); const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { id?: unknown; exp?: unknown };
    return data.id === id && typeof data.exp === "number" && Number.isFinite(data.exp) && data.exp > Date.now() / 1000;
  } catch { return false; }
}
export async function canReadOrder(request: NextRequest, order: { id: string; customer: { email: string } }) {
  const identity = await requestIdentity(request);
  return identity?.admin === true || (!!identity?.email && identity.email === order.customer.email.toLowerCase()) ||
    verifyOrderReceipt(request.cookies.get("omni_order_access")?.value, order.id);
}
