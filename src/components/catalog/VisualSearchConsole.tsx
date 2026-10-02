"use client";

import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Terminal, ScanLine, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { VisualSearchResult, VisualSearchStage } from "@/lib/services/visualSearch";

export interface VisualSearchRun {
  source: string;
  startedAt: number;
  finishedAt?: number;
  stage: VisualSearchStage | "reading" | "ready" | "requesting" | "success" | "error" | "cancelled";
  events: string[];
  error?: string;
  result?: VisualSearchResult;
}

const steps = [
  { label: "Imagen", stages: ["reading", "ready", "received", "requesting"] },
  { label: "Catálogo", stages: ["catalog"] },
  { label: "Gemini", stages: ["model"] },
  { label: "Cruce de datos", stages: ["analysis", "matching"] },
  { label: "Resultados", stages: ["complete", "success"] },
];

/** Presents observed image/server milestones; no simulated percentages or model reasoning. */
export function VisualSearchConsole({ run }: { run: VisualSearchRun | null }) {
  const reducedMotion = useReducedMotion();
  const logRef = useRef<HTMLOListElement>(null);
  const busy = !!run && !["ready", "success", "error", "cancelled"].includes(run.stage);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [run?.events.length]);
  const status = !run ? "Esperando imagen" : run.stage === "ready" ? "Imagen preparada" : run.stage === "success" ? "Búsqueda completada" : run.stage === "error" ? "Búsqueda interrumpida" : run.stage === "cancelled" ? "Búsqueda cancelada" : "Conexión activa";
  return (
    <section aria-label="Consola de búsqueda por foto IA" aria-busy={busy} className="relative isolate overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-[#03141d] via-[#071923] to-[#211030] shadow-[0_0_30px_#22d3ee15]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#22d3ee33 1px, transparent 1px), linear-gradient(90deg, #22d3ee33 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-200"><Terminal size={16} /><span>OMNI / VISION TERMINAL</span></div>
        <span className="flex items-center gap-2 text-[11px] text-slate-200">{busy ? <Loader2 size={14} className="motion-safe:animate-spin text-fuchsia-300" /> : run?.stage === "success" ? <CheckCircle2 size={14} className="text-emerald-300" /> : run?.stage === "error" ? <AlertCircle size={14} className="text-rose-300" /> : <ScanLine size={14} className="text-cyan-300" />}{status}</span>
      </div>
      <div className="relative space-y-3 p-4 font-mono text-xs leading-relaxed text-slate-300 break-words">
        <div aria-label="Etapas de búsqueda" className="flex flex-wrap gap-1.5 text-[10px]">{steps.map(step => <span key={step.label} aria-current={run && step.stages.includes(run.stage) ? "step" : undefined} className={`rounded border px-2 py-1 ${run && step.stages.includes(run.stage) ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-slate-400"}`}>{step.label}</span>)}</div>
        <p className="text-fuchsia-300">$ omni vision --imagen --catalogo</p>
        {!run ? <p>Selecciona una foto. Aquí verás la lectura del archivo y los eventos reales del servidor.</p> : <>
          <p className="text-cyan-200"><span className="text-slate-500">[archivo]</span> {run.source}</p>
          <ol ref={logRef} role="log" aria-live="polite" aria-relevant="additions" aria-label="Eventos de búsqueda" className="max-h-44 space-y-2 overflow-y-auto border-l border-cyan-400/30 pl-3">{run.events.map((message, index) => <motion.li key={index} initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .18 }}><span aria-hidden="true" className="mr-2 text-fuchsia-300">{String(index + 1).padStart(2, "0")}</span>{message}</motion.li>)}</ol>
          {busy && <p className="text-cyan-300">Esperando el siguiente evento…</p>}
          {run.stage === "ready" && <p className="text-cyan-300">Imagen lista. Pulsa «Identificar con Gemini Vision» para consultar.</p>}
          {run.stage === "cancelled" && <p>Solicitud cancelada. Puedes volver a identificar esta imagen.</p>}
          {run.stage === "error" && <p role="alert" className="text-rose-300">[error] {run.error}</p>}
          {run.stage === "success" && run.result && <div className="grid gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 sm:grid-cols-2"><p className="text-emerald-200">[identificado] {run.result.analysis.itemOrCharacter}</p><p>[catálogo] {run.result.totalMatches} relacionados · {run.result.inStoreInventory ? "coincidencia confirmada" : "sin coincidencia exacta"}</p></div>}
          {run.finishedAt !== undefined && <p className="text-slate-400">Tiempo medido: {((run.finishedAt - run.startedAt) / 1000).toFixed(1)} s</p>}
        </>}
      </div>
      <p className="relative border-t border-white/10 px-4 py-2 text-[10px] leading-relaxed text-slate-400">Eventos reales · Identificación estimada por IA · Disponibilidad contrastada con el catálogo</p>
    </section>
  );
}
