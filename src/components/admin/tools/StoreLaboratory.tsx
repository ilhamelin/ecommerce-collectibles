"use client";
import React, { useEffect, useState } from "react";
import { toolRequest } from "@/lib/admin-tools/client";
import { EditorialHero } from "@/components/home/EditorialHero";
import {
  type HomeHeroSettings,
  type HomeHeroProduct,
} from "@/lib/constants/homeHeroDefaults";
type Draft = {
  id: string;
  name: string;
  settings: HomeHeroSettings;
  published: boolean;
  at: string;
  baseHash: string;
};
type Lab = { settings: HomeHeroSettings; baseHash: string; drafts: Draft[] };
const labels: Record<string, string> = {
  badge: "Etiqueta",
  heading: "Título principal",
  highlightedHeading: "Título destacado",
  description: "Descripción",
  primaryLabel: "Botón principal",
  primaryHref: "Enlace principal",
  secondaryLabel: "Botón secundario",
  secondaryHref: "Enlace secundario",
  footnote: "Nota inferior",
  spotlightLabel: "Etiqueta del producto",
  productLinkLabel: "Texto del enlace al producto",
  preorderLinkLabel: "Texto de preventa",
};
export function StoreLaboratory({ products }: { products: HomeHeroProduct[] }) {
  const [live, setLive] = useState<Lab | null>(null);
  const [settings, setSettings] = useState<HomeHeroSettings | null>(null);
  const [name, setName] = useState("Mi propuesta de portada");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [publish, setPublish] = useState<Draft | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [compare, setCompare] = useState(false);
  async function load(reset = false) {
    try {
      const data = await toolRequest<Lab>("/api/admin/laboratory");
      setLive(data);
      if (reset || !settings) setSettings(data.settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    }
  }
  useEffect(() => {
    void load(true);
  }, []);
  async function save() {
    if (!settings || !live) return;
    setBusy(true);
    setError("");
    try {
      await toolRequest("/api/admin/laboratory", {
        action: "save",
        name,
        settings,
        baseHash: live.baseHash,
      });
      await load();
      setMessage(
        "Borrador guardado. La portada pública conserva su diseño actual.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!publish) return;
    setBusy(true);
    setError("");
    try {
      await toolRequest("/api/admin/laboratory", {
        action: "publish",
        id: publish.id,
      });
      setPublish(null);
      await load(true);
      setMessage(
        "Portada publicada y versión anterior conservada en el historial.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-black text-[#1F3A5F]">
        Laboratorio de la tienda
      </h2>
      <p className="text-sm text-slate-600">
        Experimenta con la portada: textos, producto y colores. Guardar un
        borrador no publica cambios. Las versiones publicadas se conservan.
      </p>
      {error && (
        <p role="alert" className="bg-red-50 text-red-700 p-3 rounded-xl">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      {settings && live && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="rounded-2xl border bg-slate-50 p-5 space-y-4"
          >
            <fieldset disabled={busy}>
              <label className="block text-sm font-bold mb-4">
                Nombre del borrador
                <input
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border p-3 mt-1"
                />
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(labels).map(([key, label]) => (
                  <label key={key} className="text-xs font-bold text-slate-600">
                    {label}
                    <input
                      required
                      maxLength={key === "description" ? 360 : 240}
                      value={String(
                        settings[key as keyof HomeHeroSettings] || "",
                      )}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                      className="block w-full rounded-xl border bg-white p-3 mt-1"
                    />
                  </label>
                ))}
                <label className="text-xs font-bold">
                  Producto destacado
                  <select
                    value={settings.featuredProductId || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        featuredProductId: e.target.value || null,
                      })
                    }
                    className="block w-full rounded-xl border bg-white p-3 mt-1"
                  >
                    <option value="">Selección automática</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-5">
                  <label className="text-xs font-bold">
                    Color principal
                    <input
                      aria-label="Color principal"
                      type="color"
                      value={settings.primaryColor || "#1F3A5F"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          primaryColor: e.target.value,
                        })
                      }
                      className="block mt-2"
                    />
                  </label>
                  <label className="text-xs font-bold">
                    Color destacado
                    <input
                      aria-label="Color destacado"
                      type="color"
                      value={settings.accentColor || "#FF6B35"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          accentColor: e.target.value,
                        })
                      }
                      className="block mt-2"
                    />
                  </label>
                </div>
              </div>
              <button className="mt-5 rounded-xl bg-[#1F3A5F] px-5 py-3 text-sm font-bold text-white">
                Guardar nuevo borrador
              </button>
            </fieldset>
          </form>
          <div className="flex gap-4 flex-wrap text-sm">
            <button
              onClick={() =>
                setViewport(viewport === "mobile" ? "desktop" : "mobile")
              }
              className="border rounded-xl p-3"
            >
              Vista {viewport === "mobile" ? "móvil" : "escritorio"}
            </button>
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              Comparar con publicada
            </label>
            <button
              disabled={busy}
              onClick={() => void load(true)}
              className="underline"
            >
              Cargar diseño publicado
            </button>
          </div>
          <div className={compare ? "grid xl:grid-cols-2 gap-4" : ""}>
            {compare && (
              <div className="border rounded-2xl overflow-hidden">
                <p className="p-3 text-xs font-bold bg-slate-100">Publicada</p>
                <EditorialHero
                  products={products}
                  settings={live.settings}
                  preview
                />
              </div>
            )}
            <div
              className={
                "border rounded-2xl overflow-hidden bg-[#F7F7F5] mx-auto w-full " +
                (viewport === "mobile" ? "max-w-[390px]" : "")
              }
            >
              <p className="p-3 text-xs font-bold bg-orange-50">
                Borrador · vista previa
              </p>
              <EditorialHero
                products={products}
                settings={settings}
                preview
                compact={viewport === "mobile"}
              />
            </div>
          </div>
          <h3 className="font-bold text-[#1F3A5F]">
            Últimos borradores guardados
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {live.drafts.map((draft) => (
              <article key={draft.id} className="rounded-xl border p-4">
                <h4 className="font-bold">{draft.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(draft.at).toLocaleString("es-CL")} ·{" "}
                  {draft.published ? "Publicado" : "Borrador"}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <button
                    disabled={busy}
                    onClick={() => {
                      setSettings(draft.settings);
                      setName(draft.name);
                      setMessage("Borrador cargado para revisión.");
                    }}
                    className="underline"
                  >
                    Previsualizar
                  </button>
                  <button
                    disabled={busy || draft.published}
                    onClick={() => {
                      setSettings(draft.settings);
                      setName(draft.name);
                      setPublish(draft);
                    }}
                    className="text-orange-600 font-bold disabled:opacity-50"
                  >
                    Publicar este borrador
                  </button>
                </div>
              </article>
            ))}
          </div>
          {publish && (
            <div
              role="alert"
              className="rounded-xl border border-orange-300 bg-orange-50 p-5"
            >
              <p>
                ¿Publicar «{publish.name}» como portada de la tienda? Se
                conservará una versión anterior.
              </p>
              <div className="flex gap-4 mt-4">
                <button
                  disabled={busy}
                  onClick={() => void apply()}
                  className="rounded-xl bg-[#1F3A5F] text-white p-3"
                >
                  Confirmar publicación
                </button>
                <button disabled={busy} onClick={() => setPublish(null)}>
                  Seguir revisando
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
