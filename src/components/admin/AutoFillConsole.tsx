import React from "react";
import { Terminal, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export interface AutoFillRun {
  source: string;
  startedAt: number;
  finishedAt?: number;
  stage: "reading" | "requesting" | "success" | "error";
  engine?: string;
  fields?: string[];
  error?: string;
}

/** Displays observed request events, without simulating model reasoning or progress. */
export function AutoFillConsole({ run }: { run: AutoFillRun | null }) {
  const busy = run?.stage === "reading" || run?.stage === "requesting";
  return (
    <section aria-label="Consola de autocompletado" className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#071923] shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-slate-200"><Terminal size={16} className="text-cyan-300" /><span className="font-mono">OMNI / Asistente de producto</span></div>
        <span className="flex items-center gap-2 text-xs text-cyan-200">{busy ? <Loader2 size={14} className="motion-safe:animate-spin" /> : run?.stage === "success" ? <CheckCircle2 size={14} /> : run?.stage === "error" ? <AlertCircle size={14} /> : null}{busy ? "En curso" : run?.stage === "success" ? "Ficha preparada" : run?.stage === "error" ? "Solicitud fallida" : "Listo para comenzar"}</span>
      </div>
      <div role="log" aria-live="polite" aria-relevant="additions text" className="space-y-2 p-4 font-mono text-xs leading-relaxed text-slate-300 break-words">
        <p className="text-cyan-300">$ omni completar --producto</p>
        {!run ? <p>Introduce un nombre o selecciona una imagen. Aquí verás los eventos reales de tu solicitud.</p> : <>
          <p><span className="text-slate-500">[entrada]</span> {run.source}</p>
          {run.stage === "reading" ? <p className="text-cyan-200">Leyendo la imagen seleccionada…</p> : <p><span className="text-slate-500">[solicitud]</span> {run.stage === "error" && !run.engine ? "Solicitud interrumpida." : "Autocompletado solicitado."}</p>}
          {run.stage === "requesting" && <p className="text-cyan-200">Esperando respuesta del servidor…</p>}
          {run.stage === "success" && <>
            <p className="text-emerald-300">[motor] {run.engine === "GEMINI_AI" ? "Google Gemini" : "Motor heurístico · sin generación de Gemini"}</p>
            <p>[respuesta] {run.fields?.length ?? 0} grupos de datos recibidos: {run.fields?.join(", ")}</p>
            <p className="text-emerald-300">[listo] Datos aplicados al formulario. Revisa los valores antes de guardar.</p>
          </>}
          {run.stage === "error" && <p className="text-rose-300">[error] {run.error}</p>}
          {run.finishedAt && <p className="text-slate-400">Duración de la solicitud: {((run.finishedAt - run.startedAt) / 1000).toFixed(1)} s</p>}
        </>}
      </div>
      <p className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-400">Eventos de la aplicación. El servidor entrega el resultado completo; no transmite pasos internos del modelo.</p>
    </section>
  );
}
