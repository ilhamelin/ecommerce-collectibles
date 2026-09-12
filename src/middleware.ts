import { NextResponse, type NextRequest } from "next/server";

// In-memory sliding window rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

function checkRateLimit(ip: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Periodic cleanup of expired entries to prevent memory leak
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// Common malicious pattern detector (SQLi, XSS, Path Traversal)
const MALICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /%3cscript/gi,
  /\.\.\//g,
  /\.\.%2f/gi,
  /%2e%2e/gi,
  /%00/g,
  /union\s+(all\s+)?select/gi,
  /union\+select/gi,
  /<img\s+src=.*onerror/gi,
  /javascript:/gi,
];

function containsMaliciousPayload(input: string): boolean {
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const clientIp = getClientIp(req);

  // 1. Check for malicious injection patterns in URL and query parameters
  const fullUrlDecoded = decodeURIComponent(pathname + search);
  if (containsMaliciousPayload(fullUrlDecoded)) {
    console.warn(`[SECURITY_BLOCKED] Malicious request pattern detected from IP ${clientIp} at ${pathname}`);
    return new NextResponse(
      JSON.stringify({
        error: "Forbidden",
        message: "Petición bloqueada por políticas de seguridad contra inyección y scripts maliciosos.",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2. Rate Limiting on API endpoints
  if (pathname.startsWith("/api/")) {
    const isSensitive =
      pathname.startsWith("/api/checkout") ||
      pathname.startsWith("/api/users") ||
      pathname.includes("/transition");

    const limit = isSensitive ? 20 : 80; // 20 req/min for sensitive, 80 req/min for standard
    const windowMs = 60 * 1000;

    const rateResult = checkRateLimit(`${clientIp}:${isSensitive ? "sens" : "gen"}`, limit, windowMs);

    if (!rateResult.allowed) {
      console.warn(`[RATE_LIMIT_EXCEEDED] IP ${clientIp} exceeded rate limit on ${pathname}`);
      return new NextResponse(
        JSON.stringify({
          error: "TooManyRequests",
          message: "Has superado el límite de peticiones por minuto. Por favor, espera antes de reintentar.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // 3. Inject standard security headers
  const res = NextResponse.next();

  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self 'https://www.mercadopago.com' 'https://sdk.mercadopago.com')"
  );

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.png, .jpg, .svg, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif)$).*)",
  ],
};
