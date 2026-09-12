"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Trophy,
  CreditCard,
  Truck,
  CheckCircle2,
  Star,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PromotionalSlider } from "@/components/home/PromotionalSlider";

const FEATURED_PREORDERS = [
  {
    id: "prod-fig-01",
    sku: "FIG-MAKIMA-17",
    name: "Makima 1/7 Scale PVC Figure (Chainsaw Man)",
    description: "Escala 1/7 licenciada de alta fidelidad, pintada a mano con base de diorama exclusiva.",
    type: "FIGURE" as const,
    price: 249990,
    costPrice: 160000,
    stockAvailable: 15,
    stockReserved: 0,
    isPreOrder: true,
    preOrderState: "PREORDER_OPEN" as const,
    figureMetadata: {
      id: "meta-fig-01",
      productId: "prod-fig-01",
      scale: "SCALE_1_7" as const,
      manufacturer: "GOOD_SMILE_COMPANY" as const,
      estimatedArrivalDate: "Noviembre 2026",
      allowsPartialDeposit: true,
      minimumDepositPercent: 0.2, // 20%
    },
  },
  {
    id: "prod-fig-02",
    sku: "FIG-LINK-NENDO",
    name: "Nendoroid Link: Tears of the Kingdom Ver.",
    description: "Figura articulada no a escala con partes intercambiables y espada maestra.",
    type: "FIGURE" as const,
    price: 64990,
    costPrice: 42000,
    stockAvailable: 40,
    stockReserved: 0,
    isPreOrder: true,
    preOrderState: "MANUFACTURING" as const,
    figureMetadata: {
      id: "meta-fig-02",
      productId: "prod-fig-02",
      scale: "NENDOROID" as const,
      manufacturer: "GOOD_SMILE_COMPANY" as const,
      estimatedArrivalDate: "Diciembre 2026",
      allowsPartialDeposit: true,
      minimumDepositPercent: 0.3, // 30%
    },
  },
];

const EXCLUSIVE_BUNDLE = {
  id: "prod-bun-01",
  sku: "BUN-ELDEN-MASTER",
  name: "Elden Lord Ultimate Collector Bundle (Game + Pins + Artbook)",
  description:
    "Pack exclusivo de colección: Videojuego físico PS5 + Trío de Pines esmaltados en oro envejecido + Artbook oficial de 250 páginas a todo color con descuento especial por pack.",
  type: "BUNDLE" as const,
  price: 124990,
  costPrice: 97990,
  stockAvailable: 0,
  stockReserved: 0,
  isPreOrder: false,
  calculatedAvailableStock: 25,
  aggregateMarginPercent: 21.6,
  nominalSumOfItems: 149970,
};

const CERTIFIED_COLLECTIBLES = [
  {
    id: "prod-col-01",
    sku: "TCG-CHARIZARD-PSA9",
    name: "Charizard 1st Edition Shadowless Base Set 4/102 (PSA 9 Mint)",
    description: "Carta coleccionable certificada con cápsula hermética UV y código QR de autenticación.",
    type: "COLLECTIBLE" as const,
    price: 4890000,
    costPrice: 4100000,
    stockAvailable: 1,
    stockReserved: 0,
    isPreOrder: false,
    collectibleMetadata: {
      id: "meta-col-01",
      productId: "prod-col-01",
      category: "TCG" as const,
      condition: "MINT_9" as const,
      cardLanguage: "English",
      authenticationBody: "PSA" as const,
      serialNumber: "PSA-88492019",
    },
  },
  {
    id: "prod-vg-01",
    sku: "VG-ELDEN-PS5",
    name: "Elden Ring: Shadow of the Erdtree Edition (PS5)",
    description: "Edición física oficial sellada de fábrica con voucher de expansión Shadow of the Erdtree y despacho prioritario a todo Chile.",
    type: "VIDEO_GAME" as const,
    price: 79990,
    costPrice: 69990,
    stockAvailable: 25,
    stockReserved: 0,
    isPreOrder: false,
    gameMetadata: {
      id: "meta-vg-01",
      productId: "prod-vg-01",
      platform: "PS5" as const,
      edition: "STANDARD" as const,
      isDigital: false,
      publisher: "Bandai Namco",
    },
  },
];

