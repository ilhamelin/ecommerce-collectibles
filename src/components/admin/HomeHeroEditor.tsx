"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, ImageIcon, Save, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorialHero } from "@/components/home/EditorialHero";
import { HomeHeroSettingsSchema, canFeatureHomeProduct, selectHomeFeaturedProduct, type HomeHeroSettings, type HomeHeroProduct } from "@/lib/constants/homeHeroDefaults";

type TextField = Exclude<keyof HomeHeroSettings, "featuredProductId">;
const inputClass = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1F3A5F] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100";

interface Props {
  initialSettings: HomeHeroSettings;
  products: HomeHeroProduct[];
  canPersist: boolean;
  onSave: (settings: HomeHeroSettings) => Promise<HomeHeroSettings>;
}

/** Edit a draft using the actual storefront renderer; freeze it while saving. */
export function HomeHeroEditor({ initialSettings, products, canPersist, onSave }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const selected = selectHomeFeaturedProduct(products, settings.featuredProductId);
  const selectedUnavailable = Boolean(settings.featuredProductId && !products.some(product => product.id === settings.featuredProductId && canFeatureHomeProduct(product)));

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof HomeHeroSettings>(field: K, value: HomeHeroSettings[K]) {
    setSettings(previous => ({ ...previous, [field]: value }));
    setFeedback(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !canPersist || !dirty) return;
    const parsed = HomeHeroSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      setFeedback({ type: "error", message: parsed.error.issues[0].message });
      document.getElementById(`hero-${parsed.error.issues[0].path[0]}`)?.focus();
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const persisted = await onSave(parsed.data);
      setSettings(persisted);
      setSaved(persisted);
      setFeedback({ type: "success", message: "Portada guardada en la base de datos. Abre la tienda o recarga el inicio para ver los cambios." });
    } catch (error: unknown) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "No se guardaron los cambios. Vuelve a intentar." });
    } finally {
      setSaving(false);
    }
  }

  function field(key: TextField, label: string, maxLength: number, multiline = false) {
    const props = { id: `hero-${key}`, value: settings[key], maxLength, required: true, className: inputClass, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, event.target.value) };
    return <div className="space-y-1.5">
      <label htmlFor={props.id} className="block text-xs font-semibold text-[#1F3A5F]">{label}</label>
      {multiline ? <textarea {...props} rows={3} /> : <input {...props} type="text" />}
    </div>;
  }

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B35]"><ImageIcon size={15} />Personalización Visual</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F] sm:text-3xl">Sección principal de inicio</h1>
        <p className="max-w-2xl text-sm text-slate-600">Edita la portada «Tu próxima pieza» y el producto que recibe a tus visitantes.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="xl:hidden"><a href="#home-hero-preview"><Eye />Vista previa</a></Button>
        <Button asChild variant="outline"><Link href="/" target="_blank" rel="noopener noreferrer" prefetch={false}><ExternalLink />Ver tienda</Link></Button>
        <Button type="submit" form="home-hero-form" disabled={saving || !dirty || !canPersist}>{saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </header>

    {!canPersist && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Puedes explorar la vista previa. Para guardar, Firebase Admin debe estar conectado en el servidor; aquí no está disponible.</p>}
    {feedback && <p role={feedback.type === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{feedback.message}</p>}

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form id="home-hero-form" onSubmit={submit} className="min-w-0 space-y-5">
        <fieldset disabled={saving} className="space-y-5 disabled:opacity-70">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold text-[#1F3A5F]"><Sparkles size={17} className="text-[#FF6B35]" />Mensaje de la portada</h2>
            {field("badge", "Etiqueta superior", 80)}
            {field("heading", "Título principal", 90)}
            {field("highlightedHeading", "Título destacado en naranja", 90)}
            {field("description", "Descripción", 360, true)}
            {field("footnote", "Texto bajo los botones", 180)}
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-[#1F3A5F]">Botones de navegación</h2>
            <div className="grid gap-4 sm:grid-cols-2">{field("primaryLabel", "Texto del botón principal", 60)}{field("primaryHref", "Destino del botón principal", 240)}</div>
            <div className="grid gap-4 sm:grid-cols-2">{field("secondaryLabel", "Texto del botón secundario", 60)}{field("secondaryHref", "Destino del botón secundario", 240)}</div>
            <p className="text-xs leading-relaxed text-slate-500">Usa destinos de la tienda, por ejemplo /catalog, /catalog?category=FIGURE o #colecciones.</p>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-[#1F3A5F]">Producto destacado</h2>
            <div className="space-y-1.5">
              <label htmlFor="hero-featuredProductId" className="block text-xs font-semibold text-[#1F3A5F]">Producto de la portada</label>
              <select id="hero-featuredProductId" className={inputClass} value={settings.featuredProductId ?? ""} onChange={event => update("featuredProductId", event.target.value || null)}>
                <option value="">Automático · primer producto disponible con imagen</option>
                {selectedUnavailable && <option value={settings.featuredProductId!} disabled>Selección anterior no disponible</option>}
                {products.filter(canFeatureHomeProduct).map(product => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
              </select>
            </div>
            {selectedUnavailable && <p role="status" className="text-xs text-amber-800">La selección anterior ya no está disponible. La tienda muestra otro producto válido; elige uno nuevo o selecciona Automático antes de guardar.</p>}
            <p className="text-xs leading-relaxed text-slate-500">La imagen, el nombre y el precio se actualizan desde el catálogo. Si el producto desaparece o queda sin stock, la portada elige otro disponible.</p>
            {field("spotlightLabel", "Etiqueta de la tarjeta", 60)}
            {field("productLinkLabel", "Texto para ver el producto", 60)}
            {field("preorderLinkLabel", "Texto para productos en preventa", 80)}
          </div>
        </fieldset>
        <Button type="submit" className="w-full xl:hidden" disabled={saving || !dirty || !canPersist}>{saving ? <Loader2 className="animate-spin" /> : <Save />}{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </form>

      <aside id="home-hero-preview" className="min-w-0 space-y-3 scroll-mt-28 xl:sticky xl:top-24">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1F3A5F]"><Eye size={17} />Vista previa en vivo</h2>
          <span role="status" className={`rounded-full px-3 py-1 text-xs ${dirty ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"}`}>{dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}</span>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#F7F7F5] [&_.editorial-hero]:grid-cols-1 [&_.editorial-hero]:gap-6 [&_.editorial-hero]:p-6 [&_h3]:text-3xl [&_.editorial-feature]:p-5 [&_.editorial-feature_img]:my-4 [&_.editorial-feature_img]:h-52">
          <EditorialHero products={products} settings={settings} preview />
        </div>
        <p className="px-1 text-xs leading-relaxed text-slate-500">{selected ? `Mostrando: ${selected.name}. ` : "No hay productos disponibles con imagen. "}La vista previa no navega ni publica cambios.</p>
        <a href="#home-hero-form" className="inline-block text-sm font-semibold text-[#1F3A5F] underline underline-offset-4 xl:hidden">Volver al editor</a>
      </aside>
    </div>
  </div>;
}
