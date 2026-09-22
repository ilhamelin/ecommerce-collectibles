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

export const DEFAULT_SIDE_BANNERS: SideBannersConfig = {
  enabled: true,
  leftBanner: {
    enabled: true,
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    altText: "Póster promocional Videojuegos - OmniCollector",
    title: "ELDEN RING",
    subtitle: "Shadow of the Erdtree",
    badge: "DESTACADO",
    ctaText: "Ver Videojuegos",
    accentColor: "#EAB308",
  },
  rightBanner: {
    enabled: true,
    imageUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=COLLECTIBLE",
    altText: "Póster promocional TCG & Rarezas - OmniCollector",
    title: "POKÉMON TCG",
    subtitle: "Cartas Graduadas PSA Mint",
    badge: "MINT 10",
    ctaText: "Ver Cartas PSA",
    accentColor: "#FF6B35",
  },
};

export const POPULAR_SIDE_PRESETS = [
  {
    name: "Elden Ring: Shadow of the Erdtree",
    title: "ELDEN RING",
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    altText: "Elden Ring Shadow of the Erdtree",
    accentColor: "#EAB308",
  },
  {
    name: "Final Fantasy VII Rebirth",
    title: "FINAL FANTASY VII",
    imageUrl:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    altText: "Final Fantasy VII Rebirth Deluxe",
    accentColor: "#06B6D4",
  },
  {
    name: "Figuras Japonesas de Escala 1/7",
    title: "FIGURAS JAPÓN",
    imageUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=FIGURE",
    altText: "Figuras Japonesas Importación",
    accentColor: "#EC4899",
  },
  {
    name: "Pokémon TCG & Cartas PSA",
    title: "POKÉMON TCG",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=COLLECTIBLE",
    altText: "Pokémon TCG Slabs PSA 10",
    accentColor: "#FF6B35",
  },
  {
    name: "The Legend of Zelda: TotK",
    title: "ZELDA TOTK",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    altText: "The Legend of Zelda Tears of the Kingdom",
    accentColor: "#10B981",
  },
  {
    name: "Cyberpunk 2077 Night City",
    title: "CYBERPUNK",
    imageUrl:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80",
    targetUrl: "/catalog?category=VIDEO_GAME",
    altText: "Cyberpunk 2077 Night City",
    accentColor: "#F59E0B",
  },
];
