"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, BellRing, Check, Mail, Loader2, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

interface ProductAlertSubscriptionProps {
  productId: string;
  productSku: string;
  productName: string;
  productPrice: number;
  productOriginalPrice?: number;
  productImageUrl?: string;
  isOutOfStock: boolean;
  isPreOrder?: boolean;
}

export function ProductAlertSubscription({
  productId,
  productSku,
  productName,
  productPrice,
  productOriginalPrice,
  productImageUrl,
  isOutOfStock,
  isPreOrder,
}: ProductAlertSubscriptionProps) {
  const { currentUser, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingAlert, setIsCheckingAlert] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Check if registered user already subscribed to this product's alerts
  useEffect(() => {
    let isCurrent = true;

    if (isAuthenticated && currentUser?.email) {
      setEmail(currentUser.email);
      setIsCheckingAlert(true);

      const targetEmail = currentUser.email.toLowerCase().trim();
      const targetSku = productSku || "";
      const targetUserId = currentUser.id || "";

      fetch(
        `/api/products/${encodeURIComponent(productId)}/alerts?email=${encodeURIComponent(
          targetEmail
        )}&sku=${encodeURIComponent(targetSku)}&userId=${encodeURIComponent(targetUserId)}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (!isCurrent) return;
          if (data.success && data.active) {
            setIsSubscribed(true);
            if (data.alert?.id) {
              setActiveAlertId(data.alert.id);
            }
          } else {
            setIsSubscribed(false);
            setActiveAlertId(null);
          }
        })
        .catch((err) => {
          console.error("[ProductAlertSubscription] Error checking status:", err);
        })
        .finally(() => {
          if (isCurrent) setIsCheckingAlert(false);
        });
    } else {
      setIsSubscribed(false);
      setActiveAlertId(null);
      setIsCheckingAlert(false);
    }

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, currentUser?.email, currentUser?.id, productId, productSku]);

  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const targetEmail = isAuthenticated && currentUser?.email ? currentUser.email : email.trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      setFeedbackMessage("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          userId: currentUser?.id || null,
          userName: currentUser?.fullName || (isAuthenticated ? targetEmail.split("@")[0] : "Invitado Web"),
          productName,
          productSku,
          price: productPrice,
          originalPrice: productOriginalPrice,
          productImageUrl,
          isOutOfStock,
          isPreOrder,
          productUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSubscribed(true);
        if (data.data?.alertId) {
          setActiveAlertId(data.data.alertId);
        }
        const isEmailDelivered = data.data?.emailSent;
        setFeedbackMessage(
          isEmailDelivered
            ? `¡Alerta guardada en base de datos! Te hemos enviado un correo de confirmación a ${targetEmail}. Puedes revisarla en tu perfil.`
            : `¡Alerta guardada con éxito en la base de datos! Quedó registrada en tu perfil de usuario y en el Centro de Control.`
        );
        if (data.data?.previewUrl) {
          setPreviewUrl(data.data.previewUrl);
        }
      } else {
        setFeedbackMessage(data.error || "Ocurrió un problema al activar la alerta.");
      }
    } catch (err) {
      setFeedbackMessage("Error de conexión al activar la alerta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAlert = async () => {
    if (!currentUser?.email) return;
    setIsLoading(true);
    try {
      const targetParam = activeAlertId
        ? `id=${encodeURIComponent(activeAlertId)}`
        : `email=${encodeURIComponent(currentUser.email.toLowerCase().trim())}&sku=${encodeURIComponent(
            productSku || productId
          )}`;
      const res = await fetch(`/api/users/alerts?${targetParam}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(false);
        setActiveAlertId(null);
        setFeedbackMessage(null);
      } else {
        alert(data.error || "No se pudo cancelar el aviso");
      }
    } catch (err) {
      console.error("[ProductAlertSubscription] Error cancelling alert:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#1F3A5F]/5 via-white to-amber-500/5 border border-[#1F3A5F]/15 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`p-1.5 rounded-lg ${
            isSubscribed
              ? "bg-emerald-100 text-emerald-700"
              : isOutOfStock
              ? "bg-red-100 text-red-700"
              : "bg-[#1F3A5F]/10 text-[#1F3A5F]"
          }`}
        >
          {isSubscribed ? <BellRing className="w-4 h-4 text-emerald-600" /> : <Bell className="w-4 h-4" />}
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1F3A5F] flex items-center gap-1.5">
            {isOutOfStock ? "Avisarme cuando esté disponible (Stock)" : "Alerta de Precio & Disponibilidad"}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                isSubscribed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {isSubscribed ? "Suscripción Activa" : "Aviso por Correo"}
            </span>
          </h4>
          <p className="text-[11px] text-[#666666]">
            {isOutOfStock
              ? "Recibe un email formal prioritario en cuanto ingresemos nuevas unidades."
              : "Te notificamos si este coleccionable baja de precio o cuenta con promociones especiales."}
          </p>
        </div>
      </div>

      {isAuthenticated && currentUser ? (
        /* REGISTERED USER EXPERIENCE */
        isSubscribed ? (
          /* State when registered user already subscribed: Replacing the button with affirmative state */
          <div className="mt-3 space-y-2">
            <div className="w-full p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 text-xs shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <span className="p-1 rounded-full bg-emerald-600 text-white shrink-0 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span className="text-[13px] tracking-tight">Usted ya ha accedido para que le notifiquemos</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Activo
                </span>
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Te enviaremos una notificación formal a{" "}
                <strong className="text-emerald-950 font-bold underline">{currentUser.email}</strong> en cuanto
                detectemos reposición de stock o descuentos especiales para este coleccionable.
              </p>

              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 text-[11px]">
                <Link
                  href="/account?tab=alerts"
                  className="font-bold text-[#1F3A5F] hover:text-[#FF6B35] underline flex items-center gap-1 transition"
                >
                  <span>Ver en Mi Perfil (Mis Alertas)</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>

                <button
                  type="button"
                  onClick={handleCancelAlert}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:underline font-semibold disabled:opacity-50 transition text-[11px]"
                >
                  {isLoading ? "Cancelando..." : "Cancelar aviso"}
                </button>
              </div>
            </div>

            {previewUrl && (
              <div className="text-[11px] px-1">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1F3A5F] underline font-bold hover:text-[#FF6B35]"
                >
                  [Ver vista previa del correo de confirmación generado]
                </a>
              </div>
            )}
          </div>
        ) : (
          /* State when registered user has not yet subscribed: 1-Click Fast Button */
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#666666] px-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#FF6B35]" />
                Notificación para: <strong className="text-[#1F3A5F]">{currentUser.email}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSubscribe()}
              disabled={isLoading || isCheckingAlert}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {isLoading || isCheckingAlert ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
                  <span>{isCheckingAlert ? "Comprobando aviso..." : "Activando Alerta..."}</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-[#FF6B35]" />
                  <span>
                    {isOutOfStock
                      ? "Avisarme a mi correo cuando haya Stock"
                      : "Notificarme a mi correo ante bajas de precio o stock"}
                  </span>
                </>
              )}
            </button>
          </div>
        )
      ) : (
        /* GUEST USER EXPERIENCE (Email input form preserved for unregistered users) */
        isSubscribed ? (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            {previewUrl && (
              <div className="pt-1 text-[11px]">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1F3A5F] underline font-bold hover:text-[#FF6B35]"
                >
                  [Ver vista previa del correo de confirmación generado]
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="mt-3 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                <input
                  type="email"
                  required
                  placeholder="Ingresa tu correo (ej. coleccionista@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] shadow-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition shrink-0 shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>Avisarme por correo</span>
                  </>
                )}
              </button>
            </div>
            {feedbackMessage && (
              <p className="text-[11px] text-red-600 font-medium px-1">{feedbackMessage}</p>
            )}
          </form>
        )
      )}
    </div>
  );
}

