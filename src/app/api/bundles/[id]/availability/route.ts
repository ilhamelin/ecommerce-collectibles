import { NextRequest, NextResponse } from "next/server";
import { BundleService } from "@/lib/services/BundleService";
import { DomainError } from "@/lib/errors/DomainErrors";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleService = new BundleService();
    const availability = bundleService.getBundleAvailability(params.id);
    return NextResponse.json({ success: true, data: availability });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    return NextResponse.json({ error: "Bundle availability calculation failed" }, { status: 500 });
  }
}
