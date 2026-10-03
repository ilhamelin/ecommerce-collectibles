import { withAdminHistory } from "@/lib/services/adminHistory";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { readHomeHeroSettings, saveHomeHeroSettings } from "@/lib/firebase/homeHeroSettings";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { HomeHeroSettingsSchema, HomeHeroProductSchema, canFeatureHomeProduct } from "@/lib/constants/homeHeroDefaults";
import { z } from "zod";

export const dynamic = "force-dynamic";
const PayloadSchema = z.object({ settings: HomeHeroSettingsSchema }).strict();
const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdminAuthorization(request)).authorized) {
      return NextResponse.json({ success: false, error: "Se requiere una sesión administrativa válida." }, { status: 403 });
    }
    const [configuration, catalog] = await Promise.all([readHomeHeroSettings(), getProductsFromFirestore(true)]);
    if (configuration.canPersist && catalog === null) {
      return NextResponse.json({ success: false, error: "El catálogo no está disponible en la base de datos. Intenta nuevamente." }, { status: 503, headers: noStore });
    }
    const products = (catalog ?? CatalogRepository.getInstance().getAll()).map(product => HomeHeroProductSchema.parse(product));
    return NextResponse.json({ success: true, data: { ...configuration, products } }, { headers: noStore });
  } catch (error: unknown) {
    console.error("[Home Hero] Read failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ success: false, error: "No se pudo cargar la portada guardada. Intenta nuevamente." }, { status: 503, headers: noStore });
  }
}

async function postHandler(request: NextRequest) {
  try {
    if (!(await verifyAdminAuthorization(request)).authorized) {
      return NextResponse.json({ success: false, error: "Se requiere una sesión administrativa válida." }, { status: 403 });
    }
    const raw: unknown = await request.json();
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Revisa los datos de la portada." }, { status: 400 });
    }
    const { settings } = parsed.data;
    if (settings.featuredProductId) {
      const products = await getProductsFromFirestore(true);
      if (products === null) return NextResponse.json({ success: false, error: "No se pudo comprobar el producto en la base de datos. Intenta nuevamente." }, { status: 503 });
      if (!products.some(product => product.id === settings.featuredProductId && canFeatureHomeProduct(product))) {
        return NextResponse.json({ success: false, error: "El producto destacado ya no está disponible o no tiene imagen. Elige otro o usa la selección automática." }, { status: 400 });
      }
    }
    await saveHomeHeroSettings(settings);
    // Invalidate the homepage ISR after the write, so the next visit uses the saved design.
    try { revalidatePath("/"); } catch { console.warn("[Home Hero] Homepage revalidation unavailable; normal ISR will refresh it."); }
    return NextResponse.json({ success: true, data: { settings } }, { headers: noStore });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return NextResponse.json({ success: false, error: "Los datos enviados no tienen un formato válido." }, { status: 400 });
    console.error("[Home Hero] Write failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ success: false, error: "No se guardaron los cambios. Comprueba la conexión de Firebase Admin en el servidor y vuelve a intentar." }, { status: 503 });
  }
}

export const POST = withAdminHistory(postHandler);
