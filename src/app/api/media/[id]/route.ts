import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!z.string().uuid().safeParse(params.id).success)
    return new Response(null, { status: 404 });
  try {
    if (!adminDb) return new Response(null, { status: 503 });
    const value = (
      await adminDb.collection("media_blobs").doc(params.id).get()
    ).data();
    if (
      !value ||
      !["image/png", "image/jpeg", "image/webp"].includes(value.mime)
    )
      return new Response(null, { status: 404 });
    return new Response(Buffer.from(value.base64, "base64"), {
      headers: {
        "Content-Type": value.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
