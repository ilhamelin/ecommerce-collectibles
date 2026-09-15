import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, RefreshCw, FileText, Mail, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad | OmniCollector Chile",
  description: "Conoce el tratamiento de tus datos personales conforme a la Ley 21.719 de Protección de Datos Personales de Chile y estándares de seguridad PCI-DSS y SSL.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#666666] mb-6">
          <Link href="/" className="hover:text-[#1A1A1A] transition">Inicio</Link>
          <span>/</span>
          <span className="text-[#1A1A1A] font-semibold">Política de Privacidad</span>
        </div>

        {/* Header Hero */}
        <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 sm:p-10 shadow-xs mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3A5F]/10 text-[#1F3A5F] text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4 text-[#FF6B35]" />
            <span>Marco Legal Chileno • Ley N° 21.719</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>
          <p className="text-sm text-[#666666] mt-3 leading-relaxed max-w-3xl">
            En <strong>OmniCollector SpA</strong> (RUT 76.543.210-K), nos tomamos con máxima seriedad la protección de tu información personal. Esta política describe con transparencia qué datos recopilamos, con qué finalidad estricta los procesamos y cómo ejercer tus derechos de acceso, rectificación y eliminación en conformidad con la <strong>Nueva Ley de Protección de Datos Personales de Chile (Ley 21.719)</strong> y los reglamentos del <strong>SERNAC</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-[#E5E5E5] text-xs text-[#666666]">
            <div><strong>Última actualización:</strong> Septiembre 2026</div>
            <div><strong>Responsable de Datos:</strong> OmniCollector SpA</div>
            <div><strong>Canal ARCO:</strong> privacidad@omnicollector.cl</div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1: Datos que recopilamos */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">1</span>
              Datos Personales que Recopilamos
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-4">
              Solo solicitamos la información estrictamente necesaria y pertinente para procesar tu orden de compra y cumplir las obligaciones tributarias y de transporte vigentes en la República de Chile:
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-[#1A1A1A]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
                <div>
                  <strong>Identificación y Contacto:</strong> Nombre completo, correo electrónico y número de teléfono móvil / WhatsApp (para coordinación de entrega por courier).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
                <div>
                  <strong>Datos Tributarios (RUT):</strong> Solicitado exclusivamente para la emisión obligatoria de la Boleta o Factura Electrónica ante el Servicio de Impuestos Internos (SII).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
                <div>
                  <strong>Dirección de Entrega:</strong> Región, comuna, calle, número, departamento y notas específicas para los operadores logísticos (Starken, Chilexpress o Blue Express).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
                <div>
                  <strong>Datos de Transacción:</strong> Identificador de orden, montos pagados, historial de preventas y estado de abono del 20%.
                </div>
              </li>
            </ul>
          </div>

          {/* Section 2: Finalidad del Tratamiento */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">2</span>
              Finalidad Específica del Tratamiento
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-4">
              Bajo el principio de limitación de la finalidad consagrado en la Ley 21.719, tus datos jamás serán comercializados, cedidos ni arrendados a terceros para fines ajenos a tu relación comercial directa con nosotros:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5]">
                <h3 className="font-bold text-[#1A1A1A] mb-1">📦 Logística y Despacho</h3>
                <p className="text-[#666666] text-xs leading-relaxed">
                  Generación de rótulos de despacho con Starken, Chilexpress y Blue Express para asegurar la entrega directa a tu domicilio o sucursal seleccionada.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5]">
                <h3 className="font-bold text-[#1A1A1A] mb-1">🧾 Facturación Electrónica SII</h3>
                <p className="text-[#666666] text-xs leading-relaxed">
                  Emisión legal de boletas y facturas exentas o afectas a IVA, enviadas directamente a tu correo electrónico registrado.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5]">
                <h3 className="font-bold text-[#1A1A1A] mb-1">🔔 Notificaciones del Pedido</h3>
                <p className="text-[#666666] text-xs leading-relaxed">
                  Avisos sobre el cambio de estado de tu compra, arribo de cargamentos en preventa desde Japón y números de seguimiento de transporte.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5]">
                <h3 className="font-bold text-[#1A1A1A] mb-1">📢 Comunicaciones Comerciales (Opcionales)</h3>
                <p className="text-[#666666] text-xs leading-relaxed">
                  Solo si marcaste explícitamente la casilla opcional en el checkout, recibirás avisos de nuevos lanzamientos y preventas. Puedes revocar tu suscripción en cualquier momento.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Seguridad Bancaria PCI-DSS y SSL/TLS */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">3</span>
              Seguridad Bancaria PCI-DSS y Cifrado SSL/TLS
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-[#666666] leading-relaxed">
              <p>
                <strong>Certificado SSL/TLS 256-bit:</strong> Toda la navegación y el intercambio de datos sensibles entre tu navegador y nuestra plataforma se encuentra cifrada bajo certificados SSL/TLS de alta graduación con protocolo HTTPS forzado y cabeceras de seguridad HSTS (HTTP Strict Transport Security).
              </p>
              <div className="p-4 rounded-2xl bg-[#1F3A5F]/5 border border-[#1F3A5F]/15 flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#1F3A5F] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-xs">Cumplimiento Estricto PCI-DSS (Nivel SAQ-A)</h4>
                  <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                    <strong>OmniCollector no almacena, captura ni procesa números de tarjetas de crédito o débito ni códigos de seguridad CVV en sus propios servidores.</strong> Toda la tokenización de cobro se efectúa a través de pasarelas de pago certificadas internacionalmente con el estándar <strong>PCI-DSS Nivel 1 (Mercado Pago y Webpay Plus Transbank)</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Derechos ARCO (Ley 21.719) y Contacto */}
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center text-xs font-black">4</span>
              Tus Derechos: Acceso, Rectificación, Cancelación y Oposición (ARCO)
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-4">
              De acuerdo con la <strong>Ley N° 21.719</strong> sobre Protección de la Vida Privada y Datos Personales en Chile, como titular de los datos eres dueño de tu información y puedes ejercer sin costo los siguientes derechos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white">
                <strong className="text-[#1A1A1A] block mb-1">🔍 Derecho de Acceso:</strong>
                <span className="text-[#666666]">Solicitar copia de los datos personales que conservamos en tu cuenta e historial.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white">
                <strong className="text-[#1A1A1A] block mb-1">✏️ Derecho de Rectificación:</strong>
                <span className="text-[#666666]">Modificar datos inexactos, desactualizados o incompletos de tu libreta de direcciones.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white">
                <strong className="text-[#1A1A1A] block mb-1">🗑️ Derecho de Supresión / Borrado:</strong>
                <span className="text-[#666666]">Pedir la eliminación total de tus datos personales cuando ya no sean requeridos para fines legales o fiscales.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-[#E5E5E5] bg-white">
                <strong className="text-[#1A1A1A] block mb-1">✋ Derecho de Oposición:</strong>
                <span className="text-[#666666]">Revocar en cualquier momento tu consentimiento para recibir correos de marketing o newsletters.</span>
              </div>
            </div>

            {/* Contact Box */}
            <div className="mt-6 p-5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#1A1A1A] flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#FF6B35]" />
                  Canal Oficial de Privacidad y Protección de Datos
                </div>
                <p className="text-xs text-[#666666] mt-0.5">
                  Para solicitar el borrado o actualización de tus datos, escríbenos indicando tu RUT y correo:
                </p>
              </div>
              <a
                href="mailto:privacidad@omnicollector.cl"
                className="px-4 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition shrink-0"
              >
                privacidad@omnicollector.cl
              </a>
            </div>
          </div>
        </div>

        {/* Footer Navigation Back */}
        <div className="mt-8 flex items-center justify-between text-xs text-[#666666]">
          <Link href="/terms" className="text-[#FF6B35] font-bold hover:underline">
            Ver Términos y Condiciones Comerciales &rarr;
          </Link>
          <Link href="/" className="hover:text-[#1A1A1A] transition">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
