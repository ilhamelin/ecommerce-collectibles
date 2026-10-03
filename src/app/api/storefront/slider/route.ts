import { NextRequest } from "next/server";
import { GET as readPublishedSlides } from "@/app/api/admin/slider/route";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  const url = new URL(request.url); url.searchParams.delete("admin");
  return readPublishedSlides(new NextRequest(url, { headers: request.headers }));
}
