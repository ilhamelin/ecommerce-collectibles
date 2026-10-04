import { z } from "zod";
import { randomUUID } from "node:crypto";
import { adminTool, json, digest, ToolError } from "@/lib/admin-tools/shared";
import { planImport, type ImportRow } from "@/lib/admin-tools/import";
import { invalidateProductsCache } from "@/lib/firebase/firestore";
const bodySchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("preview"),
      mode: z.enum(["CREATE", "UPDATE"]),
      matrix: z
        .array(z.array(z.string().max(2000)).length(8))
        .min(2)
        .max(101),
    })
    .strict(),
  z
    .object({
      action: z.literal("commit"),
      jobId: z.string().uuid(),
      rows: z.array(z.number().int().min(2).max(101)).min(1).max(25),
    })
    .strict(),
]);
export const dynamic = "force-dynamic";
export const POST = adminTool(async (request, db, actor) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    throw new ToolError("Revisa la plantilla o el lote seleccionado.");
  if (parsed.data.action === "preview") {
    const snap = await db.collection("products").limit(1001).get();
    if (snap.size > 1000)
      throw new ToolError(
        "Catálogo demasiado grande para este importador.",
        409,
      );
    const products = snap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      sku: String(doc.data().sku || ""),
      stockReserved: Number(doc.data().stockReserved || 0),
      isPreOrder: !!doc.data().isPreOrder,
      type: String(doc.data().type || ""),
    }));
    let rows: ImportRow[];
    try {
      rows = planImport(parsed.data.matrix, products, parsed.data.mode);
    } catch (error) {
      throw new ToolError(
        error instanceof Error ? error.message : "Archivo inválido.",
      );
    }
    const jobId = randomUUID();
    const planned = rows.map((row) => ({
      ...row,
      targetId: row.targetId || randomUUID(),
      beforeHash: row.targetId
        ? digest(snap.docs.find((doc) => doc.id === row.targetId)?.data())
        : digest(null),
    }));
    await db
      .collection("import_jobs")
      .doc(jobId)
      .set({
        actor,
        rows: planned,
        expiresAt: Date.now() + 3600000,
        committed: false,
      });
    return json({ success: true, data: { jobId, rows } });
  }
  const data = parsed.data;
  if (new Set(data.rows).size !== data.rows.length)
    throw new ToolError("Filas duplicadas en la selección.");
  const jobRef = db.collection("import_jobs").doc(data.jobId);
  const result = await db.runTransaction(async (tx) => {
    const job = (await tx.get(jobRef)).data();
    if (!job || job.actor !== actor)
      throw new ToolError("Vista previa no disponible.", 404);
    if (job.committed)
      return { alreadyCommitted: true, count: job.count as number };
    if (job.expiresAt < Date.now())
      throw new ToolError(
        "La vista previa expiró; vuelve a cargar el archivo.",
        409,
      );
    const rows = job.rows as (ImportRow & {
      targetId: string;
      beforeHash: string;
    })[];
    const chosen = data.rows.map((number) =>
      rows.find((row) => row.row === number),
    );
    if (chosen.some((row) => !row || row.errors.length || !row.product))
      throw new ToolError("Selecciona únicamente filas válidas.");
    const catalog = await tx.get(db.collection("products"));
    for (const row of chosen) {
      const r = row!;
      const raw =
        catalog.docs.find((doc) => doc.id === r.targetId)?.data() || null;
      if (digest(raw) !== r.beforeHash)
        throw new ToolError(
          "El catálogo cambió desde la vista previa. Revisa de nuevo; no se importó ningún producto.",
          409,
        );
      const duplicate = catalog.docs.find(
        (doc) =>
          String(doc.data().sku).toUpperCase() === r.product!.sku &&
          doc.id !== r.targetId,
      );
      if (duplicate)
        throw new ToolError(
          "El SKU ya existe. Revisa nuevamente la vista previa.",
          409,
        );
    }
    for (const row of chosen) {
      const r = row!;
      const { image, ...fields } = r.product!;
      const before =
        catalog.docs.find((doc) => doc.id === r.targetId)?.data() || null;
      const after = {
        ...(before || {
          id: r.targetId,
          stockReserved: 0,
          isPreOrder: false,
          createdAt: new Date().toISOString(),
        }),
        ...fields,
        calculatedAvailableStock:
          fields.stockAvailable - Number(before?.stockReserved || 0),
        ...(image ? { images: [image], imageUrl: image } : {}),
        updatedAt: new Date().toISOString(),
      };
      tx.set(db.collection("products").doc(r.targetId), after);
      tx.set(db.collection("admin_audit").doc(), {
        actor,
        at: new Date().toISOString(),
        collection: "products",
        documentId: r.targetId,
        action: before ? "UPDATE" : "CREATE",
        before,
        after,
        source: "IMPORT",
      });
    }
    tx.update(jobRef, {
      committed: true,
      count: chosen.length,
      committedAt: new Date().toISOString(),
    });
    return { alreadyCommitted: false, count: chosen.length };
  });
  invalidateProductsCache();
  return json({ success: true, data: result });
});
