import { NextRequest, NextResponse } from "next/server";
import { CheckoutRequestSchema } from "@/lib/validations/schemas";
import { CheckoutService } from "@/lib/services/CheckoutService";
import { DomainError } from "@/lib/errors/DomainErrors";
import { createOrderInFirestore } from "@/lib/firebase/firestore";
import { initiatePaymentGateway } from "@/lib/payments/payment-gateway";

import { MemoryTransactionalStore } from "@/lib/db/memory-db";

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get("x-idempotency-key") || req.headers.get("idempotency-key");
    const body = await req.json();

    const validated = CheckoutRequestSchema.parse({
      ...body,
      idempotencyKey: idempotencyKey || body.idempotencyKey,
    });

    // Ensure memory transactional store has up-to-date products from Firestore
    await MemoryTransactionalStore.getInstance().syncAllFromFirestore();

    const checkoutService = new CheckoutService();
    const result = await checkoutService.processCheckout(validated);

    if (!result.order) {
      return NextResponse.json(
        { error: "OrderProcessingError", message: "No se pudo generar la orden" },
        { status: 500 }
      );
    }

    // Persist order to Firestore if configured
    await createOrderInFirestore(result.order);

    // Initiate real payment gateway (Mercado Pago / Flow / Sandbox)
    const baseUrl = req.nextUrl.origin;
    const gateway = await initiatePaymentGateway(result.order, baseUrl);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        gateway,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        {
          error: "ValidationError",
          code: "VALIDATION_FAILED",
          details: error,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: "InternalError", message }, { status: 500 });
  }
}
