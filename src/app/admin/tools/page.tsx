"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Images,
  FileSpreadsheet,
  Palette,
  MessageSquare,
  Share2,
} from "lucide-react";
import { MediaLibrary } from "@/components/admin/tools/MediaLibrary";
import { ProductImporter } from "@/components/admin/tools/ProductImporter";
import { StoreLaboratory } from "@/components/admin/tools/StoreLaboratory";
import { AdminAssistant } from "@/components/admin/tools/AdminAssistant";
import { SocialCards } from "@/components/admin/tools/SocialCards";
import { toolRequest } from "@/lib/admin-tools/client";
import type { ProductDomainEntity } from "@/lib/types/domain";
const tabs = [
  { id: "media", label: "Imágenes", icon: Images },
  { id: "import", label: "Excel / CSV", icon: FileSpreadsheet },
  { id: "social", label: "Fichas para redes", icon: Share2 },
  { id: "lab", label: "Laboratorio", icon: Palette },
  { id: "assistant", label: "Asistente", icon: MessageSquare },
] as const;
function Tools() {
  const query = useSearchParams();
  const router = useRouter();
  const tab = tabs.find((item) => item.id === query.get("tab"))?.id || "media";
  const [products, setProducts] = useState<ProductDomainEntity[] | null>(null);
  const [error, setError] = useState("");
  async function load() {
    try {
      setProducts(
        await toolRequest<ProductDomainEntity[]>("/api/admin/tools/catalog"),
      );
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar el catálogo.",
      );
    }
  }
  useEffect(() => {
    if (tab === "social" || tab === "lab") void load();
  }, [tab]);
  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      <header>
        <p className="text-xs text-orange-600 font-bold tracking-widest uppercase">
          Crear · revisar · publicar
        </p>
        <h1 className="text-3xl font-black text-[#1F3A5F] mt-2">
          Contenido y herramientas
        </h1>
        <p className="text-sm text-slate-600 mt-3">
          Tu espacio para preparar el catálogo y los diseños de OmniCollector.
        </p>
      </header>
      <nav
        aria-label="Herramientas de administración"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            aria-pressed={tab === item.id}
            onClick={() => router.push("/admin/tools?tab=" + item.id)}
            className={
              "flex shrink-0 gap-2 items-center rounded-xl p-3 text-sm font-bold " +
              (tab === item.id
                ? "bg-[#1F3A5F] text-white"
                : "bg-white border text-slate-600")
            }
          >
            <item.icon aria-hidden className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="rounded-3xl border bg-white p-5 sm:p-8 shadow-sm min-h-[400px]">
        {tab === "media" && <MediaLibrary />}
        {tab === "import" && <ProductImporter />}
        {tab === "assistant" && <AdminAssistant />}
        {(tab === "social" || tab === "lab") && (
          <>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
                <button onClick={() => void load()} className="ml-3 underline">
                  Reintentar
                </button>
              </p>
            )}
            {!products && !error && <p role="status">Cargando catálogo…</p>}
            {products &&
              (tab === "social" ? (
                <SocialCards key="social" products={products} />
              ) : (
                <StoreLaboratory key="lab" products={products} />
              ))}
          </>
        )}
      </div>
    </main>
  );
}
export default function ToolsPage() {
  return (
    <Suspense fallback={<p className="p-8">Cargando herramientas…</p>}>
      <Tools />
    </Suspense>
  );
}
