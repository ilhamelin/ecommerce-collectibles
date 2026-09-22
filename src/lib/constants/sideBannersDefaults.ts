export interface SideBannerItem {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  targetUrl: string;
  ctaText: string;
  accentColor: string; // e.g. "#FF6B35" or "#3B82F6"
}

export interface SideBannersConfig {
  enabled: boolean; // Master switch
  leftBanner: SideBannerItem;
  rightBanner: SideBannerItem;
}

export const DEFAULT_SIDE_BANNERS: SideBannersConfig = {
  enabled: true,
  leftBanner: {
    enabled: true,
    title: "ELDEN RING",
    subtitle: "Shadow of the Erdtree • Edición Física",
    badge: "EXPANSIÓN DEL AÑO",
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    ctaText: "Ver Videojuegos",
    accentColor: "#EAB308", // Amber gold
  },
  rightBanner: {
    enabled: true,
    title: "POKÉMON TCG",
    subtitle: "Cápsulas PSA 10 & Colección Sellada",
    badge: "GRADUACIÓN MINT",
    imageUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=COLLECTIBLE",
    ctaText: "Ver Cartas PSA",
    accentColor: "#FF6B35", // Vibrant Orange
  },
};

export const POPULAR_SIDE_PRESETS = [
  {
    name: "Elden Ring: Shadow of the Erdtree",
    title: "ELDEN RING",
    subtitle: "DLC & Ediciones Coleccionista",
    badge: "GOTY WINNER",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    ctaText: "Explorar Títulos",
    accentColor: "#EAB308",
  },
  {
    name: "Final Fantasy VII Rebirth",
    title: "FINAL FANTASY VII",
    subtitle: "Rebirth • Deluxe Steelbook",
    badge: "ESTRENO PS5",
    imageUrl:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    ctaText: "Ver Preventas",
    accentColor: "#06B6D4",
  },
  {
    name: "Figuras Scale 1/7 Good Smile",
    title: "FIGURAS JAPÓN",
    subtitle: "Escalas 1/7 & Nendoroid Originales",
    badge: "IMPORTACIÓN DIRECTA",
    imageUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=FIGURE",
    ctaText: "Reservar con 20%",
    accentColor: "#EC4899",
  },
  {
    name: "Pokémon TCG & PSA Cards",
    title: "POKÉMON TCG",
    subtitle: "Slabs Certificados PSA 10 & 9",
    badge: "PIEZAS ÚNICAS",
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=COLLECTIBLE",
    ctaText: "Ver Catálogo TCG",
    accentColor: "#FF6B35",
  },
  {
    name: "Zelda: Tears of the Kingdom",
    title: "ZELDA TOTK",
    subtitle: "Nintendo Switch • Físico Sellado",
    badge: "OBRA MAESTRA",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    ctaText: "Comprar Ahora",
    accentColor: "#10B981",
  },
];
