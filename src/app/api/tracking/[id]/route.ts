import { NextRequest, NextResponse } from "next/server";
import { afterShipService } from "@/lib/services/aftershipService";
import { getOrderByIdFromFirestore } from "@/lib/firebase/firestore";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { formatTrackingNumber } from "@/lib/tracking/chilean-couriers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/tracking/[id]
 * Consulta el estado de trazabilidad y eventos de despacho para una orden o número OT.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params?.id?.trim();
    if (!rawId) {
      return NextResponse.json(
        { success: false, error: "Identificador de seguimiento no proporcionado." },
        { status: 400 }
      );
    }

    // 1. Intentar consultar si el parámetro corresponde a una orden existente en Firestore o en Memoria
    let resolvedOT = rawId;
    let courierName = "Starken";
    let orderNumber = rawId;

    try {
      const order =
        (await getOrderByIdFromFirestore(rawId)) ||
        MemoryTransactionalStore.getInstance().orders.get(rawId);

      if (order) {
        resolvedOT = formatTrackingNumber(
          order.shippingMethod?.trackingNumber,
          order.orderNumber || order.id
        );
        courierName = order.shippingMethod?.name || "Starken";
        orderNumber = order.orderNumber || order.id;
      }
    } catch (orderLookupError) {
      // Si la búsqueda por ID de orden falla o no existe, asumimos que rawId es directamente un número de tracking OT
      console.info(`[API Tracking] Consulta por OT directa o identificador: ${rawId}`);
    }

    // 2. Consultar el servicio AfterShip
    const trackingResult = await afterShipService.getTracking(resolvedOT, courierName);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...trackingResult,
          orderNumber,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[API Tracking GET] Error procesando seguimiento:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno procesando seguimiento.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracking/[id]
 * Registra un número de seguimiento en AfterShip para monitoreo continuo.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const trackingNumber = (body?.trackingNumber || params?.id)?.trim();
    const courierSlug = body?.courierSlug || "starken";
    const orderId = body?.orderId || params?.id;

    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, error: "trackingNumber es obligatorio." },
        { status: 400 }
      );
    }

    const created = await afterShipService.createTracking(
      trackingNumber,
      courierSlug,
      orderId
    );

    return NextResponse.json(
      {
        success: true,
        registeredInAfterShip: created,
        message: created
          ? "Número de seguimiento registrado exitosamente en AfterShip."
          : "Registro en AfterShip omitido o completado en modo local.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Tracking POST] Error creando seguimiento en AfterShip:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error registrando tracking.",
      },
      { status: 500 }
    );
  }
}
