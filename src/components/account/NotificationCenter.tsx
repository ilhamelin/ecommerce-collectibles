"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, RefreshCw, CheckCheck } from "lucide-react";
import { identityHeaders } from "@/lib/auth/clientIdentity";
import type { CustomerNotification } from "@/lib/services/customerNotifications";
type Feed = { items: CustomerNotification[]; unread: number; checkedAt: string };
export function NotificationCenter() {
  const [feed, setFeed] = useState<Feed | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [onlyUnread, setOnlyUnread] = useState(false);
  const load = useCallback(async (ids?: string[], signal?: AbortSignal) => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/users/notifications", { method: ids ? "PATCH" : "GET", headers: { ...await identityHeaders(), ...(ids ? { "Content-Type": "application/json" } : {}) }, ...(ids ? { body: JSON.stringify({ ids }) } : {}), cache: "no-store", signal });
      const body = await res.json() as { success: boolean; data?: Feed; error?: string };
      if (!res.ok || !body.success || !body.data) throw new Error(body.error || "No se pudieron consultar las notificaciones.");
      if (!signal?.aborted) setFeed(body.data);
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "No se pudieron consultar las notificaciones."); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(undefined, controller.signal); return () => controller.abort(); }, [load]);
  const items = feed?.items.filter(item => !onlyUnread || !item.read) || [];
  return <section className="space-y-5"><header className="flex flex-wrap justify-between gap-4"><div><h2 className="text-2xl font-black text-[#1F3A5F] flex gap-2"><Bell aria-hidden className="w-6" />Centro de notificaciones</h2><p className="text-sm text-slate-600 mt-2">Pedidos, preventas y novedades de productos que sigues.</p></div><button onClick={() => void load()} disabled={busy} className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 flex gap-2"><RefreshCw aria-hidden className={busy ? "w-4 animate-spin" : "w-4"} />Actualizar</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">{error}</p>}
    <div className="flex flex-wrap items-center gap-3"><button aria-pressed={onlyUnread} onClick={() => setOnlyUnread(value => !value)} className="rounded-full border px-4 py-2 text-sm font-bold">{onlyUnread ? "Mostrar todas" : `Sin leer (${feed?.unread ?? 0})`}</button><button disabled={busy || !feed?.unread} onClick={() => void load(feed!.items.filter(item => !item.read).map(item => item.id))} className="text-sm font-bold text-[#1F3A5F] disabled:opacity-50 flex gap-2"><CheckCheck aria-hidden className="w-4" />Marcar todas como leídas</button></div>
    {!feed && busy && <p role="status">Cargando notificaciones…</p>}
    {feed && items.length === 0 && <div className="rounded-2xl bg-slate-50 border p-8 text-center text-slate-600">{onlyUnread ? "No tienes notificaciones sin leer." : "Todavía no hay novedades disponibles. Tus pedidos y suscripciones aparecerán aquí."}</div>}
    {items.map(item => <article key={item.id} className={`rounded-2xl border p-5 space-y-2 ${item.read ? "bg-white" : "bg-orange-50 border-orange-200"}`}><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-[#1F3A5F]">{item.title}</h3><span className="text-xs text-slate-500">{item.read ? "Leída" : "Sin leer"} · {new Date(item.at).toLocaleDateString("es-CL")}</span></div><p className="text-sm text-slate-700">{item.message}</p><div className="flex flex-wrap gap-4"><Link href={item.href} className="text-sm font-bold text-[#FF6B35] underline">Ver detalle</Link>{!item.read && <button disabled={busy} className="text-sm underline disabled:opacity-50" onClick={() => void load([item.id])}>Marcar como leída</button>}</div></article>)}
    <p className="text-xs text-slate-500">Se muestran los estados actuales de tus pedidos y cambios respecto a tus suscripciones; no un historial completo de todos los eventos.</p>
  </section>;
}
