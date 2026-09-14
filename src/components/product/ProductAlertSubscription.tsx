"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, Check, Mail, Sparkles, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

interface ProductAlertSubscriptionProps {
  productId: string;
  productSku: string;
  productName: string;
  productPrice: number;
  productOriginalPrice?: number;
  isOutOfStock: boolean;
  isPreOrder?: boolean;
}

export function ProductAlertSubscription({
  productId,
  productSku,
  productName,
  productPrice,
  productOriginalPrice,
  isOutOfStock,
  isPreOrder,
}: ProductAlertSubscriptionProps) {
  const { currentUser, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // If user is authenticated, prefill their email
  useEffect(() => {
    if (isAuthenticated && currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [isAuthenticated, currentUser]);

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
          productName,
          productSku,
          price: productPrice,
          originalPrice: productOriginalPrice,
          isOutOfStock,
          isPreOrder,
          productUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSubscribed(true);
        setFeedbackMessage(
          isOutOfStock
            ? `¡Alerta activada! Te hemos enviado un correo de confirmación a ${targetEmail}. Te avisaremos en cuanto haya stock.`
            : `¡Alerta activada! Te hemos enviado un correo de confirmación a ${targetEmail}. Te avisaremos de ofertas o variaciones.`
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

  return (
    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#1F3A5F]/5 via-white to-amber-500/5 border border-[#1F3A5F]/15 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${isOutOfStock ? "bg-red-100 text-red-700" : "bg-[#1F3A5F]/10 text-[#1F3A5F]"}`}>
          {isSubscribed ? <BellRing className="w-4 h-4 text-[#2E9E5B]" /> : <Bell className="w-4 h-4" />}
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1F3A5F] flex items-center gap-1.5">
            {isOutOfStock ? "Avisarme cuando esté disponible (Stock)" : "Alerta de Precio & Disponibilidad"}
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
              Aviso por Correo
            </span>
          </h4>
          <p className="text-[11px] text-[#666666]">
            {isOutOfStock
              ? "Recibe un email formal prioritario en cuanto ingresemos nuevas unidades."
              : "Te notificamos si este coleccionable baja de precio o cuenta con promociones especiales."}
          </p>
        </div>
      </div>

      {isSubscribed ? (
        <div className="mt-3 p-3 rounded-xl bg-[#2E9E5B]/10 border border-[#2E9E5B]/20 text-[#2E9E5B] text-xs font-medium space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-[#2E9E5B]" />
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
      ) : isAuthenticated && currentUser ? (
        /* Authenticated User: 1-Click Fast Button */
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
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
                <span>Activando Alerta...</span>
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
      ) : (
        /* Guest User: Email Input Form */
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
      )}
    </div>
  );
}
