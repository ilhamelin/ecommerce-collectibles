import { z } from "zod";

export const HomeHeroProductSchema = z.object({
  id: z.string(), sku: z.string(), name: z.string(), price: z.number(),
  stockAvailable: z.number(), stockReserved: z.number(), isPreOrder: z.boolean(),
  imageUrl: z.string().optional(), images: z.array(z.string()).optional(),
});
export type HomeHeroProduct = z.infer<typeof HomeHeroProductSchema>;

/** Only local storefront destinations are accepted; encoded redirects are rejected too. */
export function isHomeHeroLink(value: string): boolean {
  try {
    const decoded = decodeURIComponent(value);
    return /^(?:\/(?!\/)[A-Za-z0-9/_?&=.%#~+-]*|#[A-Za-z][A-Za-z0-9_-]*)$/.test(value)
      && /^(?:\/(?!\/)[A-Za-z0-9/_?&=.%#~+-]*|#[A-Za-z][A-Za-z0-9_-]*)$/.test(decoded);
  } catch {
    return false;
  }
}

const text = (max: number) => z.string().trim().min(1, "Completa los textos de la portada.").max(max, `El texto admite hasta ${max} caracteres.`);
const destination = z.string().trim().max(240).refine(isHomeHeroLink, "Usa un enlace interno como /catalog o #colecciones.");

export const HomeHeroSettingsSchema = z.object({
  badge: text(80),
  heading: text(90),
  highlightedHeading: text(90),
  description: text(360),
  primaryLabel: text(60),
  primaryHref: destination,
  secondaryLabel: text(60),
  secondaryHref: destination,
  footnote: text(180),
  spotlightLabel: text(60),
  productLinkLabel: text(60),
  preorderLinkLabel: text(80),
  featuredProductId: z.string().trim().min(1).max(128).regex(/^[^/\\\x00-\x1f]+$/).nullable(),
}).strict();

export type HomeHeroSettings = z.infer<typeof HomeHeroSettingsSchema>;

export const DEFAULT_HOME_HERO: HomeHeroSettings = {
  badge: "Para quienes coleccionan historias",
  heading: "Tu próxima pieza.",
  highlightedHeading: "Tu próxima historia.",
  description: "Figuras, videojuegos y universos que merecen un lugar en tu colección. Descubre algo que conecte contigo.",
  primaryLabel: "Explorar el catálogo",
  primaryHref: "/catalog",
  secondaryLabel: "Elegir mi universo",
  secondaryHref: "#colecciones",
  footnote: "Precios en CLP · Catálogo especializado · Favoritos para tu colección",
  spotlightLabel: "En el spotlight",
  productLinkLabel: "Ver producto",
  preorderLinkLabel: "Preventa · ver condiciones",
  featuredProductId: null,
};

export function canFeatureHomeProduct(product: HomeHeroProduct): boolean {
  return Boolean(product.sku && (product.imageUrl || product.images?.[0])
    && (product.isPreOrder || product.stockAvailable > product.stockReserved));
}

/** Resolve against the current catalog, never against a saved product snapshot. O(n). */
export function selectHomeFeaturedProduct<T extends HomeHeroProduct>(products: T[], productId: string | null): T | undefined {
  const selected = productId ? products.find(product => product.id === productId && canFeatureHomeProduct(product)) : undefined;
  return selected ?? products.find(canFeatureHomeProduct);
}
