import crypto from "crypto";

/**
 * Hashes a plain-text password using SHA-256 with a unique salt
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");

  return { hash, salt };
}

/**
 * Verifies if a password matches an existing salted hash
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

/**
 * Sanitizes input to escape HTML tags and dangerous characters against XSS
 */
export function escapeHtml(unsafeText: string): string {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips all HTML tags completely for plain text fields
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>?/gm, "").trim();
}
