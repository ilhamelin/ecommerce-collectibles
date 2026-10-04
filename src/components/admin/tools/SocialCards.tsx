"use client";
import React, { useEffect, useRef, useState } from "react";
import type { ProductDomainEntity } from "@/lib/types/domain";
import { formatCLP } from "@/lib/utils/currency";
import { downloadBlob } from "@/lib/admin-tools/client";
import { socialDimensions, wrapCanvasText } from "@/lib/admin-tools/social";
import { MediaPicker } from "./MediaPicker";
export function SocialCards({ products }: { products: ProductDomainEntity[] }) {
  const [id, setId] = useState(products[0]?.id || "");
  const [format, setFormat] = useState<keyof typeof socialDimensions>("square");
  const [color, setColor] = useState("#1F3A5F");
  const [brand, setBrand] = useState("OMNICOLLECTOR");
  const [price, setPrice] = useState(true);
  const [override, setOverride] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const product = products.find((item) => item.id === id);
  useEffect(() => {
    let active = true;
    setReady(false);
    setError("");
    async function draw() {
      if (!product || !canvas.current) return;
      try {
        const [width, height] = socialDimensions[format];
        const node = canvas.current;
        node.width = width;
        node.height = height;
        const ctx = node.getContext("2d");
        if (!ctx) throw new Error("Canvas no disponible.");
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "rgba(255,255,255,.06)");
        gradient.addColorStop(1, "rgba(0,0,0,.35)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#FF6B35";
        ctx.fillRect(64, 64, 12, 42);
        ctx.font = "bold 34px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(brand.slice(0, 30), 96, 96);
        const url = override || product.imageUrl || product.images?.[0];
        const top = 150;
        const area = height - 490;
        ctx.fillStyle = "rgba(255,255,255,.96)";
        ctx.fillRect(64, top, width - 128, area);
        if (url) {
          const image = new Image();
          image.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () =>
              reject(
                new Error(
                  "No se puede exportar esa foto por CORS. Elige una imagen de tu biblioteca.",
                ),
              );
            image.src = url;
          });
          if (!active) return;
          const scale = Math.min(
            (width - 180) / image.width,
            (area - 48) / image.height,
          );
          ctx.drawImage(
            image,
            (width - image.width * scale) / 2,
            top + (area - image.height * scale) / 2,
            image.width * scale,
            image.height * scale,
          );
        } else {
          ctx.fillStyle = "#1F3A5F";
          ctx.font = "32px Arial";
          ctx.fillText(
            "Añade una foto desde la biblioteca",
            95,
            top + area / 2,
          );
        }
        ctx.fillStyle = "white";
        ctx.font = "bold 44px Arial";
        const lines = wrapCanvasText(ctx, product.name, width - 128);
        lines
          .slice(0, 3)
          .forEach((line, index) =>
            ctx.fillText(line, 64, height - 270 + index * 54, width - 128),
          );
        if (lines.length > 3) {
          ctx.font = "22px Arial";
          ctx.fillText("Ver ficha completa en la tienda", 64, height - 100);
        }
        if (price) {
          ctx.font = "bold 45px Arial";
          ctx.fillStyle = "#FF8A5B";
          ctx.fillText(formatCLP(product.price), 64, height - 62);
        }
        ctx.fillStyle = "rgba(255,255,255,.75)";
        ctx.font = "22px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
          product.isPreOrder ? "PREVENTA" : "CATÁLOGO",
          width - 64,
          height - 64,
        );
        ctx.textAlign = "left";
        if (active) setReady(true);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "No se pudo generar la ficha.",
          );
      }
    }
    void draw();
    return () => {
      active = false;
    };
  }, [product, format, color, brand, price, override]);
  async function exportCard(type: "image/png" | "image/jpeg") {
    try {
      if (!ready || !canvas.current) return;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.current!.toBlob(resolve, type, 0.94),
      );
      if (!blob) throw new Error("No se pudo exportar.");
      downloadBlob(
        blob,
        `${product?.sku || "producto"}-${format}.${type === "image/png" ? "png" : "jpg"}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar.");
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-black text-[#1F3A5F]">Fichas para redes</h2>
      <p className="text-sm text-slate-600">
        Composición descargable con datos reales del producto. No publica en
        redes ni realiza cobros.
      </p>
      <div className="grid lg:grid-cols-[1fr_440px] gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Producto
            <select
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setOverride("");
              }}
              className="block w-full border rounded-xl p-3 mt-1"
            >
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Formato
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className="block w-full border rounded-xl p-3 mt-1"
            >
              <option value="square">Cuadrado · 1080 × 1080</option>
              <option value="portrait">Vertical · 1080 × 1350</option>
              <option value="story">Historia · 1080 × 1920</option>
            </select>
          </label>
          <label className="block text-sm font-bold">
            Texto de marca
            <input
              maxLength={30}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="block w-full border rounded-xl p-3 mt-1"
            />
          </label>
          <label className="flex gap-3 items-center text-sm">
            Color de fondo
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={price}
              onChange={(e) => setPrice(e.target.checked)}
            />
            Incluir precio actual
          </label>
          <MediaPicker onSelect={setOverride} />
          {override && (
            <button
              onClick={() => setOverride("")}
              className="ml-3 text-sm underline"
            >
              Usar foto del producto
            </button>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={!ready}
              onClick={() => void exportCard("image/png")}
              className="rounded-xl bg-[#FF6B35] text-white p-3 disabled:opacity-50"
            >
              Descargar PNG
            </button>
            <button
              disabled={!ready}
              onClick={() => void exportCard("image/jpeg")}
              className="rounded-xl border p-3 disabled:opacity-50"
            >
              Descargar JPG
            </button>
          </div>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
        </div>
        <canvas
          ref={canvas}
          aria-label="Vista previa de la ficha social"
          className="w-full h-auto rounded-2xl shadow-lg border"
        />
      </div>
    </section>
  );
}
