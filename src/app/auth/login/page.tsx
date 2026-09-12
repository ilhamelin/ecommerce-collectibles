"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  CreditCard,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/account";
  const initialMode = searchParams?.get("mode") === "register" ? "REGISTER" : "LOGIN";

  const { login, register, loginWithGoogle, isAuthenticated, isAdmin, requestPasswordReset } = useAuthStore();

  const [mode, setMode] = useState<"LOGIN" | "REGISTER" | "FORGOT">(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regRut, setRegRut] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");

  // Feedback messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(isAdmin ? "/admin/products" : redirectUrl);
    }
  }, [isAuthenticated, isAdmin, redirectUrl, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!captchaChecked) {
      setErrorMessage("Por favor confirme la verificación de seguridad (No soy un robot).");
      return;
    }

    setIsSubmitting(true);
    const res = login(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regPassword.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    const res = register({
      fullName: regFullName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      rut: regRut,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleGoogleLogin = () => {
    const res = loginWithGoogle();
    setSuccessMessage(res.message);
    setTimeout(() => {
      router.push(redirectUrl);
    }, 500);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMessage("Por favor ingresa tu correo electrónico.");
      return;
    }
    const res = requestPasswordReset(forgotEmail);
    setSuccessMessage(res.message);
    setErrorMessage(null);
  };

  const quickFillClient = () => {
    setLoginEmail("cliente@omnicollector.cl");
    setLoginPassword("cliente123");
    setCaptchaChecked(true);
    setErrorMessage(null);
  };

  const quickFillAdmin = () => {
    setLoginEmail("admin@omnicollector.cl");
    setLoginPassword("admin123");
    setCaptchaChecked(true);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#666666] border-b border-[#E5E5E5] pb-4">
        <Link href="/" className="hover:text-[#1A1A1A]">Inicio</Link>
        <span>/</span>
        <span className="text-[#FF6B35] font-semibold">
          {mode === "REGISTER" ? "Crear una Cuenta" : mode === "FORGOT" ? "Recuperar Contraseña" : "Inicio de Sesión"}
        </span>
      </div>

      {/* Main Title */}
      <div className="border-b-2 border-[#1F3A5F] pb-3">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight">
          {mode === "REGISTER"
            ? "Crear Cuenta de Cliente"
            : mode === "FORGOT"
            ? "Recuperar Contraseña"
            : "Inicio de sesión de cliente"}
        </h1>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-[#D64545]/30 text-[#D64545] text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-[#D64545] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-[#2E9E5B]/30 text-[#2E9E5B] text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Demo Quick Access Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="text-xs text-[#666666] text-center sm:text-left">
          <strong className="text-[#1A1A1A] block sm:inline">Accesos de Prueba Rápida: </strong>
          Prueba el rol de Cliente Común o Administrador con un solo clic.
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={quickFillClient}
            className="px-3.5 py-1.5 rounded-lg bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>Cliente Común</span>
          </button>

          <button
            type="button"
            onClick={quickFillAdmin}
            className="px-3.5 py-1.5 rounded-lg bg-[#FF6B35] hover:bg-[#E85A24] text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrador</span>
          </button>
        </div>
      </div>

      {/* RETAIL SPLIT SCREEN VIEW */}
      {mode === "LOGIN" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-10 shadow-sm">
          {/* Left Column: Clientes Registrados */}
          <div className="md:col-span-7 space-y-6 md:border-r md:border-[#E5E5E5] md:pr-8 lg:pr-12">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">Clientes registrados</h2>
              <p className="text-xs text-[#666666] mt-1">
                Si tiene una cuenta, inicie sesión con su dirección de correo electrónico.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  Correo electrónico<span className="text-[#FF6B35]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.cl"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  Contraseña<span className="text-[#FF6B35]">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Show Password Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-[#E5E5E5] bg-[#F7F7F5] text-[#FF6B35] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="showPass" className="text-xs text-[#666666] cursor-pointer">
                  Mostrar contraseña
                </label>
              </div>

              {/* reCAPTCHA Box */}
              <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-between max-w-xs shadow-inner">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captchaChecked}
                    onChange={(e) => setCaptchaChecked(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#E5E5E5] text-[#FF6B35] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[#1A1A1A]">No soy un robot</span>
                </label>
                <div className="flex flex-col items-center opacity-70">
                  <RotateCcw className="w-4 h-4 text-[#1F3A5F]" />
                  <span className="text-[8px] font-mono text-[#666666] uppercase">reCAPTCHA</span>
                </div>
              </div>

              {/* Actions Button & Forgot Password */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-[#FF6B35]/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Accediendo..." : "INICIAR SESIÓN"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("FORGOT");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-[#666666] hover:text-[#FF6B35] underline transition"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>

              <div className="pt-2">
                <span className="text-[11px] text-[#D64545] block">* Campos obligatorios</span>
              </div>

              {/* Social Login Divider */}
              <div className="pt-4 border-t border-[#E5E5E5] space-y-3">
                <p className="text-xs text-[#666666]">O inicia sesión de forma instantánea:</p>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-bold text-[#1A1A1A] transition flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Nuevos Clientes */}
          <div className="md:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-[#1A1A1A]">Nuevos clientes</h2>
              <p className="text-xs text-[#666666] leading-relaxed">
                Crear una cuenta tiene muchos beneficios: Pago más rápido, guardar más de una dirección, seguimiento de pedidos en tiempo real y cupones exclusivos para tu colección.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                  <span>Historial completo de pedidos y boletas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                  <span>Alertas prioritarias de preventas japonesas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                  <span>Libreta de direcciones para despacho en Chile</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
                  <span>Cupón $5.000 CLP de bienvenida</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                onClick={() => {
                  setMode("REGISTER");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-black text-xs uppercase tracking-wider transition shadow-md text-center block"
              >
                CREAR UNA CUENTA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION FORM VIEW */}
      {mode === "REGISTER" && (
        <div className="max-w-2xl mx-auto bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Registro de Usuario</span>
              <h2 className="text-xl font-black text-[#1A1A1A] mt-1">Crea tu Cuenta en OmniCollector</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("LOGIN");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-[#666666] hover:text-[#1A1A1A] underline"
            >
              Ya tengo cuenta
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Camila Morales Silva"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="camila@correo.cl"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="+56 9 8765 4321"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Contraseña (mínimo 6 caracteres) *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">RUT Chileno (Opcional)</label>
                <input
                  type="text"
                  placeholder="19.824.105-3"
                  value={regRut}
                  onChange={(e) => setRegRut(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A24] text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-[#FF6B35]/20"
            >
              {isSubmitting ? "Creando cuenta..." : "REGISTRARME Y COMENZAR"}
            </button>
          </form>
        </div>
      )}

      {/* FORGOT PASSWORD VIEW */}
      {mode === "FORGOT" && (
        <div className="max-w-xl mx-auto bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Seguridad de Cuenta</span>
            <h2 className="text-xl font-black text-[#1A1A1A] mt-1">¿Olvidó su contraseña?</h2>
            <p className="text-xs text-[#666666] mt-1">
              Ingrese su correo electrónico y le enviaremos las instrucciones para restablecer su clave.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                placeholder="tu@correo.cl"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder-[#666666]/60 focus:outline-none focus:border-[#FF6B35] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#1F3A5F] hover:bg-[#152842] text-white font-bold text-xs transition shadow-sm"
              >
                Enviar Enlace de Recuperación
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("LOGIN");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-[#666666] hover:text-[#1A1A1A] underline"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-[#9bb5c2] text-sm">
          Cargando portal de autenticación...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
