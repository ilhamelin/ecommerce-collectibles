export interface PromoSlideData {
  id: string;
  tag: string;
  tagIcon?: string;
  title: string;
  titleHighlight: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  productBadge: string;
  productPrice?: string;
  image: string;
  highlights: string[];
  gradient?: string;
}

export const DEFAULT_PROMO_SLIDES: PromoSlideData[] = [
  {
    id: "slide-preorders",
    tag: "RESERVAS ABIERTAS • IMPORTACIÓN JAPÓN",
    tagIcon: "Clock",
    title: "Figuras Japonesas de Escala:",
    titleHighlight: "Reserva con Solo 20% de Pie",
    description:
      "Asegura figuras oficiales de Good Smile Company, Kotobukiya y Alter en pesos chilenos. Congela tu cupo sin recargos sorpresa y cancela el saldo cuando el lote llegue a Santiago.",
    primaryCtaText: "Ver Preventas de Figuras",
    primaryCtaHref: "/catalog?category=FIGURE",
    secondaryCtaText: "Explorar Catálogo",
    secondaryCtaHref: "/catalog",
    productBadge: "Makima 1/7 Scale PVC • Good Smile",
    productPrice: "Pie Inicial: $ 49.998 CLP",
    image:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Pie inicial del 20% en CLP",
      "Precio final congelado contra el dólar",
      "Embalaje blindado anti-golpes",
    ],
    gradient: "from-[#FF6B35]/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
  },
  {
    id: "slide-games",
    tag: "STOCK INMEDIATO • DESPACHO 24H",
    tagIcon: "Gamepad2",
    title: "Videojuegos Físicos & Ediciones Deluxe:",
    titleHighlight: "Elden Ring & Estrenos",
    description:
      "Ediciones físicas completas con voucher de expansión y carátula intacta para PS5, Nintendo Switch y Xbox. Stock real garantizado y envíos express a todo Chile.",
    primaryCtaText: "Ver Videojuegos",
    primaryCtaHref: "/catalog?category=VIDEO_GAME",
    secondaryCtaText: "Ver Catálogo en CLP",
    secondaryCtaHref: "/catalog",
    productBadge: "Elden Ring: Shadow of the Erdtree (PS5)",
    productPrice: "$ 79.990 CLP al contado",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Despacho rápido vía Starken y Chilexpress",
      "Hasta 12 cuotas con Webpay Plus",
      "Discos sellados de fábrica con garantía",
    ],
    gradient: "from-[#1F3A5F]/30 via-[#1F3A5F] to-[#1F3A5F]",
  },
  {
    id: "slide-tcg",
    tag: "GRADUACIÓN OFICIAL • PIEZAS ÚNICAS",
    tagIcon: "Trophy",
    title: "Cartas TCG & Joyas de Colección:",
    titleHighlight: "Certificación PSA 9 & 10",
    description:
      "Tarjetas históricas de Pokémon selladas con protección anti-UV, holograma de seguridad y número de serie oficial verificable en PSA. Despacho blindado y asegurado a todo Chile.",
    primaryCtaText: "Ver Rarezas TCG",
    primaryCtaHref: "/catalog?category=COLLECTIBLE",
    secondaryCtaText: "Ver Certificados",
    secondaryCtaHref: "/catalog?category=COLLECTIBLE",
    productBadge: "Charizard 1st Edition Base Set • PSA 10 Gem Mint",
    productPrice: "$ 195.000.000 CLP",
    image:
      "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Cápsula hermética UV oficial PSA",
      "Envío express asegurado por Starken / Chilexpress",
      "Autenticidad verificable con código QR",
    ],
    gradient: "from-amber-600/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
  },
  {
    id: "slide-bundles",
    tag: "PACK EXCLUSIVO • AHORRO DIRECTO",
    tagIcon: "Layers",
    title: "Bundles Compuestos Exclusivos:",
    titleHighlight: "Juegos, Pines & Artbooks",
    description:
      "Lleva el paquete definitivo de colección con descuento unificado. Descuento automático directo respecto a la compra individual de cada artículo del lote.",
    primaryCtaText: "Ver Bundles Compuestos",
    primaryCtaHref: "/catalog?category=BUNDLE",
    secondaryCtaText: "Explorar Todo",
    secondaryCtaHref: "/catalog",
    productBadge: "Elden Lord Ultimate Collector Bundle",
    productPrice: "$ 124.990 CLP (Ahorro de $ 24.980 CLP)",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Ahorro de hasta $ 25.000 CLP por pack",
      "Todos los productos 100% nuevos y sellados",
      "Caja protectora doble reforzada",
    ],
    gradient: "from-[#FF6B35]/15 via-[#1F3A5F]/30 to-[#1F3A5F]",
  },
];
