/**
 * File Upload Security Guard for OmniCollector
 * Restricts uploads to permitted MIME types and size limits (max 5MB)
 */

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de 5 MB (actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const normalizedType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(normalizedType as any)) {
    return {
      valid: false,
      error: `Formato de archivo '${file.type}' no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP) o comprobantes PDF.`,
    };
  }

  // Prevent double extension attacks (e.g. evil.php.jpg)
  const parts = file.name.split(".");
  if (parts.length > 2) {
    const extension = parts.pop()?.toLowerCase();
    const dangerousExtensions = ["php", "exe", "js", "sh", "bat", "html", "svg", "phtml"];
    if (dangerousExtensions.some((ext) => parts.includes(ext))) {
      return {
        valid: false,
        error: "Nombre de archivo potencialmente peligroso detectado.",
      };
    }
  }

  return { valid: true };
}
