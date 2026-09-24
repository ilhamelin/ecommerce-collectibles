/**
 * Admin role resolution and email whitelist management.
 * Provides environment-aware admin email resolution and fallback persistence.
 */

export const DEFAULT_ADMIN_EMAILS: readonly string[] = [
  "admin@omnicollector.cl",
  "benjaigancioreyes56@gmail.com",
];

/**
 * Returns the normalized, lowercased set of email addresses with permanent ADMIN privileges.
 */
export function getAdminEmails(): string[] {
  const envAdminEmails =
    (typeof process !== "undefined" && (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS)) ||
    "";

  const customList = envAdminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const combined = [...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...customList];
  return Array.from(new Set(combined));
}

/**
 * Determines whether a given email address is recognized as an administrator.
 *
 * @param email - The email to test.
 * @returns true if the email is in the admin whitelist.
 */
export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  return getAdminEmails().includes(clean);
}
