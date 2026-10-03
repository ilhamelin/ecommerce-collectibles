"use client";
import React, { useEffect, useState } from "react";
import { History, Save, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/components/home/EditorialHero";
import { HomeHeroSettingsSchema, type HomeHeroProduct } from "@/lib/constants/homeHeroDefaults";
type Version = { id: string; section: string; name: string; actor: string; at: string; payload: Record<string, unknown> };
const sections = { portada: "Portada de inicio", marca: "Marca y logo", carrusel: "Carrusel", anuncios: "Barra de anuncios", laterales: "Banners laterales" };
export default function VersionsPage() {
  const [versions, setVersions] = useState<Version[]>([]); const [products, setProducts] = useState<HomeHeroProduct[]>([]);
  const [section, setSection] = useState("portada"); const [name, setName] = useState(""); const [selected, setSelected] = useState<Version>();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/visual-versions", { cache: "no-store" }); const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "No se pudieron cargar las versiones."); setVersions(body.data);
      const hero = await fetch("/api/admin/home-hero", { cache: "no-store" }); const details = await hero.json();
      if (hero.ok) setProducts(details.data.products);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo cargar el historial."); } finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  async function action(body: object) {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/visual-versions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error || "No se pudo guardar la versión.");
      setMessage("Cambio confirmado y guardado en Firestore."); setName(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo completar el cambio."); } finally { setBusy(false); }
  }
  const settings = HomeHeroSettingsSchema.safeParse(selected?.payload.settings);
  const branding = selected?.payload.branding as { titlePrefix?: string; titleHighlight?: string; subtitle?: string; logoImageUrl?: string } | undefined;
  return <div className="max-w-7xl mx-auto px-4 py-10 space-y-7"><header className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#FF6B35]">Personalización Visual</p><h1 className="mt-2 text-3xl font-black text-[#1F3A5F] flex items-center gap-3"><History/>Versiones y campañas</h1><p className="mt-2 text-sm text-slate-600">Cada guardado crea una versión. Conserva campañas con nombre y recupera un diseño anterior.</p></div><Button onClick={load} disabled={busy}><RefreshCw size={16}/>Actualizar</Button></header>
    {error && <p role="alert" className="p-4 rounded-2xl border border-red-200 bg-red-50">{error}</p>}{message && <p role="status" className="p-4 rounded-2xl bg-emerald-50 text-emerald-800">{message}</p>}
    <form onSubmit={event => { event.preventDefault(); void action({ action: "capture", section, name }); }} className="flex flex-wrap gap-3 bg-white p-5 rounded-2xl border">
      <label className="grid gap-1 text-sm">Sección<select className="rounded-xl border p-3" value={section} disabled={busy} onChange={event => { setSection(event.target.value); setSelected(undefined); }}>{Object.entries(sections).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="grid gap-1 text-sm flex-1 min-w-[180px]">Nombre de campaña<input className="rounded-xl border p-3" value={name} maxLength={80} required disabled={busy} onChange={event => setName(event.target.value)} placeholder="Ej. Especial Halloween"/></label><Button className="self-end" type="submit" disabled={busy || !name.trim()}><Save size={16}/>Guardar versión actual</Button>
    </form><div className="grid lg:grid-cols-[320px_1fr] gap-6"><section className="space-y-3"><h2 className="font-bold text-[#1F3A5F]">Versiones recientes</h2>{busy && <p role="status">Consultando…</p>}{!busy && !versions.filter(v => v.section === section).length && <p className="rounded-2xl border bg-white p-5 text-sm">Guarda esta sección desde su editor para crear la primera versión.</p>}{versions.filter(v => v.section === section).map(version => <button key={version.id} type="button" onClick={() => setSelected(version)} aria-pressed={selected?.id === version.id} className={"text-left w-full rounded-2xl border p-4 " + (selected?.id === version.id ? "bg-[#1F3A5F] text-white" : "bg-white text-[#1F3A5F]")}><strong className="block">{version.name}</strong><time className="text-xs block mt-1">{new Date(version.at).toLocaleString("es-CL")}</time><span className="text-xs block mt-1 break-all">{version.actor}</span></button>)}</section>
    <section className="min-w-0 rounded-3xl border bg-white p-5 space-y-5"><h2 className="font-bold text-xl text-[#1F3A5F]">Vista de la versión</h2>{!selected ? <p className="text-sm text-slate-600 py-12 text-center">Selecciona una versión para revisar su contenido.</p> : <><p className="text-sm">Esta vista usa el catálogo actual. Los productos eliminados no se recuperan.</p>{selected.section === "portada" && settings.success ? <div className="[&_.editorial-hero]:grid-cols-1 [&_.editorial-hero]:px-0 [&_.editorial-hero]:py-0 [&_.editorial-hero_h3]:text-3xl"><EditorialHero settings={settings.data} products={products} preview/></div> : selected.section === "marca" && branding ? <div className="rounded-2xl bg-[#1F3A5F] text-white p-8 flex items-center gap-4">{branding.logoImageUrl && <img alt="Logo de esta versión" src={branding.logoImageUrl} className="w-16 h-16 object-contain"/>}<div><strong className="text-2xl">{branding.titlePrefix}<span className="text-[#FF6B35]">{branding.titleHighlight}</span></strong><p className="text-xs mt-1">{branding.subtitle}</p></div></div> : <pre className="max-h-96 overflow-auto text-xs rounded-2xl bg-slate-50 p-5">{JSON.stringify(selected.payload, null, 2)}</pre>}
      <details><summary className="text-sm font-semibold cursor-pointer">Recuperar este diseño</summary><p className="text-sm text-slate-600 my-3">Se aplicará a la tienda y se creará una nueva versión del cambio. La versión actual seguirá en el historial.</p><Button disabled={busy} onClick={() => action({ action: "restore", id: selected.id })}><RotateCcw size={16}/>Confirmar recuperación</Button></details></>}</section></div>
  </div>;
}
