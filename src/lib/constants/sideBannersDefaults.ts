export interface SideBannerItem {
  enabled: boolean;
  imageUrl: string;
  targetUrl: string;
  altText?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  accentColor?: string;
}

export interface SideBannersConfig {
  enabled: boolean; // Master switch
  leftBanner: SideBannerItem;
  rightBanner: SideBannerItem;
}

/**
 * Clean default state without fake/reference placeholder images.
 * Banners remain inactive until the administrator configures their real images.
 */
export const DEFAULT_SIDE_BANNERS: SideBannersConfig = {
  enabled: false,
  leftBanner: {
    enabled: false,
    imageUrl: "",
    targetUrl: "/catalog",
    altText: "Banner Lateral Izquierdo",
    title: "",
    subtitle: "",
    badge: "",
    ctaText: "Ver Catálogo",
    accentColor: "#FF6B35",
  },
  rightBanner: {
    enabled: false,
    imageUrl: "",
    targetUrl: "/catalog",
    altText: "Banner Lateral Derecho",
    title: "",
    subtitle: "",
    badge: "",
    ctaText: "Ver Catálogo",
    accentColor: "#FF6B35",
  },
};

/**
 * Suggestions for quick routing only - without fake/unrelated placeholder photos.
 */
export const POPULAR_SIDE_PRESETS = [
  {
    name: "Videojuegos & Consolas",
    title: "VIDEOJUEGOS",
    imageUrl: "",
    targetUrl: "/catalog?category=VIDEO_GAME",
    altText: "Póster de Videojuegos",
    accentColor: "#3B82F6",
  },
  {
    name: "Figuras Japonesas Originales",
    title: "FIGURAS JAPÓN",
    imageUrl: "",
    targetUrl: "/catalog?category=FIGURE",
    altText: "Póster de Figuras Japonesas",
    accentColor: "#EC4899",
  },
  {
    name: "TCG & Cartas Graduadas PSA",
    title: "TCG & CARTAS",
    imageUrl: "",
    targetUrl: "/catalog?category=COLLECTIBLE",
    altText: "Póster de Cartas TCG",
    accentColor: "#EAB308",
  },
  {
    name: "Bundles & Ofertas Especiales",
    title: "BUNDLES",
    imageUrl: "",
    targetUrl: "/catalog?category=BUNDLE",
    altText: "Póster de Bundles y Packs",
    accentColor: "#FF6B35",
  },
];
