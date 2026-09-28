import { NextRequest, NextResponse } from "next/server";
import {
  getTelemetrySummary,
  recordApiUsage,
  clearTelemetryData,
  writeTelemetryToDisk,
  generateSeedTelemetryData,
  TelemetryProvider,
  TelemetryFeature,
} from "@/lib/services/apiTelemetryService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/telemetry
 * Fetches aggregated API telemetry stats and recent call logs.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const timeframeParam = searchParams.get("timeframe") || "30d";
    const validTimeframes = ["today", "7d", "30d", "all"] as const;
    const timeframe = validTimeframes.includes(timeframeParam as any)
      ? (timeframeParam as "today" | "7d" | "30d" | "all")
      : "30d";

    const summary = await getTelemetrySummary(timeframe);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Error desconocido al procesar telemetría";
    console.error("[Telemetry API] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/telemetry
 * Handles management actions: test invocation simulation, reset, or re-seeding.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "SIMULATE_CALL";

    if (action === "RESET") {
      await clearTelemetryData();
      const emptySummary = await getTelemetrySummary("today");
      return NextResponse.json({
        success: true,
        message: "Historial de telemetría limpiado con éxito",
        data: emptySummary,
      });
    }

    if (action === "SEED") {
      const seed = generateSeedTelemetryData();
      writeTelemetryToDisk(seed);
      const summary = await getTelemetrySummary("30d");
      return NextResponse.json({
        success: true,
        message: "Datos de telemetría restaurados con éxito",
        data: summary,
      });
    }

    if (action === "SIMULATE_CALL") {
      const provider = (body.provider as TelemetryProvider) || "GEMINI";
      const feature = (body.feature as TelemetryFeature) || "TEST_SIMULATION";
      const model = body.model || "gemini-1.5-flash";
      const promptTokens = Number(body.promptTokens) || 350;
      const candidatesTokens = Number(body.candidatesTokens) || 120;
      const latencyMs = Number(body.latencyMs) || 820;
      const statusCode = Number(body.statusCode) || 200;

      const record = await recordApiUsage({
        provider,
        feature,
        endpoint: body.endpoint || "/api/admin/telemetry/simulate",
        model,
        promptTokens,
        candidatesTokens,
        latencyMs,
        statusCode,
        success: statusCode >= 200 && statusCode < 300,
      });

      return NextResponse.json({
        success: true,
        message: "Llamada simulada registrada correctamente",
        record,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Acción '${action}' no reconocida`,
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Error al procesar acción de telemetría";
    console.error("[Telemetry API] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errMessage,
      },
      { status: 500 }
    );
  }
}
