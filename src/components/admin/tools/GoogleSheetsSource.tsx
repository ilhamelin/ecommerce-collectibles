"use client";
import React, { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Link2 } from "lucide-react";
import { toolRequest } from "@/lib/admin-tools/client";
import {
  parseGoogleSheetLink,
  type GoogleSheetDocument,
} from "@/lib/admin-tools/googleSheets";

type Configuration = { serviceEmail: string; configured: boolean };
export function GoogleSheetsSource({
  disabled,
  onLoad,
  onReset,
  onBusyChange,
}: {
  onBusyChange: (value: boolean) => void;
  disabled: boolean;
  onLoad: (matrix: string[][]) => Promise<void>;
  onReset: () => void;
}) {
  const active = useRef(true);
  const [configuration, setConfiguration] = useState<Configuration | null>(
    null,
  );
  const [url, setUrl] = useState("");
  const [document, setDocument] = useState<GoogleSheetDocument | null>(null);
  const [sheetId, setSheetId] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configurationAttempt, setConfigurationAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const endpoint = "/api/admin/import/google-sheets";
  useEffect(() => {
    let current = true;
    active.current = true;
    toolRequest<Configuration>(endpoint)
      .then((value) => {
        if (current) setConfiguration(value);
      })
      .catch((e) => {
        if (current)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo cargar la configuración.",
          );
      });
    return () => {
      current = false;
      active.current = false;
    };
  }, [configurationAttempt]);
  async function connect() {
    setBusy(true);
    onBusyChange(true);
    setError("");
    setDocument(null);
    onReset();
    try {
      parseGoogleSheetLink(url);
      const data = await toolRequest<GoogleSheetDocument>(endpoint, {
        action: "inspect",
        url,
      });
      if (active.current) {
        setDocument(data);
        setSheetId(data.selectedSheetId);
      }
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error ? e.message : "No se pudo conectar la hoja.",
        );
    } finally {
      if (active.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  async function read() {
    setBusy(true);
    onBusyChange(true);
    setError("");
    onReset();
    try {
      const data = await toolRequest<{ matrix: string[][] }>(endpoint, {
        action: "read",
        url,
        sheetId,
      });
      if (active.current) await onLoad(data.matrix);
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error ? e.message : "No se pudo leer la pestaña.",
        );
    } finally {
      if (active.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  const locked = disabled || busy;
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
          <FileSpreadsheet size={22} aria-hidden />
        </span>
        <div>
          <h3 className="font-bold text-[#1F3A5F]">
            Cargar desde Google Sheets
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Lee una hoja de tu Drive sin descargarla. El archivo original
            conserva sus datos.
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-white border p-4 text-sm space-y-2">
        <p>
          Comparte la hoja como <strong>Lector</strong> con esta cuenta de
          servicio:
        </p>
        {configuration?.serviceEmail ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="break-all text-xs select-all">
              {configuration.serviceEmail}
            </code>
            <button
              type="button"
              className="text-xs underline text-emerald-700"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    configuration.serviceEmail,
                  );
                  setCopied(true);
                } catch {
                  setError("Selecciona y copia el correo mostrado.");
                }
              }}
            >
              {copied ? "Correo copiado" : "Copiar correo"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {configuration
              ? "Configura FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en el servidor."
              : "Consultando configuración…"}
          </p>
        )}
        <p className="text-xs text-slate-600">
          La primera vez, habilita{" "}
          <a
            href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            Google Sheets API
          </a>{" "}
          en el proyecto de esa cuenta. Puedes mantener la hoja privada.
        </p>
      </div>
      {!configuration && error && (
        <button
          type="button"
          className="underline text-sm"
          onClick={() => {
            setError("");
            setConfigurationAttempt((value) => value + 1);
          }}
        >
          Reintentar configuración
        </button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void connect();
        }}
        className="space-y-3"
      >
        <label className="block text-sm font-bold">
          Enlace de Google Sheets
          <input
            type="url"
            required
            maxLength={1000}
            disabled={locked}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setDocument(null);
              setError("");
              onReset();
            }}
            placeholder="https://docs.google.com/spreadsheets/d/…/edit"
            className="block w-full border rounded-xl p-3 mt-2 bg-white text-sm font-normal"
          />
        </label>
        <button
          disabled={locked || !configuration?.configured || !url.trim()}
          className="inline-flex items-center gap-2 bg-emerald-700 text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
        >
          <Link2 size={16} aria-hidden />
          Conectar hoja
        </button>
      </form>
      {document && (
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <p className="text-sm font-bold break-words">{document.title}</p>
          <label className="block text-sm font-bold">
            Pestaña para importar
            <select
              disabled={locked}
              value={sheetId}
              onChange={(e) => {
                setSheetId(Number(e.target.value));
                onReset();
              }}
              className="block w-full border rounded-xl p-3 mt-2"
            >
              {document.sheets.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.title}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-600">
            Usa la plantilla en A:H, encabezados en la fila 1 y hasta 100
            productos. Se leen valores numéricos sin formato, incluyendo el
            resultado de fórmulas. No se importan otras columnas.
          </p>
          <button
            type="button"
            disabled={locked}
            onClick={() => void read()}
            className="rounded-xl bg-[#1F3A5F] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            Previsualizar Google Sheets
          </button>
        </div>
      )}
      {busy && (
        <p role="status" className="text-sm text-emerald-700">
          Leyendo Google Sheets…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
