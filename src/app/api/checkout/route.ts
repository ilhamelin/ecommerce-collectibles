import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { formatCheckoutValidationIssues } from "@/lib/utils/checkoutValidation";
import { CheckoutRequestSchema, type CheckoutRequestDTO } from "@/lib/validations/schemas";
import { CheckoutService } from "@/lib/services/CheckoutService";
import { DomainError } from "@/lib/errors/DomainErrors";
import { getOrderByIdFromFirestore, updateOrderInFirestore, invalidateProductsCache } from "@/lib/firebase/firestore";
import { commitOrderAndStock } from "@/lib/firebase/commerce";
import { CheckoutResult } from "@/lib/types/domain";
import { IdempotencyConflictError } from "@/lib/errors/DomainErrors";
import { initiatePaymentGateway } from "@/lib/payments/payment-gateway";

import { MemoryTransactionalStore } from "@/lib/db/memory-db";

const pendingCheckouts = new Map<string, { hash: string; promise: Promise<NextResponse> }>();

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get("x-idempotency-key") || req.headers.get("idempotency-key");
    const body = z.record(z.unknown()).parse(await req.json());

    const validated = CheckoutRequestSchema.parse({
      ...body,
      idempotencyKey: idempotencyKey || body.idempotencyKey,
    });

    const hash = new CheckoutService().computeRequestHash({ ...validated, idempotencyKey: undefined });
    const existing = pendingCheckouts.get(validated.idempotencyKey);
    if (existing) {
      if (existing.hash !== hash) throw new IdempotencyConflictError(validated.idempotencyKey);
      return (await existing.promise).clone();
    }
    const promise = executeCheckout(validated, req.nextUrl.origin);
    pendingCheckouts.set(validated.idempotencyKey, { hash, promise });
    try {
      return (await promise).clone();
    } finally {
      pendingCheckouts.delete(validated.idempotencyKey);
    }
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "ValidationError",
          code: "VALIDATION_FAILED",
          message: formatCheckoutValidationIssues(error.issues),
          issues: error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })),
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "ValidationError", code: "VALIDATION_FAILED", message: "La solicitud de compra no tiene un formato válido. Vuelve a intentarlo." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: "InternalError", message }, { status: 500 });
  }
}

async function executeCheckout(validated: CheckoutRequestDTO, baseUrl: string): Promise<NextResponse> {
  const checkoutService = new CheckoutService();
  const orderId = checkoutService.getOrderId(validated.idempotencyKey);
  const hash = checkoutService.computeRequestHash({ ...validated, idempotencyKey: undefined });
  const persistedOrder = await getOrderByIdFromFirestore(orderId);
  if (persistedOrder && persistedOrder.checkoutRequestHash !== hash) {
    throw new IdempotencyConflictError(validated.idempotencyKey);
  }
  let result: CheckoutResult;
  if (persistedOrder) {
    result = {
      orderId: persistedOrder.id, orderNumber: persistedOrder.orderNumber,
      totalAmountChargedNow: persistedOrder.totalChargedNow,
      remainingBalanceLater: persistedOrder.remainingBalanceLater,
      reservationIds: persistedOrder.reservationIds,
      expiresAt: new Date(new Date(persistedOrder.createdAt).getTime() + 15 * 60 * 1000).toISOString(),
      trackingNumber: persistedOrder.shippingMethod.trackingNumber,
      order: persistedOrder,
    };
  } else {
    await MemoryTransactionalStore.getInstance().syncAllFromFirestore();
    result = await checkoutService.processCheckout(validated);
    if (!result.order) throw new Error("No se pudo generar el pedido.");
    try {
      const candidate = result.order;
      const committed = await commitOrderAndStock(candidate);
      if (committed.orderNumber !== candidate.orderNumber) {
        await checkoutService.rollbackCheckout(validated.idempotencyKey);
        MemoryTransactionalStore.getInstance().orders.set(committed.id, committed);
      } else {
        checkoutService.finalizePersistedOrder(committed);
      }
      result = { ...result, order: committed, orderNumber: committed.orderNumber,
        totalAmountChargedNow: committed.totalChargedNow, remainingBalanceLater: committed.remainingBalanceLater,
        reservationIds: committed.reservationIds, trackingNumber: committed.shippingMethod.trackingNumber };
      invalidateProductsCache();
    } catch (error) {
      await checkoutService.rollbackCheckout(validated.idempotencyKey);
      throw error;
    }
  }
  if (!result.order) throw new Error("No se pudo recuperar el pedido.");

  // If Bank Transfer, dispatch immediate confirmation receipt email with payment instructions
  if (!persistedOrder && result.order.paymentMethod === "BANK_TRANSFER") {
    try {
      const { sendOrderConfirmationEmail } = await import("@/lib/services/emailService");
      await sendOrderConfirmationEmail(result.order);
    } catch (emailErr) {
      console.warn("[Checkout] Failed to dispatch bank transfer email:", emailErr);
    }
  }

  // Initiate real payment gateway (Mercado Pago / Flow / Sandbox)
  const gateway = result.order.checkoutGateway || await initiatePaymentGateway(result.order, baseUrl);
  if (!result.order.checkoutGateway) {
    result.order.checkoutGateway = gateway;
    await updateOrderInFirestore(result.order.id, { checkoutGateway: gateway });
    MemoryTransactionalStore.getInstance().orders.set(result.order.id, result.order);
  }

  return NextResponse.json({
    success: true,
    data: {
      ...result,
      gateway,
    },
  }, { status: 201 });
}
