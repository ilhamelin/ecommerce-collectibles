import { NextRequest, NextResponse } from "next/server";
import { PreOrderService } from "@/lib/services/PreOrderService";
import { PreOrderTransitionSchema } from "@/lib/validations/schemas";
import { DomainError } from "@/lib/errors/DomainErrors";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = PreOrderTransitionSchema.parse({
      ...body,
      productId: params.id,
    });

    const preOrderService = new PreOrderService();
    const result = preOrderService.transitionState(params.id, validated.newState);

    return NextResponse.json({
      success: true,
      data: {
        product: result.product,
        webhookEvent: result.webhookEvent,
      },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: "InternalError", message }, { status: 500 });
  }
}
