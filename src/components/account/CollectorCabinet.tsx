"use client";

import React, { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Archive, Search, Plus, Pencil, Trash2, RefreshCw, Check, ImageIcon, ArrowUpRight, X } from "lucide-react";
import { identityHeaders } from "@/lib/auth/clientIdentity";
import { collectorCategories, collectorConditions, type CollectorEntry, type CollectorFeed, type CollectorInput, type CollectorKind } from "@/lib/collector/schema";
import type { ProductDomainEntity } from "@/lib/types/domain";
import { formatCLP } from "@/lib/utils/currency";

const emptyEntry = (): CollectorInput => ({ title: "", category: "FIGURE", universe: "", edition: "", condition: "GOOD", photoUrl: "", notes: "", productId: null, maxBudget: null });
const fieldStyle = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400";

export function CollectorCabinet({ kind, products }: { kind: CollectorKind; products: ProductDomainEntity[] | null }) {
  const [feed, setFeed] = useState<CollectorFeed | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<CollectorInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const wanted = kind === "WANTED";

  const request = useCallback(async (method = "GET", body?: unknown, id?: string, signal?: AbortSignal) => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/users/collector" + (id ? "?id=" + encodeURIComponent(id) : ""), {
        method, headers: { ...await identityHeaders(), ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal, cache: "no-store",
      });
      const result = await response.json() as { success: boolean; data?: CollectorFeed; error?: string };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error || "No se pudo guardar. Reintenta.");
      if (!signal?.aborted) { setFeed(result.data); if (method !== "GET") setMessage("Tu lista quedó guardada."); }
      return true;
    } catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "No se pudo conectar con el servidor."); return false; }
    finally { if (!signal?.aborted) setBusy(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void request("GET", undefined, undefined, controller.signal); return () => controller.abort(); }, [request]);

  const pieces = feed?.entries.filter(entry => entry.kind === kind) || [];
  const shown = pieces.filter(entry => (!category || entry.category === category) && (!condition || entry.condition === condition) &&
    [entry.title, entry.universe, entry.edition].join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  const matchesCount = pieces.filter(entry => (feed?.matches[entry.id]?.length || 0) > 0).length;
  const universes = new Set(pieces.map(entry => entry.universe.trim().toLowerCase()).filter(Boolean)).size;
  const catalogOptions = useMemo(() => (products || []).slice().sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const change = <K extends keyof CollectorInput>(key: K, value: CollectorInput[K]) => setDraft(previous => previous && ({ ...previous, [key]: value }));
  function selectProduct(id: string) {
    const product = products?.find(item => item.id === id);
    if (!product) { change("productId", null); return; }
    setDraft(previous => previous && ({ ...previous, productId: product.id, title: product.name,
      photoUrl: product.images?.[0] || "", category: Object.hasOwn(collectorCategories, product.type) ? product.type as CollectorInput["category"] : "OTHER",
    }));
  }
  function edit(entry: CollectorEntry) {
    const { id, kind: _kind, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = entry;
    setEditId(id); setDraft(input); setError(""); setMessage(""); setDeleteId(null);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (await request(editId ? "PATCH" : "POST", { kind, entry: draft, ...(editId ? { id: editId } : {}) })) { setDraft(null); setEditId(null); }
  }
  async function collect(entry: CollectorEntry) {
    const { id, kind: _kind, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = entry;
    if (await request("PATCH", { id, kind: "COLLECTION", entry: { ...input, maxBudget: null } })) setMessage("Pieza trasladada a Mi colección. Puedes editar su estado allí.");
  }

  return <section className="space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#12263B] p-6 sm:p-8 text-white">
      <div aria-hidden className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-orange-500/15 blur-3xl" />
      <p className="relative text-[10px] uppercase tracking-[0.22em] text-orange-300 font-bold">Tu universo coleccionista</p>
      <div className="relative mt-3 flex flex-wrap justify-between gap-4"><div><h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-black">{wanted ? <Search aria-hidden /> : <Archive aria-hidden />}{wanted ? "Busco una pieza" : "Mi colección"}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{wanted ? "Guarda lo que te falta. Te mostramos sugerencias del catálogo cuando haya stock y se ajuste a tu presupuesto." : "Una vitrina privada para las historias que ya tienes. Registra piezas del catálogo o añade las tuyas."}</p></div>
        <button disabled={busy} onClick={() => void request()} aria-label="Actualizar lista" className="self-start rounded-full border border-white/20 p-3 hover:bg-white/10 disabled:opacity-50"><RefreshCw aria-hidden className={busy ? "w-4 h-4 animate-spin" : "w-4 h-4"} /></button></div>
      <div className="relative mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><strong className="block text-2xl">{feed ? pieces.length : "—"}</strong><span className="text-xs text-slate-300">{wanted ? "Piezas que buscas" : "Piezas registradas"}</span></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><strong className="block text-2xl text-orange-300">{feed ? wanted ? matchesCount : universes : "—"}</strong><span className="text-xs text-slate-300">{wanted ? "Búsquedas con sugerencias" : "Universos en tu vitrina"}</span></div></div>
    </header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {feed && !feed.catalogAvailable && wanted && <p className="text-sm text-amber-800 rounded-xl bg-amber-50 p-3">Tu lista está disponible; no pudimos consultar el catálogo. Actualiza para comprobar sugerencias.</p>}
    <div className="flex flex-wrap gap-3 items-center justify-between"><div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="collector-search">Buscar en mi lista</label><input id="collector-search" type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Nombre, universo o edición…" className={fieldStyle + " sm:!w-56"} />
      <label className="sr-only" htmlFor="collector-category">Filtrar categoría</label><select id="collector-category" value={category} onChange={e => setCategory(e.target.value)} className={fieldStyle + " sm:!w-44"}><option value="">Todas las categorías</option>{Object.entries(collectorCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      {!wanted && <><label className="sr-only" htmlFor="collector-condition">Filtrar estado</label><select id="collector-condition" value={condition} onChange={e => setCondition(e.target.value)} className={fieldStyle + " sm:!w-40"}><option value="">Todos los estados</option>{Object.entries(collectorConditions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></>}</div>
      <button disabled={busy || !feed} onClick={() => { setDraft(emptyEntry()); setEditId(null); setDeleteId(null); }} className="inline-flex gap-2 items-center rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus aria-hidden className="w-4 h-4" />{wanted ? "Añadir búsqueda" : "Añadir pieza"}</button></div>

    {draft && <form onSubmit={save} className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5 space-y-4">
      <div className="flex justify-between gap-4"><h3 className="font-bold text-[#1F3A5F]">{editId ? "Editar pieza" : wanted ? "¿Qué pieza quieres encontrar?" : "Añade una historia a tu vitrina"}</h3><button type="button" disabled={busy} onClick={() => { setDraft(null); setEditId(null); }} aria-label="Cerrar formulario"><X aria-hidden className="w-5 h-5" /></button></div>
      <label className="block text-xs font-bold text-slate-600">Vincular producto del catálogo (opcional)<select value={draft.productId || ""} onChange={e => selectProduct(e.target.value)} className={fieldStyle + " mt-1"}><option value="">Pieza propia / sin vincular</option>{draft.productId && !catalogOptions.some(product => product.id === draft.productId) && <option value={draft.productId}>Producto vinculado anteriormente</option>}{catalogOptions.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-xs font-bold text-slate-600">Nombre de la pieza *<input required minLength={2} maxLength={180} value={draft.title} onChange={e => change("title", e.target.value)} className={fieldStyle + " mt-1"} placeholder="Ej. Nendoroid Link Breath of the Wild" /></label>
        <label className="text-xs font-bold text-slate-600">Categoría<select value={draft.category} onChange={e => change("category", e.target.value as CollectorInput["category"])} className={fieldStyle + " mt-1"}>{Object.entries(collectorCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Universo / franquicia<input maxLength={100} value={draft.universe} onChange={e => change("universe", e.target.value)} className={fieldStyle + " mt-1"} placeholder="Ej. The Legend of Zelda" /></label>
        <label className="text-xs font-bold text-slate-600">Edición / versión<input maxLength={100} value={draft.edition} onChange={e => change("edition", e.target.value)} className={fieldStyle + " mt-1"} placeholder="Ej. Deluxe / PS5 / escala 1:7" /></label>
        {wanted ? <label className="text-xs font-bold text-slate-600">Presupuesto máximo en CLP (opcional)<input type="number" min={1} max={100000000} step={1} value={draft.maxBudget ?? ""} onChange={e => change("maxBudget", e.target.value ? Number(e.target.value) : null)} className={fieldStyle + " mt-1"} placeholder="Sin límite indicado" /></label> : <label className="text-xs font-bold text-slate-600">Estado de conservación<select value={draft.condition} onChange={e => change("condition", e.target.value as CollectorInput["condition"])} className={fieldStyle + " mt-1"}>{Object.entries(collectorConditions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
        <label className="text-xs font-bold text-slate-600">URL de la foto (HTTPS)<input maxLength={1500} value={draft.photoUrl} onChange={e => change("photoUrl", e.target.value)} className={fieldStyle + " mt-1"} placeholder="https://…" /></label>
      </div>
      <label className="block text-xs font-bold text-slate-600">Notas personales<textarea rows={3} maxLength={1500} value={draft.notes} onChange={e => change("notes", e.target.value)} className={fieldStyle + " mt-1"} placeholder="Caja, accesorios, dónde la conseguiste o qué versión buscas…" /></label>
      <p className="text-xs text-slate-500">Estos datos son privados. Registrar una pieza no realiza una compra ni modifica el stock de la tienda.</p>
      <button disabled={busy} className="rounded-xl bg-[#1F3A5F] text-white px-5 py-3 text-sm font-bold disabled:opacity-50">{busy ? "Guardando…" : "Guardar pieza"}</button>
    </form>}

    {!feed && busy && <p role="status" className="text-sm text-slate-500">Cargando tu vitrina…</p>}
    {feed && shown.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Archive aria-hidden className="mx-auto mb-4 text-slate-400" /><h3 className="font-bold text-[#1F3A5F]">{pieces.length ? "No hay piezas con estos filtros" : wanted ? "Tu próxima pieza empieza aquí" : "Tu vitrina está esperando su primera pieza"}</h3><p className="mt-2 text-sm text-slate-500">{pieces.length ? "Prueba otro nombre o categoría." : "Añade una pieza propia o elige una del catálogo para empezar."}</p></div>}
    <div className="grid sm:grid-cols-2 gap-5">{shown.map(entry => <article key={entry.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-orange-50 flex items-center justify-center">{entry.photoUrl ? <img src={entry.photoUrl} alt={entry.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain p-5" /> : <ImageIcon aria-hidden className="h-12 w-12 text-slate-300" />}<span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-[#1F3A5F]">{collectorCategories[entry.category]}</span></div>
      <div className="p-5 space-y-3"><h3 className="font-black break-words text-[#1F3A5F]">{entry.title}</h3><div className="flex flex-wrap gap-2 text-[11px] text-slate-600">{entry.universe && <span className="rounded-full bg-slate-100 px-2 py-1">{entry.universe}</span>}{entry.edition && <span className="rounded-full bg-slate-100 px-2 py-1">{entry.edition}</span>}{!wanted && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{collectorConditions[entry.condition]}</span>}</div>
        {wanted && <p className="text-xs text-slate-500">{entry.maxBudget ? "Hasta " + formatCLP(entry.maxBudget) : "Sin presupuesto máximo"}</p>}{entry.notes && <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{entry.notes}</p>}
        {wanted && <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3"><p className="text-xs font-bold text-[#1F3A5F]">Sugerencias disponibles</p>{(feed?.matches[entry.id] || []).length ? feed?.matches[entry.id].map(match => <Link key={match.id} href={"/product/" + encodeURIComponent(match.sku)} className="mt-2 flex items-start justify-between gap-2 text-xs text-[#1F3A5F] underline"><span>{match.name} · {formatCLP(match.price)}</span><ArrowUpRight aria-hidden className="w-4 h-4 shrink-0" /></Link>) : <p className="mt-1 text-xs text-slate-500">Sin coincidencias disponibles por ahora.</p>}</div>}
        {!wanted && entry.productId && products?.find(product => product.id === entry.productId) && <Link className="inline-block text-xs font-bold text-orange-600 underline" href={"/product/" + encodeURIComponent(products.find(product => product.id === entry.productId)!.sku)}>Ver ficha del catálogo</Link>}
        <div className="flex flex-wrap gap-4 pt-3 border-t text-xs"><button disabled={busy} onClick={() => edit(entry)} className="flex gap-1 items-center text-[#1F3A5F] disabled:opacity-50"><Pencil aria-hidden className="w-3 h-3" />Editar</button>{wanted && <button disabled={busy} onClick={() => void collect(entry)} className="flex gap-1 items-center text-emerald-700 disabled:opacity-50"><Check aria-hidden className="w-3 h-3" />Ya la tengo</button>}<button disabled={busy} onClick={() => setDeleteId(entry.id)} className="ml-auto text-red-600 flex gap-1 items-center disabled:opacity-50"><Trash2 aria-hidden className="w-3 h-3" />Eliminar</button></div>
        {deleteId === entry.id && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800"><p>¿Eliminar esta pieza de tu lista?</p><div className="flex gap-4 mt-2"><button disabled={busy} className="font-bold underline" onClick={async () => { if (await request("DELETE", undefined, entry.id)) setDeleteId(null); }}>Sí, eliminar</button><button disabled={busy} onClick={() => setDeleteId(null)}>Conservar</button></div></div>}
      </div></article>)}</div>
    <footer className="text-xs text-slate-500 leading-5">{wanted ? <>Las sugerencias se revisan al abrir o actualizar tu lista y el centro de notificaciones. Comprueba la edición en la ficha del producto. <Link href="/account?tab=collection" className="text-orange-600 underline">Ver Mi colección</Link></> : <Link href="/account?tab=wanted" className="text-orange-600 underline">¿Qué te falta? Añádelo a tu lista de búsqueda →</Link>}</footer>
  </section>;
}
