import React from "react";
import Link from "next/link";
import { ShieldCheck, Building2, FileText, Scale, MapPin, Mail, Phone, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Aviso Legal e Información Corporativa | OmniCollector Chile",
  description: "Información legal, societaria, tributaria y de propiedad intelectual de OmniCollector SpA en cumplimiento de la Ley del Consumidor (Ley N° 19.496) y SERNAC.",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#4B5563]">
          <Link href="/" className="hover:text-[#1A1A1A] transition">Inicio</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-semibold">Aviso Legal</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 sm:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F] text-xs font-bold mb-4">
            <Scale className="w-4 h-4 text-[#FF6B35]" />
            <span>Transparencia Corporativa • Ley N° 19.496 & SERNAC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">
            Aviso Legal e Información Societaria
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-3 leading-relaxed max-w-3xl">
            En cumplimiento del artículo 30 de la <strong>Ley N° 19.496 sobre Protección de los Derechos de los Consumidores</strong> y las directrices de comercio electrónico del <strong>SERNAC</strong>, se pone a disposición de todos los usuarios y clientes la información identificatoria y legal de la empresa operadora de esta plataforma.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-[#E5E5E5] text-xs text-[#4B5563]">
            <div><strong>Razón Social:</strong> OmniCollector SpA</div>
            <div><strong>RUT:</strong> 76.543.210-K</div>
            <div><strong>Vigencia:</strong> Actualizado Septiembre 2026</div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {/* Section 1: Datos de la Empresa */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF6B35]" />
              1. Identificación del Titular y Domicilio Legal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#1A1A1A]">
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1">
                <span className="text-[11px] text-[#4B5563] block font-bold">Razón Social</span>
                <strong>OmniCollector SpA</strong>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1">
                <span className="text-[11px] text-[#4B5563] block font-bold">RUT de la Empresa</span>
                <strong className="font-mono">76.543.210-K</strong>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1">
                <span className="text-[11px] text-[#4B5563] block font-bold">Giro Comercial SII</span>
                <span>Comercio al por menor por internet de figuras, videojuegos y coleccionables</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1">
                <span className="text-[11px] text-[#4B5563] block font-bold">Domicilio y Almacén Central</span>
                <span>Av. Providencia 1208, Oficina 302, Providencia, Región Metropolitana, Chile</span>
              </div>
            </div>
          </div>

          {/* Section 2: Canales de Atención Directa */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#2E9E5B]" />
              2. Canales Oficiales de Comunicación y Reclamos
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              De acuerdo con las normativas de atención al consumidor, ponemos a tu disposición canales directos, verificados y gratuitos para consultas, requerimientos post-venta y solicitudes formales:
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#1A1A1A]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                <span><strong>Atención al Cliente:</strong> contacto@omnicollector.cl</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                <span><strong>Canal WhatsApp Verificado:</strong> +56 9 5824 3917 (Lunes a Viernes 09:00 a 19:00 hrs)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                <span><strong>Privacidad y Datos Personales:</strong> privacidad@omnicollector.cl</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Propiedad Intelectual de Terceros */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1F3A5F]" />
              3. Propiedad Intelectual y Marcas Comerciales de Terceros
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              Todos los nombres comerciales, logotipos y marcas de productos exhibidos en este sitio web (incluyendo, de forma no taxativa: <em>Good Smile Company, Nendoroid, Bandai Namco, The Pokémon Company, Nintendo, Square Enix, Kotobukiya, Alter, PSA, PlayStation, Xbox, Capcom</em>) son marcas registradas propiedad de sus respectivos fabricantes y licenciantes internacionales.
            </p>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              OmniCollector SpA comercializa exclusivamente <strong>productos originales y licenciados</strong> adquiridos a través de canales de distribución oficiales. La mención de dichas marcas en esta plataforma responde únicamente a propósitos informativos de identificación y comercialización legítima de los artículos.
            </p>
          </div>

          {/* Section 4: Marco de Garantías SERNAC */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#FF6B35]" />
              4. Garantía Legal de 6 Meses y Derecho a Retracto
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              En conformidad con la Ley N° 19.496, todo consumidor que adquiera productos nuevos en OmniCollector tiene derecho a la <strong>Garantía Legal de 6 meses</strong> frente a fallas de fábrica o defectos de origen, pudiendo optar a: cambio del producto, reparación gratuita o devolución íntegra del dinero pagado.
            </p>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              Asimismo, se garantiza el <strong>Derecho a Retracto de 10 días</strong> corridos desde la recepción del producto para compras realizadas a distancia, siempre que el artículo se encuentre sellado y en su empaque original sin uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
