"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, History, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
type Audit = { id: string; actor: string; at: string; action: string; collection: string; documentId: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null };
type Data = { audit: Audit[]; protection: { day: string; durable: boolean; appCheckMode: string; limits: { global: number; tokens: number; user: number; guest: number }; usage: { requests: number; tokens: number; blocked: number; unchecked: number } } };
export default function SecurityPage() {
  const [data, setData] = useState<Data>(); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); setError(""); try {
    const response = await fetch("/api/admin/history", { cache: "no-store" }); const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || "No se pudo cargar el historial."); setData(body.data);
  } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cargar el historial."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  return <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16}/>Control y trazabilidad</p><h1 className="text-3xl font-black text-[#1F3A5F] mt-2">Seguridad e historial</h1><p className="text-sm text-slate-600 mt-2">Cambios confirmados por el servidor y protección de las consultas IA.</p></div><Button disabled={loading} onClick={load}><RefreshCw size={16} className={loading ? "animate-spin" : ""}/>Actualizar</Button></header>
    {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">{error}</p>}
    {loading && <p role="status">Consultando registros…</p>}
    {data && <><section className="rounded-3xl bg-[#10253D] text-white p-6 space-y-5"><h2 className="font-bold text-xl flex items-center gap-2"><Cpu size={20}/>Protección de IA · {data.protection.day} UTC</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[
      ["Consultas del día", data.protection.usage.requests + " / " + data.protection.limits.global],
      ["Tokens reservados", data.protection.usage.tokens.toLocaleString("es-CL") + " / " + data.protection.limits.tokens.toLocaleString("es-CL")],
      ["Consultas bloqueadas", data.protection.usage.blocked], ["App Check", data.protection.appCheckMode === "enforce" ? "Exigido" : "Observación"],
    ].map(([title, value]) => <div key={title} className="rounded-2xl border border-white/15 p-4"><p className="text-xs text-slate-300">{title}</p><strong className="text-xl block mt-2">{value}</strong></div>)}</div><p className="text-xs text-slate-300 leading-relaxed">Cuotas persistentes: {data.protection.durable ? "activas" : "no disponibles"}. Por día: {data.protection.limits.user} consultas por cuenta y {data.protection.limits.guest} por visitante/IP. Cada consulta reserva hasta 48.000 tokens para cubrir tres intentos; este contador es preventivo y no representa facturación. Consultas sin App Check válido: {data.protection.usage.unchecked}.</p></section>
    <section className="space-y-4"><h2 className="text-xl font-bold text-[#1F3A5F] flex items-center gap-2"><History size={20}/>Últimos 50 cambios</h2>{!data.audit.length && <p className="bg-white border rounded-2xl p-6">Todavía no hay cambios registrados. Los próximos guardados aparecerán aquí.</p>}{data.audit.map(entry => <article key={entry.id} className="bg-white border rounded-2xl p-5 space-y-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-[#1F3A5F]">{entry.action} · {entry.collection}/{entry.documentId}</strong><time className="text-xs text-slate-500">{new Date(entry.at).toLocaleString("es-CL")}</time></div><p className="text-sm">Administrador: {entry.actor}</p><p className="text-xs text-slate-600">Campos cambiados: {Array.from(new Set([...Object.keys(entry.before || {}), ...Object.keys(entry.after || {})])).filter(key => JSON.stringify(entry.before?.[key]) !== JSON.stringify(entry.after?.[key])).join(", ") || "Sin diferencias"}</p><details><summary className="cursor-pointer text-sm font-semibold text-[#FF6B35]">Ver antes y después</summary><div className="grid md:grid-cols-2 gap-3 mt-3">{[["Antes", entry.before], ["Después", entry.after]].map(([name, value]) => <div key={String(name)}><p className="text-xs font-bold">{String(name)}</p><pre className="text-xs overflow-auto max-h-72 bg-slate-50 rounded-xl p-3 mt-2">{JSON.stringify(value, null, 2)}</pre></div>)}</div></details></article>)}</section></>}
  </div>;
}
