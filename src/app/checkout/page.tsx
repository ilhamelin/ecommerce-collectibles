"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Truck,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  HelpCircle,
  Package,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatCLP } from "@/lib/utils/currency";

const CHILEAN_REGIONS = [
  {
    id: "RM",
    name: "Región Metropolitana de Santiago",
    comunas: ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "La Florida", "Vitacura", "San Miguel"],
  },
  {
    id: "VALPO",
    name: "Región de Valparaíso",
    comunas: ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana", "Quillota"],
  },
  {
    id: "BIOBIO",
    name: "Región del Biobío",
    comunas: ["Concepción", "San Pedro de la Paz", "Talcahuano", "Chiguayante", "Los Ángeles"],
  },
  {
    id: "COQUIMBO",
    name: "Región de Coquimbo",
    comunas: ["La Serena", "Coquimbo", "Ovalle"],
  },
  {
    id: "ARAUCANIA",
    name: "Región de La Araucanía",
    comunas: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón"],
  },
  {
    id: "LOS_LAGOS",
    name: "Región de Los Lagos",
    comunas: ["Puerto Montt", "Puerto Varas", "Osorno", "Castro"],
  },
  {
    id: "ANTOFAGASTA",
    name: "Región de Antofagasta",
    comunas: ["Antofagasta", "Calama", "Tocopilla"],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, appliedCoupon, applyCoupon, removeCoupon, clearCart, getTotals } = useCartStore();
  const { currentUser, addUserOrder } = useAuthStore();
  const totals = getTotals();

  // Navigation & Step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Customer identification
  const [userMode, setUserMode] = useState<"GUEST" | "LOGIN">("GUEST");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rut, setRut] = useState("");

  // Shipping details
  const [selectedRegion, setSelectedRegion] = useState("RM");
  const [selectedComuna, setSelectedComuna] = useState("Santiago");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [notes, setNotes] = useState("");
  const [courier, setCourier] = useState<"STARKEN" | "CHILEXPRESS" | "PICKUP">("STARKEN");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"WEBPAY" | "BANK_TRANSFER" | "MERCADO_PAGO">("MERCADO_PAGO");
  const [installments, setInstallments] = useState("1");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Submitting
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill from authenticated user
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setRut(currentUser.rut || "");

      // If default address exists, pre-fill it
      const defAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
      if (defAddr) {
        setAddress(defAddr.address || "");
        setApartment(defAddr.apartment || "");
        setSelectedComuna(defAddr.comuna || "Santiago");
      }
    }
  }, [currentUser]);

  // Update comunas when region changes
  const activeRegion = CHILEAN_REGIONS.find((r) => r.id === selectedRegion) || CHILEAN_REGIONS[0];

  useEffect(() => {
    if (activeRegion.comunas.length > 0 && !currentUser?.addresses?.length) {
      setSelectedComuna(activeRegion.comunas[0]);
    }
  }, [selectedRegion, currentUser]);

  // Shipping cost computation
  const baseShippingCost =
    courier === "PICKUP"
      ? 0
      : courier === "CHILEXPRESS"
      ? 6490
      : 4990;

  const finalShippingCost = totals.isFreeShipping ? 0 : baseShippingCost;
  const finalTotalToday = totals.totalDueToday + finalShippingCost;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) setCouponInput("");
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      setErrorMessage("Por favor completa los datos obligatorios de identificación.");
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (courier !== "PICKUP" && !address) {
      setErrorMessage("Por favor ingresa la calle y número para el despacho.");
      return;
    }
    setErrorMessage(null);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCompleteOrder = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const idempotencyKey = `idem-ord-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const cartSessionId = `cart-session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const courierNames: Record<string, string> = {
      STARKEN: "Starken Express (1 a 2 días hábiles)",
      CHILEXPRESS: "Chilexpress Prioritario (24h hábiles)",
      PICKUP: "Retiro en Bodega Providencia, Santiago",
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          cartSessionId,
          userId: email || "usuario-invitado",
          paymentMethod,
          idempotencyKey,
          couponCode: appliedCoupon?.code,
          customerInfo: {
            fullName: fullName || "Coleccionista Invitado",
            email: email || "contacto@cliente.cl",
            phone: phone || "+56 9 8765 4321",
            rut: rut || "18.420.915-K",
          },
          shippingAddress: {
            region: activeRegion.name,
            comuna: selectedComuna,
            address: address || "Retiro en Bodega Central",
            apartment: apartment || undefined,
            notes: notes || undefined,
          },
          shippingMethod: {
            carrier: courier,
            name: courierNames[courier],
            cost: finalShippingCost,
          },
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            isPartialDeposit: i.isPartialDeposit,
            customDepositPercent: i.isPartialDeposit ? i.depositPercent : undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "No se pudo procesar el pago");
      }

      const orderId = data.data.orderId;
      if (data.data.order) {
        addUserOrder(data.data.order);
      }
      clearCart();

      const gateway = data.data?.gateway;
      if (gateway?.requiresRedirect && gateway?.redirectUrl) {
        window.location.href = gateway.redirectUrl;
        return;
      }

      router.push(`/order-confirmation/${orderId}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado al confirmar la compra.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-center mx-auto text-[#FF6B35] shadow-sm">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">No tienes productos en el Carrito</h1>
        <p className="text-sm text-[#666666] max-w-md mx-auto">
          Agrega figuras de escala, videojuegos físicos o coleccionables certificados para iniciar el proceso de compra.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6B35] text-white font-black text-xs uppercase tracking-wider shadow-lg hover:bg-[#E85A24] transition"
        >
          Ir al Catálogo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & SSL Security Badge */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#E5E5E5] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#666666]">
          <Link href="/" className="hover:text-[#1A1A1A]">Inicio</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">Carrito</span>
          <span>/</span>
          <span className="text-[#FF6B35] font-semibold">Checkout Seguro</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-3 py-1 rounded-full font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Conexión Cifrada SSL 256-Bit • Transbank / Mercado Pago Seguro</span>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
        {[
          { num: 1, label: "1. Identificación" },
          { num: 2, label: "2. Envío & Courier" },
          { num: 3, label: "3. Pago Seguro" },
        ].map((s) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (isDone) setCurrentStep(s.num as any);
              }}
              className={`p-3 rounded-xl border text-center transition cursor-pointer shadow-sm ${
                isActive
                  ? "bg-[#1F3A5F] border-[#1F3A5F] text-white"
                  : isDone
                  ? "bg-white border-[#E5E5E5] text-[#2E9E5B] font-bold"
                  : "bg-white border-[#E5E5E5] text-[#666666] opacity-60"
              }`}
            >
              <span className="text-xs font-bold block">{s.label}</span>
              <span className="text-[10px]">
                {isDone ? "Completado ✓" : isActive ? "En curso" : "Pendiente"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto p-4 rounded-xl bg-red-50 border border-[#D64545]/50 text-[#D64545] text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-[#D64545] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: IDENTIFICACIÓN */}
          {currentStep === 1 && (
            <form onSubmit={handleProceedToStep2} className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Paso 1 de 3</span>
                <h2 className="text-xl font-black text-[#1A1A1A] mt-1">Identificación del Comprador</h2>
                <p className="text-xs text-[#666666] mt-1">
                  Ingresa tus datos para emitir la boleta electrónica y coordinar el despacho.
                </p>
              </div>

              {/* Guest / Account selector */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs">
                <button
                  type="button"
                  onClick={() => setUserMode("GUEST")}
                  className={`py-2 rounded-lg font-bold transition ${
                    userMode === "GUEST"
                      ? "bg-white text-[#1A1A1A] shadow-sm border border-[#E5E5E5]"
                      : "text-[#666666] hover:text-[#1A1A1A]"
                  }`}
                >
                  Comprar como Invitado
                </button>
                <button
                  type="button"
                  onClick={() => setUserMode("LOGIN")}
                  className={`py-2 rounded-lg font-bold transition ${
                    userMode === "LOGIN"
                      ? "bg-white text-[#1A1A1A] shadow-sm border border-[#E5E5E5]"
                      : "text-[#666666] hover:text-[#1A1A1A]"
                  }`}
                >
                  Ya tengo Cuenta
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Matías Silva González"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="tu@correo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                    />
                    <span className="text-[10px] text-[#666666] mt-0.5 block">Aquí enviaremos el comprobante y tracking.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                    />
                    <span className="text-[10px] text-[#666666] mt-0.5 block">Para coordinar la entrega con el transportista.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A1A] mb-1">RUT Chileno (Opcional para Boleta)</label>
                  <input
                    type="text"
                    placeholder="12.345.678-K"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/20"
              >
                <span>Continuar a Envío & Courier</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: DIRECCIÓN Y COURIER */}
          {currentStep === 2 && (
            <form onSubmit={handleProceedToStep3} className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Paso 2 de 3</span>
                  <h2 className="text-xl font-black text-[#1A1A1A] mt-1">Dirección de Despacho & Courier</h2>
                  <p className="text-xs text-[#666666] mt-1">
                    Selecciona tu región para calcular tarifas exactas y tiempos de entrega.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#666666] hover:text-[#1A1A1A] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver
                </button>
              </div>

              {/* Courier Selector Cards */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#1A1A1A]">Empresa de Transporte / Retiro</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setCourier("STARKEN")}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-1 ${
                      courier === "STARKEN"
                        ? "bg-white border-2 border-[#FF6B35] text-[#1A1A1A] shadow-md"
                        : "bg-[#F7F7F5] border border-[#E5E5E5] text-[#666666] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1A1A1A]">Starken Express</span>
                      <Truck className="w-4 h-4 text-[#FF6B35]" />
                    </div>
                    <p className="text-[11px] text-[#666666]">1 a 2 días hábiles</p>
                    <div className="font-mono font-bold text-xs text-[#FF6B35] pt-1">
                      {totals.isFreeShipping ? "GRATIS" : "$ 4.990 CLP"}
                    </div>
                  </div>

                  <div
                    onClick={() => setCourier("CHILEXPRESS")}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-1 ${
                      courier === "CHILEXPRESS"
                        ? "bg-white border-2 border-[#FF6B35] text-[#1A1A1A] shadow-md"
                        : "bg-[#F7F7F5] border border-[#E5E5E5] text-[#666666] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1A1A1A]">Chilexpress Prioritario</span>
                      <Truck className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-[11px] text-[#666666]">Entrega en 24h hábiles</p>
                    <div className="font-mono font-bold text-xs text-[#FF6B35] pt-1">
                      {totals.isFreeShipping ? "GRATIS" : "$ 6.490 CLP"}
                    </div>
                  </div>

                  <div
                    onClick={() => setCourier("PICKUP")}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-1 ${
                      courier === "PICKUP"
                        ? "bg-white border-2 border-[#FF6B35] text-[#1A1A1A] shadow-md"
                        : "bg-[#F7F7F5] border border-[#E5E5E5] text-[#666666] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1A1A1A]">Retiro en Bodega</span>
                      <Building2 className="w-4 h-4 text-[#2E9E5B]" />
                    </div>
                    <p className="text-[11px] text-[#666666]">Providencia, Santiago</p>
                    <div className="font-mono font-bold text-xs text-[#2E9E5B] pt-1">
                      GRATIS ($0 CLP)
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Form (only if not pickup) */}
              {courier !== "PICKUP" ? (
                <div className="space-y-4 pt-2 border-t border-[#E5E5E5]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Región de Chile *</label>
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
                      >
                        {CHILEAN_REGIONS.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Comuna *</label>
                      <select
                        value={selectedComuna}
                        onChange={(e) => setSelectedComuna(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#FF6B35]"
                      >
                        {activeRegion.comunas.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Dirección (Calle y Número) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Av. Andrés Bello 2425"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Depto / Casa / Oficina (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Depto 402, Torre B"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Notas de Entrega (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Dejar en conserjería"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-1 text-xs text-[#666666]">
                  <p className="font-bold text-[#1A1A1A]">📍 Punto de Retiro Oficial:</p>
                  <p>Bodega OmniCollector Central, Av. Providencia 1208, Santiago.</p>
                  <p className="text-[11px] text-[#2E9E5B] font-medium">Listo para entrega en 2 horas hábiles tras la confirmación.</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/20"
              >
                <span>Continuar a Pasarela de Pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: PASARELA DE PAGO */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Paso 3 de 3</span>
                  <h2 className="text-xl font-black text-[#1A1A1A] mt-1">Método de Pago Seguro</h2>
                  <p className="text-xs text-[#666666] mt-1">
                    Selecciona tu medio de pago chileno preferido con protección al comprador.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#666666] hover:text-[#1A1A1A] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver
                </button>
              </div>

              {/* Payment Methods Accordion */}
              <div className="space-y-3">
                {/* 1. Mercado Pago Chile (Tarjetas, Cuotas, Webpay) */}
                <div
                  onClick={() => setPaymentMethod("MERCADO_PAGO")}
                  className={`p-5 rounded-2xl border cursor-pointer transition space-y-3 ${
                    paymentMethod === "MERCADO_PAGO"
                      ? "bg-white border-2 border-[#FF6B35] shadow-md"
                      : "bg-[#F7F7F5] border border-[#E5E5E5] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#009EE3] text-white flex items-center justify-center font-black text-xs shadow">
                        MP
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#1A1A1A]">Tarjetas de Crédito, Débito & Mercado Pago</h4>
                          <span className="text-[10px] font-bold text-[#2E9E5B] bg-[#2E9E5B]/10 border border-[#2E9E5B]/30 px-2 py-0.5 rounded-full">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-[11px] text-[#666666]">
                          Visa, Mastercard, Redcompra, Webpay Plus, MACH, Tenpo y saldo MP
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black text-[#FF6B35]">
                      Hasta 12 Cuotas
                    </span>
                  </div>

                  {paymentMethod === "MERCADO_PAGO" && (
                    <div className="pt-3 border-t border-[#E5E5E5] space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-[10px] text-[#666666] block mb-1">Simular Cuotas sin Interés</label>
                          <select
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A]"
                          >
                            <option value="1">1 Cuota (Al contado)</option>
                            <option value="3">3 Cuotas sin interés</option>
                            <option value="6">6 Cuotas sin interés</option>
                            <option value="12">12 Cuotas sin interés</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-end sm:text-right">
                          <span className="text-[10px] text-[#666666]">Valor cuota estimado:</span>
                          <span className="font-mono font-bold text-[#FF6B35] text-sm">
                            {formatCLP(Math.round(finalTotalToday / Number(installments)))} / mes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#2E9E5B] bg-[#2E9E5B]/10 p-2.5 rounded-xl border border-[#2E9E5B]/30">
                        <Lock className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                        <span>Pago protegido por Mercado Pago Chile. Acepta tarjetas nacionales e internacionales.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Webpay Plus / Transbank */}
                <div
                  onClick={() => setPaymentMethod("WEBPAY")}
                  className={`p-5 rounded-2xl border cursor-pointer transition space-y-3 ${
                    paymentMethod === "WEBPAY"
                      ? "bg-white border-2 border-[#FF6B35] shadow-md"
                      : "bg-[#F7F7F5] border border-[#E5E5E5] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center shadow-sm">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Webpay Plus Directo (Transbank / Flow)</h4>
                        <p className="text-[11px] text-[#666666]">Pago directo con Redcompra y bancos chilenos</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Transferencia Bancaria Directa */}
                <div
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-5 rounded-2xl border cursor-pointer transition space-y-3 ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "bg-white border-2 border-[#FF6B35] shadow-md"
                      : "bg-[#F7F7F5] border border-[#E5E5E5] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center shadow-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Transferencia Bancaria Electrónica</h4>
                        <p className="text-[11px] text-[#666666]">BancoEstado, Banco de Chile, Santander, BCI</p>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === "BANK_TRANSFER" && (
                    <div className="pt-3 border-t border-[#E5E5E5] space-y-1 text-xs text-[#666666]">
                      <p className="text-[#1A1A1A] font-bold">Datos para transferir:</p>
                      <p>Banco: <strong className="text-[#1A1A1A]">BancoEstado</strong> | Cuenta Corriente: <strong className="text-[#1A1A1A]">827104928</strong></p>
                      <p>RUT: <strong className="text-[#1A1A1A]">76.543.210-K</strong> | Email: <strong className="text-[#1A1A1A]">pagos@omnicollector.cl</strong></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm & Pay Button */}
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-[#FF6B35]/25 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>Procesando pedido y actualizando stock...</>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pagar {formatCLP(finalTotalToday)} en CLP</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Order Summary Area (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 bg-white border border-[#E5E5E5] rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h3 className="font-black text-base text-[#1A1A1A]">Resumen del Pedido</h3>
              <span className="text-xs font-mono font-bold text-[#FF6B35]">{totals.totalItemCount} artículos</span>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => {
                const charge = item.isPartialDeposit ? item.unitDeposit : item.unitPrice;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#1A1A1A] line-clamp-1">{item.name}</span>
                      </div>
                      <div className="text-[11px] text-[#666666] flex items-center gap-2 mt-0.5">
                        <span>Cant: {item.quantity}</span>
                        {item.isPreOrder && (
                          <span className="text-[10px] text-[#FF6B35] font-semibold">
                            (Pie {Math.round(item.depositPercent * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono font-bold text-[#1A1A1A]">
                      {formatCLP(charge * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-3 border-t border-[#E5E5E5] space-y-2">
              {appliedCoupon ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-[#2E9E5B]/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#2E9E5B] block">{appliedCoupon.code}</span>
                    <span className="text-[10px] text-[#666666]">{appliedCoupon.description}</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[11px] text-[#D64545] hover:text-red-700 font-bold underline"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código (Ej: COLECCIONISTA5K)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] uppercase placeholder:normal-case placeholder-[#666666]/50 focus:outline-none focus:border-[#FF6B35]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#FF6B35] text-white font-bold text-xs transition shadow-sm"
                  >
                    Aplicar
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[11px] ${couponMsg.success ? "text-[#2E9E5B]" : "text-[#D64545]"}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="pt-4 border-t border-[#E5E5E5] space-y-2 text-xs">
              <div className="flex justify-between text-[#666666]">
                <span>Subtotal productos:</span>
                <span className="font-mono text-[#1A1A1A] font-semibold">{formatCLP(totals.subtotal)}</span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-[#2E9E5B] font-medium">
                  <span>Descuento cupón:</span>
                  <span className="font-mono font-bold">-{formatCLP(totals.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#666666]">
                <span>Despacho ({courier === "PICKUP" ? "Retiro" : "Courier"}):</span>
                <span className="font-mono text-[#1A1A1A] font-semibold">
                  {finalShippingCost === 0 ? (
                    <span className="text-[#2E9E5B] font-bold">GRATIS</span>
                  ) : (
                    formatCLP(finalShippingCost)
                  )}
                </span>
              </div>

              {totals.totalDeferredDueLater > 0 && (
                <div className="flex justify-between text-[#1F3A5F] font-medium bg-[#1F3A5F]/5 px-3 py-1.5 rounded-xl border border-[#1F3A5F]/20">
                  <span>Saldo al llegar a Chile:</span>
                  <span className="font-mono font-bold text-[#FF6B35]">
                    +{formatCLP(totals.totalDeferredDueLater)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-[#E5E5E5] text-base">
                <span className="font-black text-[#1A1A1A]">Total a Pagar Hoy:</span>
                <span className="font-mono font-black text-2xl text-[#FF6B35]">
                  {formatCLP(finalTotalToday)}
                </span>
              </div>
            </div>

            {/* Guarantee Pills */}
            <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2 text-[11px] text-[#666666]">
              <div className="flex items-center gap-2 text-[#2E9E5B] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Garantía de Entrega Mint</span>
              </div>
              <p>Tu caja llegará sellada y con triple protección a tu domicilio o te reembolsamos el 100%.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
