"use client";
import React, { useEffect, useState } from "react";
import { toolRequest, optimizeImage } from "@/lib/admin-tools/client";
import type { MediaAsset } from "@/lib/admin-tools/media";
const input = "w-full border rounded-xl p-3 text-sm";
export function MediaLibrary({
  onSelect,
}: {
  onSelect?: (url: string) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [edit, setEdit] = useState<MediaAsset | null>(null);
  async function load() {
    setError("");
    try {
      setAssets(await toolRequest<MediaAsset[]>("/api/admin/media"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function upload(file: File) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const blob = await optimizeImage(file);
      const data = new FormData();
      data.set("file", new File([blob], "image.webp", { type: blob.type }));
      data.set("name", file.name.slice(0, 100));
      await toolRequest("/api/admin/media", data);
      await load();
      setMessage("Imagen optimizada y guardada en la biblioteca.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir.");
    } finally {
      setBusy(false);
    }
  }
  async function save(asset: MediaAsset) {
    setBusy(true);
    setError("");
    try {
      await toolRequest(
        "/api/admin/media",
        {
          id: asset.id,
          name: asset.name,
          tags: asset.tags,
          position: asset.position,
          archived: asset.archived,
        },
        "PATCH",
      );
      await load();
      setEdit(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-[#1F3A5F]">
          Biblioteca de imágenes
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Sube, organiza y reutiliza fotos. Las imágenes archivadas conservan
          sus enlaces para no romper productos.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-5">
        <label className="block text-sm font-bold">
          Subir imagen{" "}
          <input
            disabled={busy}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block mt-3 text-xs"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
        <p className="text-xs mt-3 text-slate-500">
          Hasta 5 MB de origen; se optimiza a WebP de hasta 350 KB. Biblioteca
          de 100 imágenes.
        </p>
        {busy && (
          <p role="status" className="mt-2 text-sm">
            Procesando…
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Buscar imágenes"
          className={input + " sm:!w-72"}
          value={search}
          placeholder="Nombre o etiquetas…"
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex gap-2 text-sm items-center">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Mostrar archivadas
        </label>
        <button
          disabled={busy}
          onClick={() => void load()}
          className="text-sm underline"
        >
          Actualizar
        </button>
      </div>
      {edit && (
        <form
          className="rounded-xl border p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save(edit);
          }}
        >
          <label className="block text-sm">
            Nombre
            <input
              required
              maxLength={100}
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              className={input}
            />
          </label>
          <label className="block text-sm">
            Etiquetas
            <input
              maxLength={200}
              value={edit.tags}
              onChange={(e) => setEdit({ ...edit, tags: e.target.value })}
              className={input}
            />
          </label>
          <button
            disabled={busy}
            className="rounded-xl bg-[#1F3A5F] text-white p-3"
          >
            Guardar
          </button>
          <button type="button" onClick={() => setEdit(null)} className="ml-3">
            Cancelar
          </button>
        </form>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {assets
          .filter(
            (asset) =>
              (showArchived || !asset.archived) &&
              [asset.name, asset.tags]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((asset) => (
            <article
              key={asset.id}
              className="rounded-2xl border overflow-hidden"
            >
              <img
                src={asset.url}
                alt={asset.name}
                loading="lazy"
                className="h-36 w-full object-contain bg-slate-50 p-3"
              />
              <div className="p-3 space-y-2">
                <h3 className="font-bold text-sm break-words">{asset.name}</h3>
                <p className="text-xs text-slate-500">
                  {Math.round(asset.bytes / 1024)} KB ·{" "}
                  {asset.archived ? "Archivada" : asset.tags || "Sin etiquetas"}
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    disabled={busy}
                    onClick={() => setEdit(asset)}
                    className="underline"
                  >
                    Editar
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void save({
                        ...asset,
                        position:
                          Math.min(...assets.map((item) => item.position)) - 1,
                      })
                    }
                    className="underline"
                  >
                    Al inicio
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void save({ ...asset, archived: !asset.archived })
                    }
                    className="underline"
                  >
                    {asset.archived ? "Recuperar" : "Archivar"}
                  </button>
                </div>
                <button
                  disabled={busy}
                  onClick={async () => {
                    try {
                      if (onSelect) onSelect(asset.url);
                      else {
                        await navigator.clipboard.writeText(asset.url);
                        setMessage("Enlace copiado: " + asset.url);
                      }
                    } catch {
                      setMessage("Enlace: " + asset.url);
                    }
                  }}
                  className="rounded-xl bg-[#1F3A5F] text-white w-full py-2 text-xs font-bold"
                >
                  {onSelect ? "Usar imagen" : "Copiar enlace"}
                </button>
              </div>
            </article>
          ))}
      </div>
      {!assets.length && !error && (
        <p className="text-sm text-slate-500">
          La biblioteca está vacía. Sube tu primera imagen.
        </p>
      )}
    </section>
  );
}
