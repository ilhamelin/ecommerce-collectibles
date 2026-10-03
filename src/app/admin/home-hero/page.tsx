"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { HomeHeroEditor } from "@/components/admin/HomeHeroEditor";
import { Button } from "@/components/ui/button";
import { HomeHeroProductSchema, HomeHeroSettingsSchema, type HomeHeroSettings } from "@/lib/constants/homeHeroDefaults";

const ConfigurationSchema = z.object({ success: z.literal(true), data: z.object({ settings: HomeHeroSettingsSchema, products: z.array(HomeHeroProductSchema), canPersist: z.boolean() }) });
const SavedSchema = z.object({ success: z.literal(true), data: z.object({ settings: HomeHeroSettingsSchema }) });
const ErrorSchema = z.object({ error: z.string() });
function apiError(raw: unknown, fallback: string) { const error = ErrorSchema.safeParse(raw); return error.success ? error.data.error : fallback; }

async function persistSettings(settings: HomeHeroSettings): Promise<HomeHeroSettings> {
  const response = await fetch("/api/admin/home-hero", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) });
  const raw: unknown = await response.json();
  const saved = SavedSchema.safeParse(raw);
  if (!response.ok || !saved.success) throw new Error(apiError(raw, "No se guardaron los cambios. Vuelve a intentar."));
  return saved.data.data.settings;
}

export default function AdminHomeHeroPage() {
  const [configuration, setConfiguration] = useState<z.infer<typeof ConfigurationSchema>["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    async function load() {
      try {
        const response = await fetch("/api/admin/home-hero", { signal: controller.signal, cache: "no-store", credentials: "same-origin" });
        const raw: unknown = await response.json();
        const parsed = ConfigurationSchema.safeParse(raw);
        if (!response.ok || !parsed.success) throw new Error(apiError(raw, "No se pudo cargar la portada guardada."));
        if (!controller.signal.aborted) setConfiguration(parsed.data.data);
      } catch (cause: unknown) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar la portada.");
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  if (error) return <div className="mx-auto max-w-7xl space-y-4 px-6 py-10"><h1 className="text-2xl font-bold text-[#1F3A5F]">Sección principal de inicio</h1><p role="alert" className="text-sm text-red-700">{error}</p><Button onClick={() => setAttempt(value => value + 1)}>Reintentar</Button></div>;
  if (!configuration) return <p role="status" className="px-6 py-12 text-sm text-slate-600">Cargando la configuración de la portada…</p>;
  return <HomeHeroEditor products={configuration.products} canPersist={configuration.canPersist} initialSettings={configuration.settings} onSave={persistSettings} />;
}
