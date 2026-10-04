import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import { formatCLP } from "@/lib/utils/currency";
import {
  DEFAULT_HOME_HERO,
  selectHomeFeaturedProduct,
  type HomeHeroSettings,
  type HomeHeroProduct,
} from "@/lib/constants/homeHeroDefaults";

/** The editor renders this same component without navigable links. */
function HeroLink({
  href,
  preview,
  children,
  className,
}: {
  href: string;
  preview: boolean;
  children: React.ReactNode;
  className: string;
}) {
  return preview ? (
    <div className={className}>{children}</div>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function EditorialHero({
  products,
  settings = DEFAULT_HOME_HERO,
  preview = false,
  compact = false,
}: {
  products: HomeHeroProduct[];
  settings?: HomeHeroSettings;
  preview?: boolean;
  compact?: boolean;
}) {
  const featured = selectHomeFeaturedProduct(
    products,
    settings.featuredProductId,
  );
  const Heading = preview ? "h3" : "h1";
  const ProductHeading = preview ? "h4" : "h2";
  return (
    <section
      className={
        "editorial-hero mx-auto grid max-w-7xl gap-8 px-5 py-10 " +
        (compact ? "" : "sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-center")
      }
      style={
        {
          "--hero-primary": settings.primaryColor || "#1F3A5F",
          "--hero-accent": settings.accentColor || "#FF6B35",
        } as React.CSSProperties
      }
      aria-label={preview ? "Vista previa de la sección principal" : undefined}
    >
      <div className="min-w-0 space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#1F3A5F]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--hero-primary)]">
          <Sparkles size={14} className="text-[var(--hero-accent)]" />
          {settings.badge}
        </span>
        <Heading
          className={
            "max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--hero-primary)] break-words " +
            (compact ? "" : "sm:text-6xl")
          }
        >
          {settings.heading}
          <br />
          <span className="text-[var(--hero-accent)]">
            {settings.highlightedHeading}
          </span>
        </Heading>
        <p className="max-w-md text-base leading-relaxed text-slate-600 break-words">
          {settings.description}
        </p>
        <div className="flex flex-wrap gap-3">
          <HeroLink
            href={settings.primaryHref}
            preview={preview}
            className="inline-flex max-w-full items-center gap-3 rounded-full bg-[var(--hero-accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/15"
          >
            <span className="min-w-0 break-words">{settings.primaryLabel}</span>
            <ArrowRight size={17} className="shrink-0" />
          </HeroLink>
          <HeroLink
            href={settings.secondaryHref}
            preview={preview}
            className="inline-block max-w-full break-words rounded-full border border-[#1F3A5F]/20 bg-white px-6 py-3.5 text-sm font-semibold text-[var(--hero-primary)]"
          >
            {settings.secondaryLabel}
          </HeroLink>
        </div>
        <p className="text-xs text-slate-500 break-words">
          {settings.footnote}
        </p>
      </div>
      {featured ? (
        <HeroLink
          href={`/product/${featured.sku.toLowerCase()}`}
          preview={preview}
          className="editorial-feature relative block overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-[#E8EEF4] via-white to-[#FFF0E8] p-6 shadow-[0_24px_70px_-35px_#1F3A5F66] sm:p-8"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--hero-primary)]">
            <span className="rounded-full bg-white/80 px-3 py-1.5">
              {settings.spotlightLabel}
            </span>
            <ArrowUpRight size={21} />
          </div>
          <img
            src={featured.imageUrl || featured.images?.[0]}
            alt={featured.name}
            loading="eager"
            className="my-6 h-64 w-full object-contain sm:h-80"
          />
          <div className="rounded-2xl bg-white/90 p-4">
            <ProductHeading className="text-lg font-semibold leading-snug text-[var(--hero-primary)] break-words">
              {featured.name}
            </ProductHeading>
            <p className="mt-2 text-sm font-bold text-[var(--hero-accent)]">
              {formatCLP(featured.price)}{" "}
              <span className="ml-2 font-normal text-slate-500">
                {featured.isPreOrder
                  ? settings.preorderLinkLabel
                  : settings.productLinkLabel}
              </span>
            </p>
          </div>
        </HeroLink>
      ) : (
        <div className="rounded-[2rem] bg-[var(--hero-primary)] p-10 text-white">
          <Sparkles size={48} className="mb-8 text-[var(--hero-accent)]" />
          <p className="text-3xl font-semibold">
            Cada colección empieza con una pieza especial.
          </p>
          <p className="mt-5 text-sm text-slate-300">
            Explora las categorías y encuentra tu próximo favorito.
          </p>
        </div>
      )}
    </section>
  );
}
