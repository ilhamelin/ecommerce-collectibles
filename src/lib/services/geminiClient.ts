/**
 * Centralized Google Gemini API Client & Model Discovery Service
 * Provides automatic discovery of authorized models via ModelService.ListModels,
 * model rotation fallback, key sanitization, and execution telemetry.
 */

let cachedModels: string[] | null = null;
let lastModelFetch = 0;

/**
 * Modern hierarchy of active Google AI Studio Gemini models (2025-2026).
 * Flash and Flash-Lite models are prioritized for low latency and high availability.
 */
export const DEFAULT_CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

/**
 * Retrieves and sanitizes the active Gemini API key from environment variables.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
  ).trim();
}

/**
 * Dynamically queries Google AI Studio's ModelService.ListModels endpoint.
 * Returns only models that are currently available to the active project and support 'generateContent'.
 * Cached in-memory for 1 hour to prevent API round-trip latency.
 */
export async function getSupportedGeminiModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedModels && cachedModels.length > 0 && now - lastModelFetch < 3600000) {
    return cachedModels;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data.models) ? data.models : [];
      const available = rawList
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent")
        )
        .map((m: { name: string }) => m.name.replace(/^models\//, ""))
        .filter(Boolean);

      if (available.length > 0) {
        // Prioritize preferred hierarchy, then append remaining valid models
        const sorted = [
          ...DEFAULT_CANDIDATE_MODELS.filter((p) => available.includes(p)),
          ...available.filter((a: string) => !DEFAULT_CANDIDATE_MODELS.includes(a as any)),
        ];
        cachedModels = sorted;
        lastModelFetch = now;
        return sorted;
      }
    } else {
      const errText = await res.text();
      console.warn("[GeminiClient] ModelService.ListModels returned status:", res.status, errText);
    }
  } catch (err) {
    console.warn("[GeminiClient] Error querying ListModels dynamically:", err);
  }

  return [...DEFAULT_CANDIDATE_MODELS];
}
