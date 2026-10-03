import { pruneArchivedLinks } from "@/lib/services/visualVersionLinks";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { visualDocuments, withAdminHistory, writeAdminDocument, type VisualSection } from "@/lib/services/adminHistory";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { POST as saveHero } from "@/app/api/admin/home-hero/route";
import { POST as saveBrand } from "@/app/api/admin/branding/route";
import { POST as saveSlider } from "@/app/api/admin/slider/route";
import { POST as saveAnnouncement } from "@/app/api/admin/announcement/route";
import { POST as saveSides } from "@/app/api/admin/side-banners/route";
export const dynamic = "force-dynamic";
const section = z.enum(["portada", "marca", "carrusel", "anuncios", "laterales"]);
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("capture"), section, name: z.string().trim().min(1).max(80) }).strict(),
  z.object({ action: z.literal("restore"), id: z.string().max(128).regex(/^[^/]+$/) }).strict(),
]);
export async function GET(request: NextRequest) {
  if (!(await verifyAdminAuthorization(request)).authorized) return NextResponse.json({ success: false }, { status: 403 });
  if (!adminDb) return NextResponse.json({ success: false, error: "Las versiones requieren Firebase Admin." }, { status: 503 });
  try {
    const versions = await adminDb.collection("visual_versions").orderBy("at", "desc").limit(100).get();
    return NextResponse.json({ success: true, data: versions.docs.map(doc => ({ ...doc.data(), id: doc.id })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ success: false, error: "No se pudieron cargar las versiones." }, { status: 503 }); }
}
async function postHandler(request: NextRequest) {
  if (!adminDb) return NextResponse.json({ success: false, error: "Firebase Admin no está disponible. No se guardó ningún cambio." }, { status: 503 });
  try {
    const parsed = input.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Revisa los datos de la versión." }, { status: 400 });
    if (parsed.data.action === "capture") {
      const data = parsed.data;
      const [collection, document] = visualDocuments[data.section];
      const snapshot = await adminDb.collection(collection).doc(document).get();
      if (!snapshot.exists) return NextResponse.json({ success: false, error: "Guarda primero esta sección desde su editor." }, { status: 409 });
      const actor = (await verifyAdminAuthorization(request)).actor || "";
      await writeAdminDocument("visual_versions", adminDb.collection("visual_versions").doc().id, { section: data.section, name: data.name, actor, at: new Date().toISOString(), payload: snapshot.data() }, false);
      return NextResponse.json({ success: true });
    }
    const snapshot = await adminDb.collection("visual_versions").doc(parsed.data.id).get();
    const version = snapshot.data();
    if (!snapshot.exists || !section.safeParse(version?.section).success) return NextResponse.json({ success: false, error: "Versión no encontrada." }, { status: 404 });
    const catalog = await getProductsFromFirestore(true);
    if (catalog === null) return NextResponse.json({ success: false, error: "No se pudo verificar el catálogo. La versión no se aplicó." }, { status: 503 });
    const payload = pruneArchivedLinks(version!.payload, new Set(catalog.map(p => p.sku.toLowerCase())), new Set(catalog.map(p => p.id))) as Record<string, unknown>;
    const key = version!.section as VisualSection;
    const handlers = { portada: saveHero, marca: saveBrand, carrusel: saveSlider, anuncios: saveAnnouncement, laterales: saveSides };
    const bodies = { portada: { settings: payload.settings }, marca: { branding: payload.branding }, carrusel: { slides: payload.slides }, anuncios: { announcement: payload.announcement }, laterales: { config: payload.sideBanners } };
    const headers = new Headers(request.headers); headers.delete("content-length");
    const response = await handlers[key](new NextRequest(request.url, { method: "POST", headers, body: JSON.stringify(bodies[key]) }));
    if (response.ok) revalidatePath("/");
    return response;
  } catch { return NextResponse.json({ success: false, error: "No se pudo completar la operación. Revisa el historial antes de reintentar." }, { status: 503 }); }
}
export const POST = withAdminHistory(postHandler);
