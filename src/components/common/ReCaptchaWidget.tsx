"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, RotateCcw, AlertCircle } from "lucide-react";

interface ReCaptchaWidgetProps {
  checked: boolean;
  onChange: (verified: boolean) => void;
  hasError?: boolean;
}

export function ReCaptchaWidget({ checked, onChange, hasError }: ReCaptchaWidgetProps) {
  const [status, setStatus] = useState<"IDLE" | "VERIFYING" | "VERIFIED">(
    checked ? "VERIFIED" : "IDLE"
  );
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external checked state
  useEffect(() => {
    if (checked && status !== "VERIFIED") {
      setStatus("VERIFIED");
    } else if (!checked && status === "VERIFIED") {
      setStatus("IDLE");
    }
  }, [checked, status]);

  // Shake animation when error triggered
  useEffect(() => {
    if (hasError && status !== "VERIFIED") {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [hasError, status]);

  const handleClickCheckbox = () => {
    if (status === "VERIFYING") return;

    if (status === "VERIFIED") {
      // Allow unchecking or resetting
      setStatus("IDLE");
      onChange(false);
      return;
    }

    // Start verification
    setStatus("VERIFYING");

    // Human-like verification delay (650ms - 900ms)
    const delay = 750 + Math.random() * 200;
    setTimeout(() => {
      setStatus("VERIFIED");
      onChange(true);
    }, delay);
  };

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        className={`inline-flex items-center justify-between w-full max-w-[302px] h-[76px] px-3.5 py-2 bg-[#F9F9F9] rounded border transition-all duration-200 select-none shadow-[0_0_4px_rgba(0,0,0,0.08)] ${
          hasError && status !== "VERIFIED"
            ? "border-[#D93025] ring-1 ring-[#D93025]/30"
            : status === "VERIFIED"
            ? "border-[#2E9E5B]/40 bg-emerald-50/20"
            : "border-[#D3D3D3] hover:border-[#B5B5B5]"
        } ${shake ? "animate-shake" : ""}`}
        style={{
          boxShadow: "0 0 4px 1px rgba(0,0,0,0.08)",
        }}
      >
        {/* Left: Checkbox + Label */}
        <div
          onClick={handleClickCheckbox}
          className="flex items-center gap-3 cursor-pointer py-2 pr-2"
          role="button"
          tabIndex={0}
          aria-label="Verificación de seguridad reCAPTCHA No soy un robot"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClickCheckbox();
            }
          }}
        >
          {/* Checkbox Box */}
          <div
            className={`w-[26px] h-[26px] rounded-[2px] border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
              status === "VERIFIED"
                ? "bg-[#2E9E5B] border-[#2E9E5B] text-white shadow-xs"
                : status === "VERIFYING"
                ? "border-transparent bg-transparent"
                : hasError
                ? "border-[#D93025] bg-white"
                : "border-[#C1C1C1] bg-white hover:border-[#999999]"
            }`}
          >
            {status === "VERIFYING" && (
              <div className="w-[22px] h-[22px] border-[3px] border-[#4285F4] border-t-transparent rounded-full animate-spin" />
            )}
            {status === "VERIFIED" && (
              <Check className="w-4 h-4 stroke-[3] text-white animate-scale-in" />
            )}
          </div>

          {/* Label */}
          <span className="text-[13px] font-medium text-[#1A1A1A] tracking-normal">
            No soy un robot
          </span>
        </div>

        {/* Right: Google reCAPTCHA Branding */}
        <div className="flex flex-col items-center justify-center pl-2 text-center select-none shrink-0 opacity-90">
          {/* Google reCAPTCHA Symbol */}
          <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none">
            {/* Blue Arrow */}
            <path
              d="M32 6C17.64 6 6 17.64 6 32h7c0-10.5 8.5-19 19-19 4.3 0 8.25 1.44 11.45 3.86L38 22h20V2l-5.6 5.6C47.45 3.9 40.05 1.5 32 6z"
              fill="#4285F4"
            />
            {/* Green Arrow */}
            <path
              d="M58 32c0 14.36-11.64 26-26 26h-7v-7c10.5 0 19-8.5 19-19 0-4.3-1.44-8.25-3.86-11.45L46 16l-20 0v20l5.6-5.6C36.55 35.1 43.95 37.5 58 32z"
              fill="#34A853"
            />
            {/* Yellow / Red accent */}
            <path
              d="M17.45 46.54L22 42H2v20l5.6-5.6C12.55 60.1 19.95 62.5 28 58v-7c-4.3 0-8.25-1.44-11.45-3.86l.9-.6z"
              fill="#FBBC05"
            />
            <circle cx="32" cy="32" r="6" fill="#4285F4" />
          </svg>

          {/* Text branding */}
          <span className="text-[9px] font-bold text-[#555555] tracking-tight leading-none mt-0.5">
            reCAPTCHA
          </span>
          <div className="flex items-center gap-1 text-[8px] text-[#777777] leading-none mt-1">
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#4285F4]"
            >
              Privacidad
            </a>
            <span>-</span>
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#4285F4]"
            >
              Condiciones
            </a>
          </div>
        </div>
      </div>

      {hasError && status !== "VERIFIED" && (
        <p className="text-[11px] font-semibold text-[#D93025] flex items-center gap-1 pt-0.5 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Por favor, completa la verificación de seguridad.
        </p>
      )}
    </div>
  );
}
