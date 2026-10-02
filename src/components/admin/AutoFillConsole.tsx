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
  events?: string[];
}

/** Displays observed request events, without simulating model reasoning or progress. */
export function AutoFillConsole({ run }: { run: AutoFillRun | null }) {
  const busy = run?.stage === "reading" || run?.stage === "requesting";
  return (
    <section aria-label="Consola de autocompletado" className="relative overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-[#03141d] via-[#071923] to-[#211030] shadow-[0_0_30px_#22d3ee15]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#22d3ee33 1px, transparent 1px), linear-gradient(90deg, #22d3ee33 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-slate-200"><Terminal size={16} className="text-cyan-300" /><span className="font-mono">OMNI / NEURAL TERMINAL</span></div>
        <span className="flex items-center gap-2 text-xs text-cyan-200">{busy ? <Loader2 size={14} className="motion-safe:animate-spin text-fuchsia-300" /> : run?.stage === "success" ? <CheckCircle2 size={14} /> : run?.stage === "error" ? <AlertCircle size={14} /> : null}{busy ? "En curso" : run?.stage === "success" ? "Ficha preparada" : run?.stage === "error" ? "Solicitud fallida" : "Listo para comenzar"}</span>
      </div>
      <div role="log" aria-live="polite" aria-relevant="additions text" className="space-y-2 p-4 font-mono text-xs leading-relaxed text-slate-300 break-words">
        <div className="flex flex-wrap gap-2 pb-2 text-[10px] uppercase tracking-widest text-fuchsia-300"><span className="rounded border border-fuchsia-400/30 px-2 py-1">Entrada → Motor → Validación → Ficha</span><span className="rounded border border-cyan-400/30 px-2 py-1 text-cyan-200">{busy ? "Conexión activa" : "En espera / resultado"}</span></div>
        <p className="text-cyan-300">$ omni completar --producto</p>
        {!run ? <p>Introduce un nombre o selecciona una imagen. Aquí verás los eventos reales de tu solicitud.</p> : <>
          <p><span className="text-slate-500">[entrada]</span> {run.source}</p>
          {run.stage === "reading" ? <p className="text-cyan-200">Leyendo la imagen seleccionada…</p> : <p><span className="text-slate-500">[solicitud]</span> {run.stage === "error" && !run.engine ? "Solicitud interrumpida." : "Autocompletado solicitado."}</p>}
          {!!run.events?.length && <ol className="max-h-64 space-y-2 overflow-y-auto border-l border-cyan-400/30 pl-3">{run.events.map((message, index) => <li key={index} className="text-slate-200"><span className="mr-2 text-fuchsia-300">{String(index + 1).padStart(2, "0")}</span>{message}</li>)}</ol>}
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
      <p className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-400">Eventos reales del servidor · Datos transmitidos tras validar la respuesta · Revisa precios y especificaciones antes de guardar.</p>
    </section>
  );
}
