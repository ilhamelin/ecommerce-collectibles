import { adminDb } from "@/lib/firebase/admin";
import { getTelemetrySummary } from "./apiTelemetryService";
import { readAiProtectionStatus } from "./aiProtection";
export type HealthItem = { id: string; name: string; status: "ok" | "warning" | "error"; mode: string; detail: string; latencyMs?: number };
/** Configuration is not a live probe of an external provider. No secrets leave this service. */
export function configuredServices(env: Record<string, string | undefined>): HealthItem[] {
  const configured = (value?: string) => !!value?.trim() && !value.includes("YOUR_");
  const mp = configured(env.MERCADOPAGO_ACCESS_TOKEN);
  const flow = configured(env.FLOW_API_KEY) && configured(env.FLOW_SECRET_KEY);
  return [
    { id: "gemini", name: "Gemini IA", configured: configured(env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.NEXT_PUBLIC_GEMINI_API_KEY), mode: "Configuración" },
    { id: "mercadopago", name: "Mercado Pago", configured: mp, mode: mp ? env.MERCADOPAGO_SANDBOX_MODE !== "false" || env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST-") ? "Sandbox" : "Producción" : "No disponible" },
    { id: "mercadopago-webhook", name: "Firma de Mercado Pago", configured: configured(env.MERCADOPAGO_WEBHOOK_SECRET), mode: "Notificaciones firmadas" },
    { id: "flow", name: "Flow / Webpay", configured: flow, mode: flow ? env.FLOW_SANDBOX_MODE !== "false" ? "Sandbox" : "Producción" : "No disponible" },
    { id: "aftership", name: "AfterShip", configured: configured(env.AFTERSHIP_API_KEY), mode: configured(env.AFTERSHIP_API_KEY) ? "Configuración" : "Seguimiento simulado" },
    { id: "smtp", name: "Correo SMTP", configured: configured(env.SMTP_HOST) && configured(env.SMTP_USER) && configured(env.SMTP_PASS), mode: "Configuración" },
    { id: "appcheck", name: "App Check", configured: configured(env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY), mode: env.FIREBASE_APPCHECK_MODE || "monitor" },
  ].map(item => ({ id: item.id, name: item.name, status: item.configured ? "ok" : "warning", mode: item.mode, detail: item.configured ? "Configurado. No se ha probado la conexión externa en esta revisión." : "Configuración incompleta. No se confirma conexión real." }));
}
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), 4000); })]); }
  finally { if (timer) clearTimeout(timer); }
}
export async function getSystemHealth() {
  const start = Date.now();
  const [database, protection, telemetry] = await Promise.allSettled([
    bounded(adminDb ? adminDb.collection("products").limit(1).get().then(() => Date.now() - start) : Promise.reject(new Error("unconfigured"))),
    bounded(readAiProtectionStatus()), bounded(getTelemetrySummary("today")),
  ]);
  const services = configuredServices(process.env);
  services.unshift({ id: "firestore", name: "Firestore", status: database.status === "fulfilled" ? "ok" : "error", mode: "Lectura comprobada", detail: database.status === "fulfilled" ? "Lectura de catálogo confirmada; no se realizaron escrituras." : "No se pudo confirmar una lectura de Firestore.", ...(database.status === "fulfilled" ? { latencyMs: database.value } : {}) });
  const incidents = telemetry.status === "fulfilled" ? telemetry.value.recentLogs.filter(log => !log.success && log.feature !== "TEST_SIMULATION").slice(0, 10).map(log => ({ id: log.id, provider: log.provider, feature: log.feature, statusCode: log.statusCode, timestamp: log.timestamp })) : [];
  return { checkedAt: new Date().toISOString(), services, protection: protection.status === "fulfilled" ? protection.value : null, telemetryAvailable: telemetry.status === "fulfilled", incidents };
}
export type SystemHealth = Awaited<ReturnType<typeof getSystemHealth>>;
