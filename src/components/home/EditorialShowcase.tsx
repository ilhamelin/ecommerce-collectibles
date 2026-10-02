import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import type { ProductDomainEntity } from "@/lib/types/domain";
import { ProductCard } from "@/components/catalog/ProductCard";
import { formatCLP } from "@/lib/utils/currency";

export function EditorialHero({ products }: { products: ProductDomainEntity[] }) {
  const featured = products.find(product => (product.imageUrl || product.images?.[0]) && (product.isPreOrder || product.stockAvailable > product.stockReserved));
  return <section className="editorial-hero mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-center">
    <div className="space-y-6">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#1F3A5F]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1F3A5F]"><Sparkles size={14} className="text-[#FF6B35]" />Para quienes coleccionan historias</span>
      <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-[#1F3A5F] sm:text-6xl">Tu próxima pieza.<br /><span className="text-[#FF6B35]">Tu próxima historia.</span></h1>
      <p className="max-w-md text-base leading-relaxed text-slate-600">Figuras, videojuegos y universos que merecen un lugar en tu colección. Descubre algo que conecte contigo.</p>
      <div className="flex flex-wrap gap-3"><Link href="/catalog" className="inline-flex items-center gap-3 rounded-full bg-[#FF6B35] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/15">Explorar el catálogo<ArrowRight size={17} /></Link><Link href="#colecciones" className="rounded-full border border-[#1F3A5F]/20 bg-white px-6 py-3.5 text-sm font-semibold text-[#1F3A5F]">Elegir mi universo</Link></div>
      <p className="text-xs text-slate-500">Precios en CLP · Catálogo especializado · Favoritos para tu colección</p>
    </div>
    {featured ? <Link href={`/product/${featured.sku.toLowerCase()}`} className="editorial-feature relative block overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-[#E8EEF4] via-white to-[#FFF0E8] p-6 shadow-[0_24px_70px_-35px_#1F3A5F66] sm:p-8">
      <div className="flex items-center justify-between text-xs font-semibold text-[#1F3A5F]"><span className="rounded-full bg-white/80 px-3 py-1.5">En el spotlight</span><ArrowUpRight size={21} /></div>
      <img src={featured.imageUrl || featured.images?.[0]} alt={featured.name} loading="eager" className="my-6 h-64 w-full object-contain sm:h-80" />
      <div className="rounded-2xl bg-white/90 p-4"><h2 className="text-lg font-semibold leading-snug text-[#1F3A5F]">{featured.name}</h2><p className="mt-2 text-sm font-bold text-[#FF6B35]">{formatCLP(featured.price)} <span className="ml-2 font-normal text-slate-500">{featured.isPreOrder ? "Preventa · ver condiciones" : "Ver producto"}</span></p></div>
    </Link> : <div className="rounded-[2rem] bg-[#1F3A5F] p-10 text-white"><Sparkles size={48} className="mb-8 text-[#FF6B35]" /><p className="text-3xl font-semibold">Cada colección empieza con una pieza especial.</p><p className="mt-5 text-sm text-slate-300">Explora las categorías y encuentra tu próximo favorito.</p></div>}
  </section>;
}

export function CollectionShelves({ products }: { products: ProductDomainEntity[] }) {
  const available = products.filter(product => product.stockAvailable > product.stockReserved && product.type !== "BUNDLE");
  const newest = [...available].sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0)).slice(0, 4);
  const preorders = products.filter(product => product.isPreOrder && product.stockAvailable > product.stockReserved).slice(0, 4);
  return <>{[{ title: "Últimas incorporaciones", subtitle: "Nuevas piezas para tu vitrina", items: newest }, { title: "Antes de que lleguen", subtitle: "Explora las preventas y sus condiciones", items: preorders }].filter(section => section.items.length > 0).map(section => <section key={section.title} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-semibold tracking-wide text-[#FF6B35]">{section.subtitle}</p><h2 className="text-2xl font-semibold tracking-tight text-[#1F3A5F] sm:text-3xl">{section.title}</h2></div><Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F3A5F]">Ver catálogo<ArrowRight size={16} /></Link></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{section.items.map(product => <ProductCard key={product.id} product={product} />)}</div></section>)}</>;
}
