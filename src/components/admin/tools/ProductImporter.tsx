"use client";
import React, { useState } from "react";
import { GoogleSheetsSource } from "./GoogleSheetsSource";
import { readImportFile, excelTemplate } from "@/lib/admin-tools/excel";
import { importHeaders, type ImportRow } from "@/lib/admin-tools/import";
import { toolRequest, downloadBlob } from "@/lib/admin-tools/client";
type Preview = { jobId: string; rows: ImportRow[] };
export function ProductImporter() {
  const [source, setSource] = useState<"file" | "google">("file");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mode, setMode] = useState<"CREATE" | "UPDATE">("CREATE");
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  function resetPreview() {
    setPreview(null);
    setSelected([]);
    setConfirm(false);
    setError("");
    setMessage("");
  }
  async function loadMatrix(loader: () => Promise<string[][]>) {
    setBusy(true);
    setError("");
    setMessage("");
    setPreview(null);
    setSelected([]);
    setConfirm(false);
    try {
      const matrix = await loader();
      const data = await toolRequest<Preview>("/api/admin/import", {
        action: "preview",
        mode,
        matrix,
      });
      setPreview(data);
      setSelected(
        data.rows
          .filter((row) => !row.errors.length)
          .slice(0, 25)
          .map((row) => row.row),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    try {
      const result = await toolRequest<{ count: number }>("/api/admin/import", {
        action: "commit",
        jobId: preview!.jobId,
        rows: selected,
      });
      setMessage(
        `${result.count} producto(s) guardados. Puedes revisar el catálogo y el historial.`,
      );
      setPreview(null);
      setSelected([]);
      setConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-black text-[#1F3A5F]">
        Importador Excel / CSV y Google Sheets
      </h2>
      <p className="text-sm text-slate-600">
        Usa la plantilla. Previsualiza hasta 100 filas y confirma un lote de
        hasta 25 productos. No modifica Precio Normal ni metadata técnica
        existente.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy}
          className="border rounded-xl p-3 text-sm"
          onClick={() =>
            downloadBlob(
              new Blob(
                [
                  importHeaders.join(",") +
                    "\nFIG-EJEMPLO,Figura de ejemplo,FIGURE,24990,15000,5,Descripción de ejemplo para reemplazar.,\n",
                ],
                { type: "text/csv;charset=utf-8" },
              ),
              "plantilla-productos.csv",
            )
          }
        >
          Plantilla CSV
        </button>
        <button
          disabled={busy}
          className="border rounded-xl p-3 text-sm"
          onClick={async () => {
            setBusy(true);
            try {
              downloadBlob(await excelTemplate(), "plantilla-productos.xlsx");
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "No se pudo crear la plantilla.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Plantilla Excel
        </button>
      </div>
      <label className="block text-sm font-bold">
        Operación
        <select
          disabled={busy}
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as typeof mode);
            resetPreview();
          }}
          className="block border rounded-xl p-3 mt-1"
        >
          <option value="CREATE">Crear productos nuevos</option>
          <option value="UPDATE">Actualizar existentes por SKU</option>
        </select>
      </label>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Origen de los productos"
      >
        <button
          type="button"
          disabled={busy}
          aria-pressed={source === "file"}
          onClick={() => {
            setSource("file");
            resetPreview();
          }}
          className={
            "rounded-xl border px-4 py-3 text-sm font-bold " +
            (source === "file" ? "bg-[#1F3A5F] text-white" : "bg-white")
          }
        >
          Archivo Excel / CSV
        </button>
        <button
          type="button"
          disabled={busy}
          aria-pressed={source === "google"}
          onClick={() => {
            setSource("google");
            resetPreview();
          }}
          className={
            "rounded-xl border px-4 py-3 text-sm font-bold " +
            (source === "google" ? "bg-emerald-700 text-white" : "bg-white")
          }
        >
          Google Sheets (Drive)
        </button>
      </div>
      {source === "file" ? (
        <label className="block rounded-2xl bg-slate-50 border p-5 text-sm font-bold">
          Cargar archivo
          <input
            disabled={busy}
            type="file"
            accept=".csv,.xlsx"
            className="block mt-3 text-xs"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void loadMatrix(() => readImportFile(file));
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <GoogleSheetsSource
          onBusyChange={setBusy}
          disabled={busy}
          onReset={resetPreview}
          onLoad={(matrix) => loadMatrix(() => Promise.resolve(matrix))}
        />
      )}
      {busy && <p role="status">Procesando…</p>}
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
      {preview && (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <caption className="p-3 text-left font-bold">
                Vista previa · {selected.length} seleccionado(s)
              </caption>
              <thead className="bg-slate-100">
                <tr>
                  {[
                    "Elegir",
                    "Fila / SKU",
                    "Producto",
                    "Precio / costo",
                    "Stock",
                    "Validación",
                  ].map((text) => (
                    <th key={text} className="p-3">
                      {text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row} className="border-t">
                    <td className="p-3">
                      <input
                        aria-label={"Seleccionar fila " + row.row}
                        disabled={
                          busy ||
                          !!row.errors.length ||
                          (!selected.includes(row.row) && selected.length >= 25)
                        }
                        type="checkbox"
                        checked={selected.includes(row.row)}
                        onChange={(e) => {
                          setSelected((current) =>
                            e.target.checked
                              ? [...current, row.row]
                              : current.filter((item) => item !== row.row),
                          );
                          setConfirm(false);
                        }}
                      />
                    </td>
                    <td className="p-3">
                      {row.row} · {row.product?.sku || "Inválido"}
                    </td>
                    <td className="p-3">{row.product?.name}</td>
                    <td className="p-3">
                      {row.product?.price} / {row.product?.costPrice} CLP
                    </td>
                    <td className="p-3">{row.product?.stockAvailable}</td>
                    <td className="p-3 max-w-xs">
                      {row.errors.length ? (
                        <span className="text-red-700">
                          {row.errors.join(" · ")}
                        </span>
                      ) : (
                        <span className="text-emerald-700">
                          {row.operation === "CREATE" ? "Crear" : "Actualizar"}{" "}
                          · válida
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            La actualización reemplaza nombre, descripción, tipo, precio, costo
            y stock. Una imagen vacía conserva las fotos existentes. Preventas y
            packs se editan en su editor.
          </p>
          {confirm ? (
            <div className="rounded-xl border border-orange-300 bg-orange-50 p-4">
              <p className="text-sm mb-3">
                ¿Guardar este lote de {selected.length} producto(s)? Los cambios
                quedan en el historial.
              </p>
              <button
                disabled={busy}
                onClick={() => void commit()}
                className="bg-[#1F3A5F] rounded-xl text-white p-3 text-sm"
              >
                Confirmar importación
              </button>
              <button
                disabled={busy}
                onClick={() => setConfirm(false)}
                className="ml-3 text-sm"
              >
                Volver a revisar
              </button>
            </div>
          ) : (
            <button
              disabled={busy || !selected.length}
              onClick={() => setConfirm(true)}
              className="rounded-xl p-3 bg-[#FF6B35] text-white font-bold disabled:opacity-50"
            >
              Revisar y guardar lote
            </button>
          )}
        </>
      )}
    </section>
  );
}
