/**
 * Media and Video utilities for OmniCollector Chile
 */

/**
 * Extracts a YouTube Video ID and returns a safe embed URL.
 * Handles standard youtube.com/watch?v=, youtu.be/, shorts/, and embed/ URLs.
 */
export function extractYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // If already an embed URL
  if (trimmed.includes("youtube.com/embed/") || trimmed.includes("youtube-nocookie.com/embed/")) {
    return trimmed;
  }

  // Handle youtu.be/<id>
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
  }

  // Handle youtube.com/watch?v=<id>
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  }

  // Handle youtube.com/shorts/<id>
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?rel=0&modestbranding=1`;
  }

  // If passed just the 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube-nocookie.com/embed/${trimmed}?rel=0&modestbranding=1`;
  }

  return null;
}

/**
 * Extrae el ID de archivo de Google Drive desde múltiples formatos de URL:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * - https://lh3.googleusercontent.com/d/FILE_ID
 * - ID puro alfanumérico
 */
export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. /file/d/{id} o /d/{id}
  const pathMatch = trimmed.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // 2. Query param ?id={id} o &id={id}
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // 3. Cadena pura si coincide con longitud y formato estándar de ID de Drive (mínimo 20 caracteres)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Normaliza cualquier URL de imagen, convirtiendo URLs de Google Drive
 * en el formato CDN directo (https://lh3.googleusercontent.com/d/{id})
 * para que se renderice instantáneamente en etiquetas <img> y Next.js sin páginas de visor HTML intermedias.
 */
export function normalizeImageUrl(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Si contiene patrones de Google Drive o Google Docs
  if (
    trimmed.includes("drive.google.com") ||
    trimmed.includes("docs.google.com") ||
    trimmed.includes("googleusercontent.com")
  ) {
    const driveId = extractGoogleDriveFileId(trimmed);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}`;
    }
  }

  // Si el usuario ingresó solo el ID largo de Google Drive directamente
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed) && !trimmed.startsWith("http")) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  return trimmed;
}
