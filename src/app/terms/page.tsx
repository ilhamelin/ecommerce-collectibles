import React from "react";
import Link from "next/link";
import { Scale, Truck, ShieldCheck, RefreshCcw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones | OmniCollector Chile",
  description: "Términos y condiciones de compra, garantía legal de 6 meses (SERNAC), derecho de retracto y despachos para coleccionistas en OmniCollector Chile.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#666666] mb-6">
          <Link href="/" className="hover:text-[#1A1A1A] transition">Inicio</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-semibold">Términos y Condiciones</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 sm:p-10 shadow-xs mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F] text-xs font-bold mb-4">
            <Scale className="w-4 h-4 text-[#FF6B35]" />
            <span>Reglamento de Comercio Electrónico • SERNAC & Ley N° 19.496</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">
            Términos y Condiciones de Compra
          </h1>
          <p className="text-sm text-[#666666] mt-3 leading-relaxed max-w-3xl">
            Bienvenido a <strong>OmniCollector SpA</strong> (RUT 76.543.210-K). Las transacciones realizadas en este sitio web están reguladas por la legislación chilena, en particular por la <strong>Ley N° 19.496 sobre Protección de los Derechos de los Consumidores</strong> y el <strong>Reglamento de Comercio Electrónico del SERNAC</strong> (Decreto N° 6/2021).
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-[#E5E5E5] text-xs text-[#666666]">
            <div><strong>Vigencia:</strong> Septiembre 2026</div>
            <div><strong>Razón Social:</strong> OmniCollector SpA</div>
            <div><strong>Soporte Legal:</strong> contacto@omnicollector.cl</div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Section 1: Plazos de Entrega y Couriers */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">1</span>
              Plazos de Entrega y Despacho
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-4">
              En cumplimiento del Reglamento de Comercio Electrónico del SERNAC, informamos de manera previa y transparente los plazos estimados y operadores logísticos disponibles en nuestro checkout:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1.5">
                <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#FF6B35]" />
                  Región Metropolitana
                </div>
                <p className="text-[#666666]">
                  <strong>1 a 2 días hábiles</strong> posteriores a la confirmación del pago. Cobertura en todas las comunas del Gran Santiago.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1.5">
                <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#FF6B35]" />
                  Regiones (Arica a Magallanes)
                </div>
                <p className="text-[#666666]">
                  <strong>2 a 5 días hábiles</strong> vía Starken Express, Chilexpress o Blue Express con número de seguimiento en línea.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1.5">
                <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#2E9E5B]" />
                  Retiro en Bodega
                </div>
                <p className="text-[#666666]">
                  Disponible en <strong>2 horas hábiles</strong> en nuestra bodega central de Providencia, Santiago (sin costo de despacho).
                </p>
              </div>
            </div>
            <div className="mt-4 p-3.5 rounded-xl bg-[#1F3A5F]/5 border border-[#1F3A5F]/10 text-xs text-[#1F3A5F]">
              <strong>Embalaje Blindado Collector-Grade:</strong> Todos los envíos se despachan en cajas rígidas de triple corrugado con plástico burbuja de alta amortiguación y esquineros protectores para garantizar que la caja de tu figura o videojuego llegue en condición Mint C-10.
            </div>
          </div>

          {/* Section 2: Garantía Legal de 6 Meses (SERNAC) */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">2</span>
              Garantía Legal de 6 Meses (Ley N° 19.496 / SERNAC)
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-4">
              Conforme al <strong>Artículo 20 de la Ley N° 19.496</strong> (actualizada por la Ley Pro-Consumidor), si el producto adquirido presenta fallas de fábrica, defectos ocultos, piezas faltantes de origen o no es apto para el uso previsto, tienes un plazo irrenunciable de <strong>6 meses desde la recepción del producto</strong> para exigir:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl border border-[#2E9E5B]/30 bg-[#2E9E5B]/5">
                <strong className="text-[#2E9E5B] block mb-1 font-bold">1. Reparación Gratuita</strong>
                <span className="text-[#666666]">En servicio técnico autorizado o reposición de la pieza afectada del coleccionable.</span>
              </div>
              <div className="p-4 rounded-2xl border border-[#009EE3]/30 bg-[#009EE3]/5">
                <strong className="text-[#009EE3] block mb-1 font-bold">2. Cambio del Producto</strong>
                <span className="text-[#666666]">Reemplazo inmediato por una unidad nueva idéntica en perfecto estado de conservación.</span>
              </div>
              <div className="p-4 rounded-2xl border border-[#FF6B35]/30 bg-[#FF6B35]/5">
                <strong className="text-[#FF6B35] block mb-1 font-bold">3. Devolución del Dinero</strong>
                <span className="text-[#666666]">Reembolso íntegro del monto pagado a través del mismo medio de pago utilizado.</span>
              </div>
            </div>
            <p className="text-xs text-[#666666] mt-4">
              * Para hacer efectiva la garantía legal solo necesitas presentar tu boleta de compra o comprobante de transferencia y comunicarte a nuestro canal de soporte. No se te exigirá ningún trámite innecesario.
            </p>
          </div>

          {/* Section 3: Derecho de Retracto en Compras Online */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">3</span>
              Derecho de Retracto (Compras a Distancia / Internet)
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-4">
              De acuerdo con el <strong>Artículo 3° bis letra b) de la Ley N° 19.496</strong>, en compras realizadas por medios electrónicos o a distancia, tienes el derecho legal a poner término unilateralmente al contrato (arrepentirte de la compra) dentro del plazo de <strong>10 días corridos contados desde la recepción del producto</strong>:
            </p>
            <div className="space-y-3 text-xs text-[#1A1A1A]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
                <div>
                  <strong>Condición del Producto:</strong> Tratándose de artículos de colección (figuras de edición limitada, videojuegos en formato físico sellados y cartas TCG coleccionables), el bien debe ser devuelto sin uso, con sus sellos de fábrica intactos, manuales y embalaje original en el mismo estado en que fue entregado.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
                <div>
                  <strong>Reembolso del Precio:</strong> Una vez recibido e inspeccionado el producto devuelto en nuestra bodega, se reembolsará la totalidad del valor pagado en un plazo no superior a 3 días hábiles.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Preventas y Abono del 20% */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">4</span>
              Condiciones de Preventas Japonesas y Reserva con 20%
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-[#666666] leading-relaxed">
              <p>
                Nuestra modalidad de <strong>Preventa</strong> permite asegurar cupos de importación oficial directa desde Japón abonando únicamente el <strong>20% del valor total</strong> al momento de la reserva.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#1A1A1A]">
                <li>El 80% restante se cancela únicamente cuando la carga arriba a nuestra bodega física en Santiago de Chile.</li>
                <li>La fecha estimada de arribo informada en la ficha de producto está sujeta al calendario de manufactura del fabricante en Japón y tránsito aduanero. Si el fabricante cancela la tirada, se devuelve el 100% del abono inmediatamente.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Navigation Back */}
        <div className="mt-8 flex items-center justify-between text-xs text-[#666666]">
          <Link href="/privacy" className="text-[#FF6B35] font-bold hover:underline">
            &larr; Ver Política de Privacidad (Ley 21.719)
          </Link>
          <Link href="/" className="hover:text-[#1A1A1A] transition">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
