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
  MapPin,
  Plus,
  Store,
  Copy,
  Check,
  Sparkles,
  Coins,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore, type UserAddress } from "@/lib/store/authStore";
import { formatCLP } from "@/lib/utils/currency";
import { ShippingCalculator } from "@/components/shipping/ShippingCalculator";
import { InstallmentCalculator } from "@/components/product/InstallmentCalculator";

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
  const [selectedAddressId, setSelectedAddressId] = useState<string | "NEW">("NEW");
  const [selectedRegion, setSelectedRegion] = useState("RM");
  const [selectedComuna, setSelectedComuna] = useState("Santiago");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [notes, setNotes] = useState("");
  const [courier, setCourier] = useState<"STARKEN" | "CHILEXPRESS" | "BLUE_EXPRESS" | "PICKUP">("STARKEN");
  const [customShippingCost, setCustomShippingCost] = useState<number | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"WEBPAY" | "BANK_TRANSFER" | "MERCADO_PAGO">("MERCADO_PAGO");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("credit_card");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [installments, setInstallments] = useState("1");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Submitting
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to apply saved address to form
  const applySavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setAddress(addr.address || "");
    setApartment(addr.apartment || "");

    const matched = CHILEAN_REGIONS.find(
      (r) => r.id === addr.region || r.name.toLowerCase() === addr.region.toLowerCase()
    );
    if (matched) {
      setSelectedRegion(matched.id);
      setSelectedComuna(addr.comuna || matched.comunas[0]);
    } else {
      setSelectedComuna(addr.comuna || "Santiago");
    }
  };

  // Auto-fill from authenticated user or reset for guest
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setRut(currentUser.rut || "");

      // If user has saved addresses, select default or first one
      if (currentUser.addresses && currentUser.addresses.length > 0) {
        const defAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
        if (defAddr) {
          applySavedAddress(defAddr);
        }
      } else {
        setSelectedAddressId("NEW");
        setAddress("");
        setApartment("");
      }

      // If user has saved payment methods, default to their saved card, otherwise standard credit card
      if (currentUser.paymentMethods && currentUser.paymentMethods.length > 0) {
        const defCard = currentUser.paymentMethods.find((p) => p.isDefault) || currentUser.paymentMethods[0];
        setSelectedOptionId(`saved_${defCard.id}`);
      } else {
        setSelectedOptionId("credit_card");
      }
    } else {
      // Guest visitor: start with completely empty inputs and standard card option
      setSelectedAddressId("NEW");
      setSelectedOptionId("credit_card");
      setFullName("");
      setEmail("");
      setPhone("");
      setRut("");
      setAddress("");
      setApartment("");
      setNotes("");
    }
  }, [currentUser]);

  // Handle region dropdown change
  const activeRegion = CHILEAN_REGIONS.find((r) => r.id === selectedRegion) || CHILEAN_REGIONS[0];

  const handleRegionChange = (newRegionId: string) => {
    setSelectedRegion(newRegionId);
    const reg = CHILEAN_REGIONS.find((r) => r.id === newRegionId);
    if (reg && reg.comunas.length > 0) {
      setSelectedComuna(reg.comunas[0]);
    }
  };

  // Shipping cost computation
  const baseShippingCost =
    customShippingCost !== null
      ? customShippingCost
      : courier === "PICKUP"
      ? 0
      : courier === "CHILEXPRESS"
      ? 6490
      : courier === "BLUE_EXPRESS"
      ? 3990
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

    if (!acceptedTerms) {
      setTermsError(true);
      setErrorMessage("Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar con la compra.");
      return;
    }
    setTermsError(false);

    setIsProcessing(true);
    setErrorMessage(null);

    const idempotencyKey = `idem-ord-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const cartSessionId = `cart-session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const courierNames: Record<string, string> = {
      STARKEN: "Starken Express (1 a 2 días hábiles)",
      CHILEXPRESS: "Chilexpress Prioritario (24h hábiles)",
      BLUE_EXPRESS: "Blue Express Domicilio (Tarifa Económica)",
      PICKUP: "Retiro en Bodega Providencia, Santiago",
    };

    // Determine effective backend method based on Mercado Pago coherent options
    let effectiveMethod: "MERCADO_PAGO" | "WEBPAY" | "BANK_TRANSFER" = "MERCADO_PAGO";
    if (selectedOptionId === "bank_transfer") {
      effectiveMethod = "BANK_TRANSFER";
    } else if (selectedOptionId === "debit_card") {
      effectiveMethod = "WEBPAY";
    } else {
      // credit_card, mp_account, cash_servipag, or saved cards
      effectiveMethod = "MERCADO_PAGO";
    }

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
          paymentMethod: effectiveMethod,
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

              {/* If authenticated user */}
              {currentUser ? (
                <div className="p-4 rounded-2xl bg-[#1F3A5F]/5 border border-[#1F3A5F]/20 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] text-white flex items-center justify-center font-black text-sm shrink-0">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1A1A1A]">{currentUser.fullName}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2E9E5B]/10 text-[#2E9E5B] text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Cuenta Activa
                        </span>
                      </div>
                      <span className="text-[11px] text-[#666666]">{currentUser.email}</span>
                    </div>
                  </div>
                  <Link
                    href="/auth/login?redirect=/checkout"
                    className="text-[11px] font-semibold text-[#FF6B35] hover:underline shrink-0"
                  >
                    Cambiar cuenta
                  </Link>
                </div>
              ) : (
                /* Guest / Account selector - ONLY VISIBLE IF NOT LOGGED IN */
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
                  <Link
                    href="/auth/login?redirect=/checkout"
                    className="py-2 rounded-lg font-bold text-center text-[#666666] hover:text-[#1A1A1A] transition flex items-center justify-center"
                  >
                    Ya tengo Cuenta
                  </Link>
                </div>
              )}

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

              {/* Calculadora de Envíos para Chile Integrada */}
              <div className="space-y-2">
                <ShippingCalculator
                  initialRegion={selectedRegion}
                  initialComuna={selectedComuna}
                  initialCourier={courier}
                  isFreeShipping={totals.isFreeShipping}
                  onSelectCourier={(c, rate) => {
                    setCourier(c);
                    setCustomShippingCost(rate);
                  }}
                  onSelectRegion={(regKey) => {
                    setSelectedRegion(regKey);
                  }}
                  onSelectComuna={(comunaName) => {
                    setSelectedComuna(comunaName);
                  }}
                />
              </div>

              {/* Address Form (only if not pickup) */}
              {courier !== "PICKUP" ? (
                <div className="space-y-4 pt-2 border-t border-[#E5E5E5]">
                  {/* Saved addresses picker (only if user is logged in and has addresses) */}
                  {currentUser && currentUser.addresses && currentUser.addresses.length > 0 && (
                    <div className="space-y-3 pb-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#1A1A1A]">
                          Direcciones Guardadas en tu Libreta
                        </label>
                        <Link
                          href="/account"
                          target="_blank"
                          className="text-[11px] font-semibold text-[#FF6B35] hover:underline"
                        >
                          Administrar libreta
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentUser.addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => applySavedAddress(addr)}
                              className={`p-4 rounded-2xl border cursor-pointer transition relative space-y-1.5 ${
                                isSelected
                                  ? "bg-[#1F3A5F]/5 border-2 border-[#1F3A5F] shadow-sm"
                                  : "bg-white border border-[#E5E5E5] hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                                  <span className="text-xs font-bold text-[#1A1A1A]">{addr.label || "Casa"}</span>
                                  {addr.isDefault && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2E9E5B]/10 text-[#2E9E5B]">
                                      Predeterminada
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? "border-[#1F3A5F] bg-[#1F3A5F]" : "border-[#E5E5E5]"
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>

                              <p className="text-xs font-bold text-[#1A1A1A]">
                                {addr.address} {addr.apartment ? `(${addr.apartment})` : ""}
                              </p>
                              <p className="text-[11px] text-[#666666]">
                                {addr.comuna}, {addr.region}
                              </p>
                            </div>
                          );
                        })}

                        {/* Card to use a different address */}
                        <div
                          onClick={() => {
                            setSelectedAddressId("NEW");
                            setAddress("");
                            setApartment("");
                          }}
                          className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col items-center justify-center text-center gap-1 min-h-[90px] ${
                            selectedAddressId === "NEW"
                              ? "bg-[#FF6B35]/5 border-2 border-[#FF6B35] text-[#FF6B35]"
                              : "bg-[#F7F7F5] border border-dashed border-[#E5E5E5] text-[#666666] hover:border-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-1 font-bold text-xs">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Usar otra dirección</span>
                          </div>
                          <span className="text-[10px] text-[#666666]">Escribir una dirección diferente</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Inputs Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Región de Chile *</label>
                      <select
                        value={selectedRegion}
                        onChange={(e) => handleRegionChange(e.target.value)}
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
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (selectedAddressId !== "NEW") {
                          setSelectedAddressId("NEW");
                        }
                      }}
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

          {/* STEP 3: PASARELA DE PAGO (Coherente con la API de Mercado Pago) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Paso 3 de 3</span>
                    <h2 className="text-2xl font-black text-[#1A1A1A] mt-0.5">Elige cómo pagar</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-[#666666] hover:text-[#1A1A1A] flex items-center gap-1 font-semibold transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a Envío
                  </button>
                </div>

                {/* 1. SECCIÓN: TUS TARJETAS GUARDADAS */}
                {currentUser && currentUser.paymentMethods && currentUser.paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-[#666666]">Tus tarjetas guardadas</h3>
                      <span className="text-[10px] font-bold text-[#009EE3] bg-[#009EE3]/10 px-2 py-0.5 rounded-full">
                        Procesado por Mercado Pago
                      </span>
                    </div>
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden divide-y divide-[#F0F0F0] shadow-xs">
                      {currentUser.paymentMethods.map((pm) => {
                        const optionKey = `saved_${pm.id}`;
                        const isSelected = selectedOptionId === optionKey;
                        return (
                          <div
                            key={pm.id}
                            onClick={() => {
                              setSelectedOptionId(optionKey);
                              setPaymentMethod("MERCADO_PAGO");
                            }}
                            className={`flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition ${
                              isSelected ? "bg-[#F4F9FF]" : "hover:bg-[#FAFAFA]"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                isSelected ? "border-[#009EE3] bg-white" : "border-[#CCCCCC] bg-white"
                              }`}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#009EE3]" />}
                            </div>
                            <div className="w-10 h-7 rounded border border-[#E5E5E5] bg-white flex items-center justify-center font-black italic text-[#00579F] text-xs tracking-tighter shrink-0 shadow-xs">
                              {pm.brand === "VISA" ? (
                                "VISA"
                              ) : (
                                <div className="flex -space-x-1.5 items-center">
                                  <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
                                  <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/90" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-semibold text-[#1A1A1A] block">
                                {pm.brand === "VISA" ? "Visa" : "Mastercard"} terminada en {pm.last4}
                              </span>
                              <span className="text-xs text-[#666666] block">
                                Vencimiento: {pm.expiry} • {pm.holderName}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. SECCIÓN FLOW.CL (WEBPAY PLUS / TRANSBANK) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
                      <span className="w-2 h-2 rounded-full bg-[#00A650]"></span>
                      <span>Webpay Plus Transbank (Vía Flow.cl)</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#00A650] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                      Pasarela Flow Chile
                    </span>
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-xs hover:border-[#00A650]/50 transition">
                    {/* Tarjeta de débito / Webpay vía Flow */}
                    <div
                      onClick={() => {
                        setSelectedOptionId("debit_card");
                        setPaymentMethod("WEBPAY");
                      }}
                      className={`flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition ${
                        selectedOptionId === "debit_card" ? "bg-[#F0FDF4] border-l-4 border-l-[#00A650]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          selectedOptionId === "debit_card"
                            ? "border-[#00A650] bg-white"
                            : "border-[#CCCCCC] bg-white"
                        }`}
                      >
                        {selectedOptionId === "debit_card" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#00A650]" />
                        )}
                      </div>
                      <div className="w-10 h-7 rounded border border-[#E5E5E5] bg-white flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs font-black text-[10px] text-[#D92534]">
                        webpay
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1A1A1A]">
                            Webpay Plus / Tarjetas de Débito
                          </span>
                          <span className="text-[10px] font-black bg-[#1F3A5F] text-white px-1.5 py-0.2 rounded">
                            FLOW
                          </span>
                        </div>
                        <span className="text-xs text-[#666666] block mt-0.5">
                          Redcompra, CuentaRUT, BancoEstado, Santander, BCI, MACH, Tenpo
                        </span>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[#00A650]">
                          ✓ Redirección directa a Webpay Plus oficial
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SECCIÓN MERCADO PAGO CHILE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]">
                      <span className="w-2 h-2 rounded-full bg-[#009EE3]"></span>
                      <span>Mercado Pago Chile</span>
                      <span className="text-[#009EE3]">🤝</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#009EE3] bg-[#F4F9FF] px-2 py-0.5 rounded-full">
                      Pasarela Mercado Pago
                    </span>
                  </div>
                  <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden divide-y divide-[#F0F0F0] shadow-xs">
                    {/* Tarjeta de crédito */}
                    <div
                      onClick={() => {
                        setSelectedOptionId("credit_card");
                        setPaymentMethod("MERCADO_PAGO");
                      }}
                      className={`flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition ${
                        selectedOptionId === "credit_card" ? "bg-[#F4F9FF] border-l-4 border-l-[#009EE3]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          selectedOptionId === "credit_card"
                            ? "border-[#009EE3] bg-white"
                            : "border-[#CCCCCC] bg-white"
                        }`}
                      >
                        {selectedOptionId === "credit_card" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#009EE3]" />
                        )}
                      </div>
                      <div className="w-10 h-7 rounded border border-[#E5E5E5] bg-[#F7F7F5] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1A1A1A]">
                            Tarjeta de crédito
                          </span>
                          <span className="text-[10px] font-black bg-[#009EE3] text-white px-1.5 py-0.2 rounded">
                            MP
                          </span>
                        </div>
                        <span className="text-xs text-[#666666] block">
                          Visa, Mastercard, American Express, CMR, Magna
                        </span>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[#00A650] bg-[#E8F8F0] px-2 py-0.5 rounded">
                          Hasta 6 cuotas sin interés
                        </span>
                      </div>
                    </div>

                    {/* Cuenta de Mercado Pago */}
                    <div
                      onClick={() => {
                        setSelectedOptionId("mp_account");
                        setPaymentMethod("MERCADO_PAGO");
                      }}
                      className={`flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition ${
                        selectedOptionId === "mp_account" ? "bg-[#F4F9FF] border-l-4 border-l-[#009EE3]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          selectedOptionId === "mp_account"
                            ? "border-[#009EE3] bg-white"
                            : "border-[#CCCCCC] bg-white"
                        }`}
                      >
                        {selectedOptionId === "mp_account" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#009EE3]" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#FFE600] flex items-center justify-center text-[#1A1A1A] shrink-0 shadow-xs">
                        <Wallet className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1A1A1A]">
                            Cuenta de Mercado Pago
                          </span>
                          <span className="text-[10px] font-black bg-[#009EE3] text-white px-1.5 py-0.2 rounded">
                            MP
                          </span>
                        </div>
                        <span className="text-xs text-[#666666] block">
                          Paga con dinero disponible o tarjetas asociadas a tu cuenta
                        </span>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[#00A650] bg-[#E8F8F0] px-2 py-0.5 rounded">
                          Acreditación instantánea
                        </span>
                      </div>
                    </div>

                    {/* Efectivo Servipag vía Mercado Pago */}
                    <div
                      onClick={() => {
                        setSelectedOptionId("cash_servipag");
                        setPaymentMethod("MERCADO_PAGO");
                      }}
                      className={`flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition ${
                        selectedOptionId === "cash_servipag" ? "bg-[#F4F9FF] border-l-4 border-l-[#009EE3]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          selectedOptionId === "cash_servipag"
                            ? "border-[#009EE3] bg-white"
                            : "border-[#CCCCCC] bg-white"
                        }`}
                      >
                        {selectedOptionId === "cash_servipag" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#009EE3]" />
                        )}
                      </div>
                      <div className="w-10 h-7 rounded border border-[#E5E5E5] bg-[#FEF7E0] flex items-center justify-center text-[#B06000] shrink-0 shadow-xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1A1A1A]">
                            Efectivo en puntos de pago (Servipag)
                          </span>
                          <span className="text-[10px] font-black bg-[#009EE3] text-white px-1.5 py-0.2 rounded">
                            MP
                          </span>
                        </div>
                        <span className="text-xs text-[#666666] block">
                          Paga en efectivo en cualquier Servipag con tu cupón emitido
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. SECCIÓN TRANSFERENCIA BANCARIA DIRECTA */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#666666] px-1">Transferencia Directa</h3>
                  <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-xs">
                    <div
                      onClick={() => {
                        setSelectedOptionId("bank_transfer");
                        setPaymentMethod("BANK_TRANSFER");
                      }}
                      className={`flex items-center gap-4 p-4 sm:p-5 cursor-pointer transition ${
                        selectedOptionId === "bank_transfer" ? "bg-[#F4F9FF] border-l-4 border-l-[#1F3A5F]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          selectedOptionId === "bank_transfer"
                            ? "border-[#1F3A5F] bg-white"
                            : "border-[#CCCCCC] bg-white"
                        }`}
                      >
                        {selectedOptionId === "bank_transfer" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#1F3A5F]" />
                        )}
                      </div>
                      <div className="w-10 h-7 rounded border border-[#E5E5E5] bg-[#EAEFF5] flex items-center justify-center text-[#1F3A5F] shrink-0 shadow-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-[#1A1A1A] block">
                          Transferencia bancaria electrónica (Sin comisiones)
                        </span>
                        <span className="text-xs text-[#666666] block">
                          BancoEstado, Banco de Chile, Santander, BCI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SIMULADOR DE CUOTAS & MEDIOS DE PAGO */}
                {(selectedOptionId === "credit_card" || selectedOptionId.startsWith("saved_")) && (
                  <div className="pt-1">
                    <InstallmentCalculator
                      price={finalTotalToday}
                      isPreOrder={items.some((i) => Boolean(i.isPreOrder))}
                    />
                  </div>
                )}

                {/* DETALLES PARA TRANSFERENCIA BANCARIA */}
                {selectedOptionId === "bank_transfer" && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F9FF] border border-[#BFDBFE] space-y-3 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#1E40AF] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" /> Datos de cuenta corriente OmniCollector:
                      </h4>
                      <span className="text-[10px] text-[#1E40AF] bg-[#DBEAFE] px-2 py-0.5 rounded-full font-bold">
                        Acreditación en 15 min
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1A1A1A]">
                      <div className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#666666] block">Banco:</span>
                          <strong className="text-xs">BancoEstado</strong>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#666666] block">Tipo y N° Cuenta:</span>
                          <strong className="text-xs">Cta Cte 827104928</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("827104928", "acc")}
                          className="text-[#009EE3] hover:text-[#007EB5] p-1 text-[11px] font-bold flex items-center gap-1"
                        >
                          {copiedField === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === "acc" ? "Copiado" : "Copiar"}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#666666] block">RUT Titular:</span>
                          <strong className="text-xs">76.543.210-K</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("76.543.210-K", "rut")}
                          className="text-[#009EE3] hover:text-[#007EB5] p-1 text-[11px] font-bold flex items-center gap-1"
                        >
                          {copiedField === "rut" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === "rut" ? "Copiado" : "Copiar"}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#666666] block">Email comprobante:</span>
                          <strong className="text-xs">pagos@omnicollector.cl</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("pagos@omnicollector.cl", "email")}
                          className="text-[#009EE3] hover:text-[#007EB5] p-1 text-[11px] font-bold flex items-center gap-1"
                        >
                          {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedField === "email" ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* DETALLES PARA EFECTIVO EN PUNTOS DE PAGO (SERVIPAG) */}
                {selectedOptionId === "cash_servipag" && (
                  <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] space-y-1.5 text-xs text-[#92400E] shadow-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#B45309]" /> Pago en efectivo Servipag
                    </p>
                    <p>
                      Al hacer clic en Continuar, la API oficial de Mercado Pago generará tu <strong>cupón de pago con código de barras</strong> para abonar en efectivo en cualquier sucursal de Servipag de Chile.
                    </p>
                  </div>
                )}

                {/* INFORMACIÓN SOBRE CUENTA MERCADO PAGO */}
                {selectedOptionId === "mp_account" && (
                  <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-1.5 text-xs text-[#0369A1] shadow-xs">
                    <p className="font-bold flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-[#009EE3]" /> Conexión con tu cuenta de Mercado Pago
                    </p>
                    <p>
                      Serás conectado con la plataforma oficial de Mercado Pago para autorizar el cobro con tu saldo disponible o tus tarjetas registradas de forma 100% protegida.
                    </p>
                  </div>
                )}

                {/* CASILLAS DE VERIFICACIÓN NORMATIVAS (SERNAC & LEY 21.719) */}
                <div className="pt-2 space-y-3 border-t border-[#E5E5E5]">
                  {/* Casilla 1: OBLIGATORIA - Términos y Condiciones + Política de Privacidad */}
                  <div
                    className={`p-3.5 rounded-2xl border transition ${
                      termsError
                        ? "bg-red-50/70 border-red-300 ring-1 ring-red-400"
                        : "bg-[#F7F7F5] border-[#E5E5E5] hover:border-slate-300"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          if (e.target.checked) setTermsError(false);
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#FF6B35] focus:ring-[#FF6B35] shrink-0 cursor-pointer accent-[#FF6B35]"
                      />
                      <span className="text-xs text-[#1A1A1A] leading-relaxed">
                        <strong className="text-[#1A1A1A]">Acepto los </strong>
                        <Link
                          href="/terms"
                          target="_blank"
                          className="font-bold text-[#FF6B35] hover:underline"
                        >
                          Términos y Condiciones
                        </Link>
                        <span> (Garantía Legal de 6 meses y Derecho a Retracto) y la </span>
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="font-bold text-[#FF6B35] hover:underline"
                        >
                          Política de Privacidad
                        </Link>
                        <span> (Tratamiento seguro de datos según Ley N° 21.719). *</span>
                      </span>
                    </label>
                    {termsError && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1.5 pl-7 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Debes marcar esta casilla para continuar con el pago seguro.
                      </p>
                    )}
                  </div>

                  {/* Casilla 2: OPCIONAL - Ofertas, preventas y alertas exclusivas */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] hover:border-slate-300 transition">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={subscribeNewsletter}
                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#1F3A5F] focus:ring-[#1F3A5F] shrink-0 cursor-pointer accent-[#1F3A5F]"
                      />
                      <span className="text-xs text-[#666666] leading-relaxed">
                        <strong className="text-[#1A1A1A]">Quiero recibir ofertas por mail:</strong>{" "}
                        Alertas de stock de preventas japonesas exclusivas, reposiciones y cupones de descuento (opcional, puedes desuscribirte cuando quieras).
                      </span>
                    </label>
                  </div>
                </div>

                {/* CTA CONFIRMAR Y PAGAR */}
                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={isProcessing}
                    className={`w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 cursor-pointer ${
                      selectedOptionId === "debit_card"
                        ? "bg-[#00A650] hover:bg-[#008f45] shadow-[#00A650]/25"
                        : selectedOptionId === "bank_transfer"
                        ? "bg-[#1F3A5F] hover:bg-[#152740] shadow-[#1F3A5F]/25"
                        : "bg-[#FF6B35] hover:bg-[#E85A24] shadow-[#FF6B35]/25"
                    }`}
                  >
                    {isProcessing ? (
                      <>Conectando con pasarela de pago segura...</>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          {selectedOptionId === "debit_card"
                            ? `Pagar con Webpay Plus (Flow) ${formatCLP(finalTotalToday)}`
                            : selectedOptionId === "bank_transfer"
                            ? `Confirmar Transferencia Bancaria ${formatCLP(finalTotalToday)}`
                            : `Pagar con Mercado Pago ${formatCLP(finalTotalToday)}`}
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#666666] text-center">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                      <span>Cifrado SSL 256-bit</span>
                    </div>
                    <span>•</span>
                    <div>
                      {selectedOptionId === "debit_card"
                        ? "Transbank Webpay Plus (Flow.cl)"
                        : selectedOptionId === "bank_transfer"
                        ? "Transferencia Electrónica Directa"
                        : "PCI-DSS Compliant (Mercado Pago)"}
                    </div>
                    <span>•</span>
                    <div>Garantía 6 Meses SERNAC</div>
                  </div>
                </div>
              </div>
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
