/**
 * Cryptographic Admin Session Token Module.
 * Implements HMAC-SHA256 signed session tokens using the Web Crypto API.
 * Ensures zero-dependency execution across Node.js, Next.js Edge Runtime, and browser environments.
 */

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET debe contener al menos 32 caracteres.");
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(getSecretKey());
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface AdminTokenPayload {
  email: string;
  role: "ADMIN";
  iat: number;
  exp: number;
}

/**
 * Creates an HMAC-SHA256 signed session token for an administrator.
 *
 * @param email - Administrator email address.
 * @param ttlSeconds - Time-to-live in seconds (defaults to 8 hours).
 * @returns Serialized base64url signed token.
 */
export async function createAdminSessionToken(
  email: string,
  ttlSeconds: number = 8 * 60 * 60
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    email: email.trim().toLowerCase(),
    role: "ADMIN",
    iat: now,
    exp: now + ttlSeconds,
  };

  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadBytes = enc.encode(payloadJson);
  const payloadEncoded = base64UrlEncode(payloadBytes);

  const key = await getCryptoKey();
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(payloadEncoded)
  );
  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBytes));

  return `${payloadEncoded}.${signatureEncoded}`;
}

/**
 * Verifies an admin session token against tampering and expiration.
 *
 * @param token - Serialized session token.
 * @returns Verification result including decoded email and validity.
 */
export async function verifyAdminSessionToken(
  token?: string | null
): Promise<{ valid: boolean; email?: string; role?: string; error?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token no proporcionado." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Formato de token inválido." };
  }

  const [payloadEncoded, signatureEncoded] = parts;

  try {
    const enc = new TextEncoder();
    const key = await getCryptoKey();
    const signatureBytes = base64UrlDecode(signatureEncoded);

    // Constant-time signature verification via SubtleCrypto
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer as ArrayBuffer,
      enc.encode(payloadEncoded)
    );

    if (!isValid) {
      return { valid: false, error: "Firma criptográfica inválida o alterada." };
    }

    const payloadRaw = new TextDecoder().decode(base64UrlDecode(payloadEncoded));
    const payload: AdminTokenPayload = JSON.parse(payloadRaw);

    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(payload.exp) || payload.exp <= now || !payload.email || !Number.isFinite(payload.iat)) {
      return { valid: false, error: "La sesión administrativa ha expirado." };
    }

    if (payload.role !== "ADMIN") {
      return { valid: false, error: "Privilegios insuficientes." };
    }

    return {
      valid: true,
      email: payload.email,
      role: payload.role,
    };
  } catch (err) {
    return { valid: false, error: "Error de decodificación o verificación." };
  }
}
