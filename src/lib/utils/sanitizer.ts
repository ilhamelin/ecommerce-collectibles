/**
 * Utility for sanitizing string inputs against XSS, HTML injection and dangerous characters.
 */

export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    // Remove null bytes
    .replace(/\0/g, "")
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove javascript: pseudo-protocols
    .replace(/javascript:/gi, "")
    // Remove data: URLs that could contain SVG/HTML payloads
    .replace(/data:text\/html/gi, "")
    // Escape quote characters that could break attributes if passed unsanitized
    .replace(/["']/g, (char) => (char === '"' ? "&quot;" : "&#x27;"))
    .trim();
}

/**
 * Sanitizes an object's string fields recursively
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeText(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeObject(value);
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Strips sensitive fields (like passwords) from user objects before returning to clients
 */
export function sanitizeUserOutput<T extends Record<string, any>>(user: T): Omit<T, "password"> {
  const { password, ...safeUser } = user;
  return safeUser;
}
