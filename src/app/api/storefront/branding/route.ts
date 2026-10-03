// Published branding has a public read endpoint; writes stay under /api/admin.
export { GET } from "@/app/api/admin/branding/route";
export const dynamic = "force-dynamic";
