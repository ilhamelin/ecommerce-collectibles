import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAppCheck } from "firebase-admin/app-check";
import { adminDb, adminApp } from "@/lib/firebase/admin";
import { requestIdentity } from "@/lib/auth/requestIdentity";

export class AiProtectionError extends Error {
  constructor(message: string, public status = 429) { super(message); this.name = "AiProtectionError"; }
}
type Usage = { requests: number; tokens: number; blocked: number; unchecked: number };
type Context = { actor: string; feature: string; attempts: number };
const context = new AsyncLocalStorage<Context>();
const local = new Map<string, Usage>();
const empty = (): Usage => ({ requests: 0, tokens: 0, blocked: 0, unchecked: 0 });
const limit = (name: string, fallback: number) => {
  const value = Number(process.env[name]); return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};
export const aiLimits = () => ({
  user: limit("AI_USER_DAILY_REQUESTS", 40), guest: limit("AI_GUEST_DAILY_REQUESTS", 12),
  global: limit("AI_GLOBAL_DAILY_REQUESTS", 300), tokens: limit("AI_GLOBAL_DAILY_TOKENS", 2_000_000),
});
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
/** Daily global and caller reservations share one transaction across serverless instances. */
export async function reserveAiUsage(actor: string, authenticated: boolean, estimatedTokens: number, unchecked: boolean) {
  const day = new Date().toISOString().slice(0, 10);
  const ids = [day + "-global", day + "-" + hash(actor)];
  const limits = aiLimits();
  const decide = (global: Usage, caller: Usage) => {
    const denied = global.requests >= limits.global || global.tokens + estimatedTokens > limits.tokens ||
      caller.requests >= (authenticated ? limits.user : limits.guest);
    if (denied) global.blocked += 1;
    else {
      global.requests++; global.tokens += estimatedTokens; caller.requests++; caller.tokens += estimatedTokens;
      if (unchecked) global.unchecked++;
    }
    return { global, caller, denied };
  };
  let denied: boolean;
  if (adminDb) {
    const refs = ids.map(id => adminDb!.collection("ai_quotas").doc(id));
    denied = await adminDb.runTransaction(async tx => {
      const snapshots = await tx.getAll(...refs);
      const state = decide({ ...empty(), ...snapshots[0].data() }, { ...empty(), ...snapshots[1].data() });
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      tx.set(refs[0], { ...state.global, day, expiresAt });
      if (!state.denied) tx.set(refs[1], { ...state.caller, day, expiresAt });
      return state.denied;
    });
  } else {
    if (process.env.NODE_ENV === "production") throw new AiProtectionError("La IA está temporalmente pausada: no se pudo verificar su cuota persistente.", 503);
    const state = decide({ ...empty(), ...local.get(ids[0]) }, { ...empty(), ...local.get(ids[1]) });
    local.set(ids[0], state.global); if (!state.denied) local.set(ids[1], state.caller);
    denied = state.denied;
    if (local.size > 1000) for (const key of local.keys()) if (!key.startsWith(day)) local.delete(key);
  }
  if (denied) throw new AiProtectionError("Se alcanzó el límite diario de IA. Puedes seguir usando el catálogo y volver a intentarlo mañana.");
}

/** Validates App Check before streamed responses; monitor mode preserves an unconfigured site. */
export function withAiProtection(feature: string, handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const mode = (process.env.FIREBASE_APPCHECK_MODE || "monitor").trim().toLowerCase();
      if (!["monitor", "enforce"].includes(mode)) throw new AiProtectionError("La configuración de protección IA no es válida.", 503);
      let checked = false;
      const token = request.headers.get("X-Firebase-AppCheck");
      if (token && adminApp) {
        try { await getAppCheck(adminApp).verifyToken(token); checked = true; } catch { checked = false; }
      }
      if (mode === "enforce" && !checked) throw new AiProtectionError("No se pudo verificar la protección de la aplicación. Actualiza la página y reintenta.", 403);
      const identity = await requestIdentity(request);
      // Vercel controls this header. Outside Vercel use Next's server-provided address.
      const address = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : request.ip || "local";
      const actor = identity ? "user:" + (identity.uid || identity.email) : "guest:" + address;
      // Reserve three bounded provider attempts, including text and image input estimates.
      await reserveAiUsage(actor, !!identity, 48_000, !checked);
      return await context.run({ actor, feature, attempts: 0 }, () => handler(request));
    } catch (error: unknown) {
      if (error instanceof AiProtectionError) return NextResponse.json({ success: false, error: error.message, code: "AI_PROTECTION" }, { status: error.status, headers: { "Cache-Control": "no-store" } });
      console.error("[AI Protection] Verification unavailable");
      return NextResponse.json({ success: false, error: "No se pudo verificar el acceso a IA. Intenta nuevamente." }, { status: 503 });
    }
  };
}
/** Bounds fallback model attempts and output size. A reservation is charged even on failure. */
export async function protectedAiFetch(url: string, options: RequestInit) {
  const current = context.getStore();
  if (current && ++current.attempts > 3) throw new AiProtectionError("Se alcanzó el máximo de intentos para esta consulta. Intenta nuevamente.", 503);
  const body = typeof options.body === "string" ? JSON.parse(options.body) as { generationConfig?: { maxOutputTokens?: number } } : null;
  if (body) {
    body.generationConfig = { ...body.generationConfig, maxOutputTokens: Math.min(body.generationConfig?.maxOutputTokens || 8192, 8192) };
    options = { ...options, body: JSON.stringify(body) };
  }
  return fetch(url, options);
}
export async function readAiProtectionStatus() {
  const day = new Date().toISOString().slice(0, 10);
  const usage = adminDb ? (await adminDb.collection("ai_quotas").doc(day + "-global").get()).data() : local.get(day + "-global");
  return { day, limits: aiLimits(), usage: { ...empty(), ...usage }, durable: !!adminDb, appCheckMode: process.env.FIREBASE_APPCHECK_MODE || "monitor" };
}
