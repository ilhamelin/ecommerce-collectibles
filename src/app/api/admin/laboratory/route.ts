import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_HOME_HERO,
  HomeHeroSettingsSchema,
  canFeatureHomeProduct,
} from "@/lib/constants/homeHeroDefaults";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { adminTool, json, digest, ToolError } from "@/lib/admin-tools/shared";
export const dynamic = "force-dynamic";
const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("save"),
      name: z.string().trim().min(1).max(80),
      settings: HomeHeroSettingsSchema,
      baseHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z.object({ action: z.literal("publish"), id: z.string().uuid() }).strict(),
]);
export const GET = adminTool(async (_request, db) => {
  const [live, drafts] = await Promise.all([
    db.collection("branding_settings").doc("home_hero").get(),
    db.collection("visual_drafts").orderBy("at", "desc").limit(20).get(),
  ]);
  return json({
    success: true,
    data: {
      settings: HomeHeroSettingsSchema.parse(
        live.data()?.settings || DEFAULT_HOME_HERO,
      ),
      baseHash: digest(live.data() || null),
      drafts: drafts.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
    },
  });
});
export const POST = adminTool(async (request, db, actor) => {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    throw new ToolError("Revisa los textos, colores y enlaces del borrador.");
  const now = new Date().toISOString();
  const data = parsed.data;
  if (data.action === "save") {
    const id = randomUUID();
    await db
      .collection("visual_drafts")
      .doc(id)
      .set({ ...data, actor, at: now, published: false });
    return json({ success: true, data: { id } });
  }
  const draftRef = db.collection("visual_drafts").doc(data.id);
  const draft = (await draftRef.get()).data();
  if (!draft) throw new ToolError("Borrador no encontrado.", 404);
  const settings = HomeHeroSettingsSchema.parse(draft.settings);
  if (settings.featuredProductId) {
    const products = await getProductsFromFirestore(true);
    if (!products)
      throw new ToolError("No se pudo comprobar el producto destacado.", 503);
    if (
      !products.some(
        (product) =>
          product.id === settings.featuredProductId &&
          canFeatureHomeProduct(product),
      )
    )
      throw new ToolError("El producto destacado ya no está disponible.", 409);
  }
  await db.runTransaction(async (tx) => {
    const liveRef = db.collection("branding_settings").doc("home_hero");
    const baselineRef = db
      .collection("visual_versions")
      .doc("portada-original");
    const [current, confirmed, baseline] = await Promise.all([
      tx.get(liveRef),
      tx.get(draftRef),
      tx.get(baselineRef),
    ]);
    const value = confirmed.data();
    if (!value) throw new ToolError("Borrador no encontrado.", 404);
    if (value.published) return;
    if (digest(current.data() || null) !== value.baseHash)
      throw new ToolError(
        "La portada publicada cambió. Actualiza y guarda un nuevo borrador antes de publicar.",
        409,
      );
    const before = current.data() || null;
    const after = {
      ...(before || {}),
      settings: HomeHeroSettingsSchema.parse(value.settings),
      updatedAt: now,
    };
    tx.set(liveRef, after);
    tx.update(draftRef, {
      published: true,
      publishedAt: now,
      publishedBy: actor,
    });
    tx.set(db.collection("admin_audit").doc(), {
      actor,
      at: now,
      collection: "branding_settings",
      documentId: "home_hero",
      action: before ? "UPDATE" : "CREATE",
      before,
      after,
      source: "LABORATORY",
    });
    if (before && !baseline.exists)
      tx.set(baselineRef, {
        section: "portada",
        actor,
        at: now,
        name: "Diseño anterior al laboratorio",
        payload: before,
      });
    tx.set(db.collection("visual_versions").doc(), {
      section: "portada",
      actor,
      at: now,
      name: "Laboratorio: " + value.name,
      payload: after,
    });
  });
  try {
    revalidatePath("/");
  } catch {
    /* ISR refreshes normally if cache invalidation is unavailable. */
  }
  return json({ success: true });
});
