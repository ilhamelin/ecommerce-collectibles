import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductDomainEntity } from "@/lib/types/domain";
import { ProductCard } from "@/components/catalog/ProductCard";

export { EditorialHero } from "./EditorialHero";

export function CollectionShelves({ products }: { products: ProductDomainEntity[] }) {
  const available = products.filter(product => product.stockAvailable > product.stockReserved && product.type !== "BUNDLE");
  const newest = [...available].sort((a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0)).slice(0, 4);
  const preorders = products.filter(product => product.isPreOrder && product.stockAvailable > product.stockReserved).slice(0, 4);
  return <>{[{ title: "Últimas incorporaciones", subtitle: "Nuevas piezas para tu vitrina", items: newest }, { title: "Antes de que lleguen", subtitle: "Explora las preventas y sus condiciones", items: preorders }].filter(section => section.items.length > 0).map(section => <section key={section.title} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-semibold tracking-wide text-[#FF6B35]">{section.subtitle}</p><h2 className="text-2xl font-semibold tracking-tight text-[#1F3A5F] sm:text-3xl">{section.title}</h2></div><Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F3A5F]">Ver catálogo<ArrowRight size={16} /></Link></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{section.items.map(product => <ProductCard key={product.id} product={product} />)}</div></section>)}</>;
}
