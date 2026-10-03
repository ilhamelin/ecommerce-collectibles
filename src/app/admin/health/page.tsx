"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw, ShieldCheck, Server } from "lucide-react";
import type { SystemHealth } from "@/lib/services/systemHealth";
export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealth | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/health", { cache: "no-store", signal });
      const body = await res.json() as { success: boolean; data?: SystemHealth; error?: string };
      if (!res.ok || !body.success || !body.data) throw new Error(body.error || "No se pudo comprobar el sistema.");
      if (!signal?.aborted) setData(body.data);
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "No se pudo comprobar el sistema."); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[#FF6B35] tracking-widest">Infraestructura y operaciones</p><h1 className="text-3xl font-black text-[#1F3A5F] flex items-center gap-3"><Activity aria-hidden className="w-7 h-7" />Salud del sistema</h1><p className="text-sm text-slate-600 mt-2">Disponibilidad comprobada, configuración y errores registrados.</p></div><button disabled={busy} onClick={() => void load()} className="rounded-xl bg-[#FF6B35] text-white px-5 py-3 font-bold disabled:opacity-50 flex gap-2"><RefreshCw className={busy ? "animate-spin w-4" : "w-4"} aria-hidden />{busy ? "Comprobando…" : "Actualizar"}</button></header>
    {error && <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800 border border-red-200">{error}{data ? " Se conserva la comprobación anterior." : ""}</p>}
    {!data && busy && <p role="status">Comprobando el sistema…</p>}
    {data && <><section className="rounded-3xl bg-[#11283F] text-white p-6 space-y-3"><h2 className="font-bold flex gap-2"><ShieldCheck aria-hidden className="w-5" />Estado de protección IA</h2><p>App Check: <strong>{data.protection?.appCheckMode === "enforce" ? "Exigido" : data.protection ? "Observación" : "No disponible"}</strong> · Cuotas: {data.protection?.durable ? "Persistentes" : "No confirmadas"}</p>{data.protection && <p>{data.protection.usage.requests} / {data.protection.limits.global} consultas · {data.protection.usage.tokens.toLocaleString("es-CL")} tokens reservados · {data.protection.usage.unchecked} sin verificación válida</p>}<p className="text-xs text-white/70">Los tokens son reservas preventivas. Los proveedores externos se muestran por configuración; esta revisión no ejecuta cobros, IA ni envío de correo.</p><p className="text-xs">Comprobado: {new Date(data.checkedAt).toLocaleString("es-CL")}</p></section>
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Servicios">{data.services.map(item => <article key={item.id} className="rounded-2xl border bg-white shadow-sm p-5 space-y-3"><div className="flex justify-between gap-2"><h2 className="font-bold text-[#1F3A5F] flex gap-2"><Server className="w-4" aria-hidden />{item.name}</h2><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "ok" ? "bg-emerald-50 text-emerald-800" : item.status === "error" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{item.id === "firestore" ? item.status === "ok" ? "Conectado" : "No disponible" : item.status === "ok" ? "Configurado" : "Revisar"}</span></div><p className="text-sm font-semibold">{item.mode}</p><p className="text-sm text-slate-600">{item.detail}</p>{item.latencyMs !== undefined && <p className="text-xs text-slate-500">Lectura: {item.latencyMs} ms</p>}</article>)}</section>
    <section className="rounded-2xl border bg-white p-6 space-y-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-bold text-[#1F3A5F]">Incidencias recientes de APIs</h2><Link className="text-sm text-[#FF6B35] underline" href="/admin/api-usage">Ver telemetría</Link></div>{!data.telemetryAvailable ? <p role="status">No se pudo consultar la telemetría.</p> : data.incidents.length === 0 ? <p className="text-slate-600">Sin errores en los registros recientes consultados de hoy. Esto no representa un porcentaje de uptime.</p> : data.incidents.map(item => <div key={item.id} className="rounded-xl bg-red-50 p-3 text-sm flex flex-wrap gap-3 justify-between"><span>{item.provider} · {item.feature} · HTTP {item.statusCode}</span><time>{new Date(item.timestamp).toLocaleString("es-CL")}</time></div>)}</section></>}
  </div>;
}
