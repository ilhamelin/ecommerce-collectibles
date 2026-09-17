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
  linkedProductSku?: string;
}

export const DEFAULT_PROMO_SLIDES: PromoSlideData[] = [
  {
    id: "slide-store",
    tag: "TIENDA OFICIAL • NICHO COLECCIONISTA",
    tagIcon: "Sparkles",
    title: "OmniCollector Chile:",
    titleHighlight: "Tu Colección 100% Original",
    description:
      "Productos originales importados y sellados de fábrica en pesos chilenos. Envíos asegurados y protegidos a todo Chile con boleta y garantía oficial.",
    primaryCtaText: "Explorar Catálogo",
    primaryCtaHref: "/catalog",
    secondaryCtaText: "Ver Videojuegos",
    secondaryCtaHref: "/catalog?category=VIDEO_GAME",
    productBadge: "Catálogo Oficial OmniCollector",
    productPrice: "Envíos a todo Chile",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Hasta 12 cuotas sin interés con Webpay y Mercado Pago",
      "Embalaje reforzado anti-golpes para envíos",
      "Productos 100% nuevos sellados de distribuidor",
    ],
    gradient: "from-[#FF6B35]/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
  },
  {
    id: "slide-games",
    tag: "STOCK INMEDIATO • DESPACHO 24H",
    tagIcon: "Gamepad2",
    title: "Videojuegos Físicos & Ediciones Especiales:",
    titleHighlight: "PlayStation, Switch & Xbox",
    description:
      "Ediciones físicas completas con empaque intacto de fábrica. Catálogo actualizado en tiempo real directamente desde nuestra bodega.",
    primaryCtaText: "Ver Videojuegos",
    primaryCtaHref: "/catalog?category=VIDEO_GAME",
    secondaryCtaText: "Ver Catálogo Completo",
    secondaryCtaHref: "/catalog",
    productBadge: "Ediciones Físicas Selladas",
    productPrice: "Precios en CLP al Contado",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Despacho rápido vía Starken y Chilexpress",
      "Discos y cartuchos originales sellados",
      "Garantía oficial y seguimiento en línea",
    ],
    gradient: "from-[#1F3A5F]/30 via-[#1F3A5F] to-[#1F3A5F]",
  },
  {
    id: "slide-preorders",
    tag: "SISTEMA PRE-VENTA • CONGELA TU PRECIO",
    tagIcon: "Clock",
    title: "Preventas Oficiales:",
    titleHighlight: "Reserva con Pie Inicial en CLP",
    description:
      "Asegura tus lanzamientos y figuras exclusivas con abono inicial diferido en pesos chilenos. Congela tu cupo sin recargos y salda cuando el lote arribe.",
    primaryCtaText: "Ver Catálogo",
    primaryCtaHref: "/catalog",
    secondaryCtaText: "Consultar Stock",
    secondaryCtaHref: "/catalog",
    productBadge: "Sistema de Reserva Garantizada",
    productPrice: "Pie Inicial desde 20%",
    image:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80",
    highlights: [
      "Congela el valor contra la inflación y divisas",
      "Respaldo oficial con comprobante y boleta legal",
      "Notificaciones en tiempo real del estado de arribo",
    ],
    gradient: "from-[#FF6B35]/15 via-[#1F3A5F]/30 to-[#1F3A5F]",
  },
];
