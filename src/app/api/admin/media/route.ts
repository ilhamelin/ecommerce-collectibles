import { randomUUID } from "node:crypto";
import { z } from "zod";
import { adminTool, json, ToolError } from "@/lib/admin-tools/shared";
import { imageMime, MEDIA_MAX_BYTES } from "@/lib/admin-tools/media";
export const dynamic = "force-dynamic";
export const GET = adminTool(async (_request, db) => {
  const assets = await db
    .collection("media_assets")
    .orderBy("position", "asc")
    .limit(100)
    .get();
  return json({
    success: true,
    data: assets.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
  });
});
export const POST = adminTool(async (request, db, actor) => {
  if (
    Number(request.headers.get("content-length") || 0) >
    MEDIA_MAX_BYTES + 10000
  )
    throw new ToolError("Optimiza la imagen antes de subirla.", 413);
  const form = await request.formData();
  const file = form.get("file");
  const name = z.string().trim().min(1).max(100).safeParse(form.get("name"));
  if (!(file instanceof File) || !name.success || file.size > MEDIA_MAX_BYTES)
    throw new ToolError("Usa una imagen de hasta 350 KB con un nombre.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = imageMime(bytes);
  if (!mime || mime !== file.type)
    throw new ToolError("Imagen inválida. Usa PNG, JPEG o WebP.");
  const id = randomUUID();
  const at = new Date().toISOString();
  const asset = {
    name: name.data,
    url: "/api/media/" + id,
    mime,
    bytes: bytes.length,
    position: Date.now(),
    tags: "",
    archived: false,
    createdAt: at,
  };
  await db.runTransaction(async (tx) => {
    const quota = db.collection("media_control").doc("quota");
    const count = Number((await tx.get(quota)).data()?.count || 0);
    if (count >= 100)
      throw new ToolError("La biblioteca admite hasta 100 imágenes.", 409);
    tx.set(db.collection("media_blobs").doc(id), {
      base64: Buffer.from(bytes).toString("base64"),
      mime,
    });
    tx.set(db.collection("media_assets").doc(id), asset);
    tx.set(quota, { count: count + 1 });
    tx.set(db.collection("admin_audit").doc(), {
      actor,
      at,
      collection: "media_assets",
      documentId: id,
      action: "CREATE",
      before: null,
      after: asset,
    });
  });
  return json({ success: true, data: { ...asset, id } });
});
const update = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    tags: z.string().trim().max(200),
    position: z.number().int().min(-1000000).max(Number.MAX_SAFE_INTEGER),
    archived: z.boolean(),
  })
  .strict();
export const PATCH = adminTool(async (request, db, actor) => {
  const parsed = update.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new ToolError("Revisa los datos de la imagen.");
  const { id, ...fields } = parsed.data;
  await db.runTransaction(async (tx) => {
    const ref = db.collection("media_assets").doc(id);
    const before = (await tx.get(ref)).data();
    if (!before) throw new ToolError("Imagen no encontrada.", 404);
    tx.update(ref, fields);
    tx.set(db.collection("admin_audit").doc(), {
      actor,
      at: new Date().toISOString(),
      collection: "media_assets",
      documentId: id,
      action: "UPDATE",
      before,
      after: { ...before, ...fields },
    });
  });
  return json({ success: true });
});
