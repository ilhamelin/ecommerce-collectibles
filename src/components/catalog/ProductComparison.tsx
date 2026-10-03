"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, X } from "lucide-react";
import { useCompareStore } from "@/lib/store/compareStore";
import { catalogClient } from "@/lib/services/catalogClient";
import { DialogSurface } from "@/components/common/DialogSurface";
import { formatCLP } from "@/lib/utils/currency";
import { toast } from "@/lib/store/toastStore";
import type { ProductDomainEntity } from "@/lib/types/domain";
export function CompareButton({ product }: { product: ProductDomainEntity }) {
  const selected = useCompareStore(state => state.ids.includes(product.id)); const toggle = useCompareStore(state => state.toggle);
  return <button type="button" aria-pressed={selected} aria-label={(selected ? "Quitar de comparación: " : "Comparar: ") + product.name} onClick={() => { if (toggle(product.id) === "full") toast.error("Puedes comparar hasta tres productos. Quita uno para agregar otro."); }} className={"inline-flex gap-2 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition " + (selected ? "bg-[#1F3A5F] border-[#1F3A5F] text-white" : "bg-white text-[#1F3A5F] hover:border-[#FF6B35]")}><ArrowLeftRight size={14}/>{selected ? "En comparación" : "Comparar"}</button>;
}
export function comparisonRows(products: ProductDomainEntity[]) {
  const rows: { label: string; values: string[] }[] = [
    { label: "Precio de venta", values: products.map(p => formatCLP(p.price)) },
    { label: "Categoría", values: products.map(p => p.customCategoryLabel || p.type) },
    { label: "Disponibilidad", values: products.map(p => p.isPreOrder ? "Preventa" : p.stockAvailable > p.stockReserved ? "En stock" : "Agotado") },
  ];
  const fields: [string, (p: ProductDomainEntity) => unknown][] = [
    ["Plataforma", p => p.gameMetadata?.platform], ["Edición", p => p.gameMetadata?.edition],
    ["Fabricante", p => p.figureMetadata?.manufacturer], ["Escala", p => p.figureMetadata?.scale],
    ["Material", p => p.figureMetadata?.material], ["Rareza", p => p.collectibleMetadata?.rarity],
    ["Condición", p => p.collectibleMetadata?.condition], ["Idioma", p => p.collectibleMetadata?.language || p.customSpecifications?.book?.language],
    ["Expansión", p => p.collectibleMetadata?.setExpansion],
    ["Modelo", p => p.customSpecifications?.console?.baseModel || p.customSpecifications?.hardware?.model],
    ["Capacidad", p => p.customSpecifications?.console?.capacity || p.customSpecifications?.hardware?.capacityOrSpeed || p.customSpecifications?.hardware?.ssd?.capacity],
    ["Marca", p => p.customSpecifications?.hardware?.brand || p.customSpecifications?.gamingAccessory?.controller?.brand || p.customSpecifications?.gamingAccessory?.mouse?.brand || p.customSpecifications?.gamingAccessory?.keyboard?.brand],
    ["Compatibilidad", p => p.customSpecifications?.console?.gameCompatibility || p.customSpecifications?.gamingAccessory?.controller?.platformCompatibility || p.customSpecifications?.hardware?.interfaceOrSocket],
    ["Tipo de accesorio", p => p.customSpecifications?.gamingAccessory?.accessoryType],
    ["Editorial", p => p.customSpecifications?.book?.publisher], ["Páginas", p => p.customSpecifications?.book?.pages],
  ];
  for (const [label, getter] of fields) if (products.some(p => getter(p))) rows.push({ label, values: products.map(p => String(getter(p) || "No informado")) });
  return rows;
}
export function ProductComparison() {
  const ids = useCompareStore(state => state.ids); const remove = useCompareStore(state => state.remove);
  const [products, setProducts] = useState<ProductDomainEntity[]>([]); const [open, setOpen] = useState(false); const [ready, setReady] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setReady(true); return catalogClient.subscribe(catalog => { setProducts(catalog); useCompareStore.getState().reconcile(new Set(catalog.map(p => p.id))); }); }, []);
  useEffect(() => { if (ids.length) void catalogClient.getCatalog().then(setProducts); }, [ids.length]);
  const selected = ids.map(id => products.find(p => p.id === id)).filter((p): p is ProductDomainEntity => !!p);
  if (!ready || !ids.length || pathname.startsWith("/admin") || pathname === "/portfolio") return null;
  return <><div className="fixed bottom-16 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 flex gap-3 items-center bg-[#1F3A5F] text-white rounded-2xl shadow-xl px-4 py-3 max-w-[calc(100vw-2rem)]"><ArrowLeftRight size={18}/><span className="text-xs whitespace-nowrap">{ids.length}/3 productos</span><button type="button" disabled={selected.length < 2} onClick={() => setOpen(true)} className="rounded-xl bg-[#FF6B35] px-3 py-2 text-sm font-bold disabled:opacity-50">Comparar</button><button type="button" aria-label="Vaciar comparación" onClick={() => useCompareStore.getState().clear()}><X size={18}/></button></div>
    {open && <DialogSurface label="Comparador de productos" onClose={() => setOpen(false)} className="max-w-5xl w-[calc(100vw-1.5rem)] p-0"><div className="p-5 sm:p-7"><header className="flex justify-between items-start gap-4 mb-5"><div><h2 className="text-2xl font-black text-[#1F3A5F]">Tu próxima pieza, en perspectiva</h2><p className="text-sm text-slate-600 mt-1">Datos actuales del catálogo. Desliza la tabla en pantallas pequeñas.</p></div><button aria-label="Cerrar comparación" onClick={() => setOpen(false)}><X/></button></header><div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><caption className="sr-only">Comparación de precio y ficha técnica</caption><thead><tr><th className="w-32 p-3">Características</th>{selected.map(p => <th key={p.id} className="p-3 min-w-[180px]"><button type="button" className="float-right p-1" aria-label={"Quitar " + p.name} onClick={() => remove(p.id)}><X size={15}/></button>{(p.imageUrl || p.images?.[0]) && <img src={p.imageUrl || p.images?.[0]} alt="" className="h-28 w-full object-contain mb-3"/>}<Link onClick={() => setOpen(false)} href={"/product/" + p.sku.toLowerCase()} className="text-[#1F3A5F] hover:underline">{p.name}</Link></th>)}</tr></thead><tbody>{comparisonRows(selected).map(row => <tr key={row.label} className="border-t even:bg-slate-50"><th scope="row" className="p-3 text-slate-600 font-medium">{row.label}</th>{row.values.map((value, index) => <td key={selected[index].id} className="p-3 text-[#1F3A5F]">{value}</td>)}</tr>)}</tbody></table></div>{selected.length < 2 && <p role="status" className="mt-4 text-sm">Agrega otro producto desde el catálogo para comparar.</p>}</div></DialogSurface>}
  </>;
}
