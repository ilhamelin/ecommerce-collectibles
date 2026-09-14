"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  RotateCcw,
  ExternalLink,
  ShoppingBag,
  ChevronDown,
  Gift,
  Gamepad2,
  PackageCheck,
  Flame,
} from "lucide-react";

interface RecommendedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  type: string;
  stockAvailable: number;
  platform?: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendedProducts?: RecommendedProduct[];
  whatsappText?: string;
  timestamp: string;
}

function ChatProductThumbnail({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-800/80">
        <Gamepad2 className="w-6 h-6 text-slate-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

const QUICK_PROMPTS = [
  {
    icon: Gift,
    label: "Regalo con $50.000 CLP",
    prompt: "Tengo un presupuesto de $50.000 CLP para hacer un regalo a un gamer, ¿qué me recomiendas de su catálogo?",
  },
  {
    icon: Gamepad2,
    label: "Juegos PS5 con stock",
    prompt: "¿Qué videojuegos para PlayStation 5 tienen disponibles con entrega inmediata?",
  },
  {
    icon: Flame,
    label: "Figuras de colección",
    prompt: "Recomiéndame las mejores figuras de anime o colección originales que tengan en stock hoy.",
  },
  {
    icon: PackageCheck,
    label: "¿Cómo son las preventas?",
    prompt: "¿Cómo funciona el sistema de preventas japonesas con el pie del 20% en OmniCollector?",
  },
];

export function SommelierChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const [showTeaser, setShowTeaser] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide widget inside /admin routes to keep dashboard clean
  const isAdmin = pathname?.startsWith("/admin");

  // Load chat from localStorage or init default message
  useEffect(() => {
    if (isAdmin) return;
    try {
      const saved = localStorage.getItem("omnicollector_sommelier_chat");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default welcome message
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content:
          "¡Hola, coleccionista! 🎮✨ Soy tu **Sommelier Personal de OmniCollector**.\n\nConozco nuestro catálogo al 100% en tiempo real. ¿Buscas un regalo para alguien especial, quieres saber qué juegos o figuras tenemos en stock hoy o necesitas calcular tu presupuesto en pesos chilenos? ¡Dime qué tienes en mente!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [isAdmin]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("omnicollector_sommelier_chat", JSON.stringify(messages.slice(-15)));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setShowTeaser(false);
      setHasNewBadge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (isAdmin) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/sommelier/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentContext: {
            currentPath: pathname,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          recommendedProducts: data.recommendedProducts || [],
          whatsappText: data.whatsappFollowupText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "Disculpa coleccionista, hubo una pequeña sobrecarga en el servidor de IA. Si lo prefieres, puedes consultarnos directamente a nuestro WhatsApp oficial (+56 9 5824 3917).",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "No pude conectar con el sommelier en este momento. Por favor verifica tu conexión o escríbenos directamente por WhatsApp.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    localStorage.removeItem("omnicollector_sommelier_chat");
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "¡Conversación reiniciada! 🎮 ¿En qué juego, figura o consulta de catálogo te puedo orientar ahora?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Helper to render bold markdown (**text**)
  const renderFormattedText = (raw: string) => {
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-[#FF9E66]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {/* Teaser Tooltip Bubble */}
      {!isOpen && showTeaser && (
        <div className="fixed bottom-20 right-5 z-50 flex items-center gap-2 bg-[#0F1D30] text-white text-xs px-3.5 py-2.5 rounded-2xl shadow-2xl border border-[#FF6B35]/40 animate-bounce cursor-pointer max-w-[280px]">
          <Sparkles className="w-4 h-4 text-[#FF6B35] shrink-0" />
          <div onClick={() => setIsOpen(true)}>
            <p className="font-semibold text-white">¿Buscas un juego o regalo?</p>
            <p className="text-slate-300 text-[11px]">Pregúntale al Sommelier IA con inventario real</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            className="text-slate-400 hover:text-white p-1 ml-1"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setIsOpen(true)}
            id="sommelier-floating-btn"
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#0F1D30] to-[#1E293B] text-white px-4 py-3 rounded-full shadow-[0_8px_25px_rgba(15,29,48,0.45)] border border-[#FF6B35]/50 hover:border-[#FF6B35] hover:scale-105 active:scale-95 transition-all duration-200"
          >
            {/* Live pulsing dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
            </span>

            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF6B35] group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold tracking-wide">Sommelier IA</span>
            </div>

            {hasNewBadge && (
              <span className="bg-[#FF6B35] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                En vivo
              </span>
            )}
          </button>
        </div>
      )}

      {/* Expanded Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[410px] h-[600px] max-h-[90vh] bg-[#0A1118] text-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F1D30] via-[#16263B] to-[#0F1D30] px-4 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#E85D25] flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Sommelier Coleccionista</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Inventario Real
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">Asesor gamer & figuras en pesos chilenos</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar conversación"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimizar"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Strip */}
          <div className="bg-[#0C1520] border-b border-slate-800/80 px-3 py-2 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
            {QUICK_PROMPTS.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={isLoading}
                  className="whitespace-nowrap flex items-center gap-1.5 bg-[#142334] hover:bg-[#1C324A] text-slate-200 hover:text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-750 hover:border-[#FF6B35]/60 transition-all shrink-0 active:scale-95"
                >
                  <Icon className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-[#0A1118]/90">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#FF6B35] text-white rounded-br-none"
                      : "bg-[#142232] text-slate-200 rounded-bl-none border border-slate-800"
                  }`}
                >
                  <div className="whitespace-pre-line">{renderFormattedText(msg.content)}</div>
                  <span
                    className={`block text-[10px] mt-1 text-right ${
                      msg.role === "user" ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Embedded Recommended Product Cards */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-2.5 w-full max-w-[95%] space-y-2">
                    <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Recomendaciones directas de la tienda:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.recommendedProducts.map((prod) => (
                        <div
                          key={prod.sku}
                          className="bg-[#111C26] hover:bg-[#162534] border border-slate-800 hover:border-[#FF6B35]/60 rounded-xl p-2.5 flex items-center gap-3 transition-colors shadow-sm"
                        >
                          <div className="relative w-14 h-14 bg-white/5 rounded-lg overflow-hidden shrink-0 border border-slate-750 flex items-center justify-center">
                            <ChatProductThumbnail
                              src={prod.images && prod.images[0]}
                              alt={prod.name}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {prod.platform && (
                                <span className="text-[9px] font-black bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
                                  {prod.platform}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-400 font-mono">
                                {prod.sku}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white truncate" title={prod.name}>
                              {prod.name}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-extrabold text-[#FF6B35]">
                                ${prod.price?.toLocaleString("es-CL")} CLP
                              </span>
                              <span className="text-[10px] text-emerald-400 font-medium">
                                {prod.stockAvailable > 0 ? `${prod.stockAvailable} disp.` : "Agotado"}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/product/${prod.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="bg-[#FF6B35]/15 hover:bg-[#FF6B35] text-[#FF6B35] hover:text-white p-2 rounded-lg transition-colors shrink-0"
                            title="Ver ficha del producto"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Follow-up Button */}
                {msg.whatsappText && (
                  <div className="mt-2">
                    <a
                      href={`https://wa.me/56958243917?text=${encodeURIComponent(msg.whatsappText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-[#128C7E]/20 hover:bg-[#128C7E] text-emerald-300 hover:text-white px-3 py-1.5 rounded-full border border-[#128C7E]/40 transition-colors"
                    >
                      <span>💬 Continuar en WhatsApp (+56 9 5824 3917)</span>
                    </a>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-7 h-7 rounded-full bg-[#142232] border border-slate-800 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B35] animate-spin" />
                </div>
                <div className="bg-[#142232] border border-slate-800 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-300">Consultando catálogo...</span>
                  <span className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-[#0C1520] border-t border-slate-800/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Pregúntame por juegos, figuras, regalos..."
                disabled={isLoading}
                className="flex-1 bg-[#142232] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-750 focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#FF6B35] hover:bg-[#E85D25] disabled:opacity-40 text-white p-2.5 rounded-xl shadow transition-colors flex items-center justify-center shrink-0"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              OmniCollector IA • Conectado a inventario real de bodega y precios CLP
            </p>
          </div>
        </div>
      )}
    </>
  );
}
