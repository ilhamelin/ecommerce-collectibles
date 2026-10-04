"use client";
import React, { useState } from "react";
import Link from "next/link";
import { toolRequest } from "@/lib/admin-tools/client";
import type { ProductDomainEntity } from "@/lib/types/domain";
type Answer = {
  filter: string;
  query: string;
  proposals: { id: string; description: string; before: string }[];
  jobId: string;
  products: ProductDomainEntity[];
  totalCatalog: number;
};
export function AdminAssistant() {
  const [prompt, setPrompt] = useState("");
  const [prepare, setPrepare] = useState(false);
  const [result, setResult] = useState<Answer | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function ask() {
    setBusy(true);
    setError("");
    setMessage("");
    setConfirm(false);
    try {
      const data = await toolRequest<Answer>(
        "/api/admin/assistant",
        { prompt, prepareDescriptions: prepare },
        "POST",
        true,
      );
      setResult(data);
      setSelected([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo consultar.");
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    setBusy(true);
    setError("");
    try {
      await toolRequest(
        "/api/admin/assistant",
        { jobId: result!.jobId, ids: selected },
        "PATCH",
      );
      setMessage("Descripciones guardadas con historial.");
      setResult(null);
      setConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo aplicar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <header className="rounded-2xl bg-[#12263B] text-white p-6">
        <p className="text-xs font-mono text-orange-300">
          OMNI / ADMIN ASSISTANT
        </p>
        <h2 className="mt-2 text-2xl font-black">
          Asistente de administración
        </h2>
        <p className="mt-3 text-sm text-slate-300">
          Interpreta tu consulta con Gemini y filtra el inventario en el
          servidor. Solo se envía tu consulta al modelo; el catálogo permanece
          en la aplicación.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {[
          "Muéstrame productos sin imágenes",
          "Busca figuras sin fabricante",
          "Muéstrame productos sin descripción",
          "Busca productos sin stock",
        ].map((text) => (
          <button
            key={text}
            disabled={busy}
            onClick={() => setPrompt(text)}
            className="rounded-full border px-3 py-2 text-xs"
          >
            {text}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
        className="space-y-3"
      >
        <label className="block text-sm font-bold">
          Consulta
          <textarea
            required
            minLength={5}
            maxLength={1500}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
            placeholder="Ej. Busca figuras de Zelda sin descripción…"
          />
        </label>
        <label className="flex gap-2 text-sm">
          <input
            disabled={busy}
            type="checkbox"
            checked={prepare}
            onChange={(e) => setPrepare(e.target.checked)}
          />
          Preparar borradores de descripción para hasta cinco resultados
        </label>
        <p className="text-xs text-slate-500">
          Los borradores combinan el nombre con texto editorial genérico.
          Comprueba el contenido: no verifican especificaciones ni autenticidad.
        </p>
        <button
          disabled={busy}
          className="rounded-xl bg-[#FF6B35] px-5 py-3 text-white font-bold disabled:opacity-50"
        >
          {busy ? "Consultando…" : "Consultar inventario"}
        </button>
      </form>
      {error && (
        <p role="alert" className="bg-red-50 text-red-700 rounded-xl p-3">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-700">
          {message}
        </p>
      )}
      {result && (
        <>
          <p role="status" className="text-sm">
            {result.products.length} resultado(s) mostrados · catálogo de{" "}
            {result.totalCatalog} productos. Filtro: {result.filter}
            {result.query ? " · " + result.query : ""}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.products.map((product) => (
              <Link
                key={product.id}
                href={
                  "/admin/products/" + encodeURIComponent(product.id) + "/edit"
                }
                className="rounded-xl border p-4"
              >
                <strong className="block text-sm">{product.name}</strong>
                <span className="text-xs text-slate-500">
                  {product.sku} · Abrir editor
                </span>
              </Link>
            ))}
          </div>
          {result.proposals.length > 0 && (
            <>
              <h3 className="font-bold">Propuestas para revisión</h3>
              {result.proposals.map((proposal) => (
                <article
                  key={proposal.id}
                  className="rounded-xl border p-4 space-y-3"
                >
                  <label className="flex gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={selected.includes(proposal.id)}
                      onChange={(e) => {
                        setSelected((ids) =>
                          e.target.checked
                            ? [...ids, proposal.id]
                            : ids.filter((id) => id !== proposal.id),
                        );
                        setConfirm(false);
                      }}
                    />
                    {
                      result.products.find(
                        (product) => product.id === proposal.id,
                      )?.name
                    }
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold mb-2">Actual</p>
                      {proposal.before || "Sin descripción"}
                    </div>
                    <div className="rounded-xl bg-orange-50 p-3">
                      <p className="text-xs font-bold mb-2">Propuesta</p>
                      {proposal.description}
                    </div>
                  </div>
                </article>
              ))}
              {confirm ? (
                <div className="rounded-xl bg-orange-50 border p-4">
                  <p>¿Aplicar {selected.length} descripción(es) revisadas?</p>
                  <button
                    disabled={busy}
                    onClick={() => void apply()}
                    className="mt-3 rounded-xl bg-[#1F3A5F] text-white p-3"
                  >
                    Confirmar cambios
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setConfirm(false)}
                    className="ml-3"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  disabled={busy || !selected.length}
                  onClick={() => setConfirm(true)}
                  className="rounded-xl border p-3 disabled:opacity-50"
                >
                  Revisar aplicación de propuestas
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