export default function StorefrontHomePage() {
  const [products, setProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products)) {
          setProducts(data.data.products);
        }
      })
      .catch((err) => console.error("Error cargando productos de inicio:", err));
  }, []);

  const preOrders = React.useMemo(() => {
    const list = products.filter((p) => p.isPreOrder);
    return list.length > 0 ? list.slice(0, 4) : FEATURED_PREORDERS;
  }, [products]);

  const bundleProduct = React.useMemo(() => {
    return products.find((p) => p.type === "BUNDLE") || EXCLUSIVE_BUNDLE;
  }, [products]);

  const collectibleProducts = React.useMemo(() => {
    const list = products.filter((p) => !p.isPreOrder);
    return list.length > 0 ? list.slice(0, 4) : CERTIFIED_COLLECTIBLES;
  }, [products]);

  return (
    <div className="space-y-16 pb-16">
      {/* Automatic Promotional Slider */}
      <PromotionalSlider />

      {/* Section 1: Pre-orders */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Preventas Oficiales
            </div>
            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
              Figuras Japonesas de Escala & Nendoroid
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Reserva con solo el 20% o 30% inicial en CLP. Saldo diferido al ingresar al país.
            </p>
          </div>

          <Link
            href="/catalog?category=FIGURE"
            className="text-xs font-semibold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
          >
            Ver Todas las Figuras <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {preOrders.map((fig) => (
            <ProductCard key={fig.id || fig.sku} product={fig} />
          ))}
        </div>
      </section>

      {/* Section 2: Bundling */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" /> Bundles Exclusivos
            </div>
            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
              Paquetes de Colección con Ahorro Garantizado
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Combos exclusivos de colección: videojuego + coleccionables oficiales con hasta 20% de descuento.
            </p>
          </div>

          <Link
            href="/catalog?category=BUNDLE"
            className="text-xs font-semibold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
          >
            Ver Bundles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="max-w-xl mx-auto md:max-w-none">
          <ProductCard product={bundleProduct} />
        </div>
      </section>

      {/* Section 3: Certified Collectibles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4" /> TCG & Rarezas Certificadas
            </div>
            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mt-1">
              Cartas PSA Mint & Videojuegos Físicos Sellados
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Piezas únicas con certificación internacional listas para despacho express a todo Chile.
            </p>
          </div>

          <Link
            href="/catalog?category=COLLECTIBLE"
            className="text-xs font-semibold text-[#FF6B35] hover:text-[#E85A24] flex items-center gap-1 transition"
          >
            Ver Coleccionables <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collectibleProducts.map((item) => (
            <ProductCard key={item.id || item.sku} product={item} />
          ))}
        </div>
      </section>

      {/* Commercial Section 4: Why choose us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 lg:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] bg-[#FF6B35]/10 px-3 py-1 rounded-full border border-[#FF6B35]/20">
              Compromiso OmniCollector
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] mt-3">
              ¿Por qué confiar en nosotros para tu colección?
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-2">
              Somos coleccionistas apasionados entregando seguridad, autenticidad garantizada y la mejor experiencia de compra en Chile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">100% Original Licenciado</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Importamos directamente desde Japón y distribuidores oficiales. Sin réplicas ni bootlegs, cajas con sellos de autenticidad.
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Precio Congelado</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Asegura tus preventas con solo un pie del 20% o 30%. El precio en CLP queda congelado sin importar las variaciones del dólar o yen.
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-sm">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Embalaje Mint de Colección</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Triple capa de plástico burbuja, esquineros reforzados y cajas de cartón corrugado grueso para proteger tus figuras y cajas originales.
              </p>
            </div>

            <div className="bg-[#F7F7F5] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] text-[#1F3A5F] flex items-center justify-center font-bold shadow-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Hasta 12 Cuotas sin Interés</h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Paga de forma 100% segura con Webpay Plus, tarjetas de crédito, débito Redcompra y transferencia bancaria directa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Section 5: Official Brands & Licenses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <p className="text-xs uppercase font-bold tracking-widest text-[#666666]">
            Distribuidores Oficiales de las Mejores Marcas del Mundo
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {[
            { name: "Good Smile Company", tag: "Nendoroid & Pop Up Parade" },
            { name: "Bandai Namco", tag: "SH Figuarts & Ichibankuji" },
            { name: "The Pokémon Company", tag: "TCG Oficial Sellado" },
            { name: "Kotobukiya", tag: "ARTFX & Bishoujo" },
            { name: "Square Enix", tag: "Bring Arts & Masterline" },
            { name: "Nintendo", tag: "Videojuegos & Amiibo" },
            { name: "Alter Japan", tag: "Escalas Premium 1/7" },
          ].map((brand) => (
            <div
              key={brand.name}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#FF6B35] transition text-center shadow-sm"
            >
              <div className="text-sm font-black text-[#1A1A1A]">{brand.name}</div>
              <div className="text-[10px] text-[#666666]">{brand.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Commercial Section 6: Collector Club & Coupon Promo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#1F3A5F] via-[#244673] to-[#1F3A5F] border border-[#1F3A5F] shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B35] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> Beneficio Exclusivo
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Únete al Club de Coleccionistas y obtén $5.000 CLP de Descuento
              </h3>
              <p className="text-xs sm:text-sm text-[#F7F7F5]/90 max-w-xl">
                Suscríbete con tu correo para recibir alertas prioritarias de preventas japonesas, reposición de stock difícil de conseguir y un cupón de bienvenida para tu primera orden.
              </p>
            </div>

            <div className="w-full lg:w-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-[#152842] border border-[#2D5180] px-4 py-3 rounded-xl flex items-center gap-3 w-full sm:w-auto shadow-inner">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">Cupón de Bienvenida</span>
                  <span className="text-base font-black text-[#FF6B35] tracking-wider font-mono">COLECCIONISTA5K</span>
                </div>
              </div>
              <Link
                href="/catalog"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition text-center shadow-lg hover:shadow-[#FF6B35]/30 flex items-center justify-center gap-2"
              >
                Canjear en Catálogo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Commercial Section 7: Verified Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
            ))}
            <span className="text-xs font-bold text-[#1A1A1A] ml-2">4.9 / 5.0 en Google & WhatsApp</span>
          </div>
          <h2 className="text-2xl font-black text-[#1A1A1A]">
            Lo que dicen nuestros clientes en todo Chile
          </h2>
          <p className="text-xs text-[#666666] mt-1">
            Más de 2.400 coleccionistas confían en OmniCollector para sus figuras y preventas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed italic">
              &quot;Llegó mi Nendoroid de Zelda impecable a Temuco. El embalaje con triple burbuja y esquineros de cartón es insuperable. Excelente tienda.&quot;
            </p>
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Rodrigo V.</p>
                <p className="text-[10px] text-[#666666]">Temuco, Chile</p>
              </div>
              <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                Compra Verificada
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed italic">
              &quot;La mejor tienda para preventas de Good Smile. Pagué el pie del 20% y cuando llegó a Santiago me avisaron al WhatsApp para pagar el resto. 100% recomendados.&quot;
            </p>
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Camila M.</p>
                <p className="text-[10px] text-[#666666]">Santiago Centro</p>
              </div>
              <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                Compra Verificada
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm space-y-3">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <p className="text-xs text-[#666666] leading-relaxed italic">
              &quot;Compré la carta de Charizard certificada PSA y llegó en menos de 24 horas por Starken express a Viña. La autenticidad se pudo comprobar en la web de PSA de inmediato.&quot;
            </p>
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Ignacio S.</p>
                <p className="text-[10px] text-[#666666]">Viña del Mar</p>
              </div>
              <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                Compra Verificada
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
