"use client";
import { identityHeaders } from "@/lib/auth/clientIdentity";
export async function toolRequest<T>(
  url: string,
  body?: unknown,
  method = "POST",
  appCheck = false,
): Promise<T> {
  const response = await fetch(url, {
    method: body ? method : "GET",
    headers: {
      ...(await identityHeaders(appCheck)),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
    cache: "no-store",
  });
  const result = (await response.json()) as {
    success: boolean;
    data: T;
    error?: string;
  };
  if (!response.ok || !result.success)
    throw new Error(result.error || "No se pudo completar la operación.");
  return result.data;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function optimizeImage(file: File): Promise<Blob> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Usa PNG, JPEG o WebP de hasta 5 MB.");
  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > 20000000)
      throw new Error(
        "La imagen tiene demasiados píxeles. Redúcela antes de subir.",
      );
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= 350 * 1024) return blob;
    }
    throw new Error(
      "La imagen optimizada supera 350 KB. Prueba una imagen más sencilla.",
    );
  } finally {
    image.close();
  }
}
