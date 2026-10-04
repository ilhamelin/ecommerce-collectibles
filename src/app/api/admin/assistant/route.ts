import { z } from "zod";
import { randomUUID } from "node:crypto";
import { adminTool, json, digest, ToolError } from "@/lib/admin-tools/shared";
import {
  assistantPlan,
  filterAssistantProducts,
} from "@/lib/admin-tools/assistant";
import {
  getProductsFromFirestore,
  invalidateProductsCache,
} from "@/lib/firebase/firestore";
import {
  withAiProtection,
  protectedAiFetch,
} from "@/lib/services/aiProtection";
import {
  getGeminiApiKey,
  getSupportedGeminiModels,
} from "@/lib/services/geminiClient";
import { recordApiUsage } from "@/lib/services/apiTelemetryService";
export const dynamic = "force-dynamic";
const queryInput = z
  .object({
    prompt: z.string().trim().min(5).max(1500),
    prepareDescriptions: z.boolean(),
  })
  .strict();
const resultSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(z.object({ text: z.string().optional() })),
      }),
    }),
  ),
  usageMetadata: z
    .object({
      promptTokenCount: z.number().optional(),
      candidatesTokenCount: z.number().optional(),
    })
    .optional(),
});
const query = withAiProtection(
  "ADMIN_ASSISTANT",
  adminTool(async (request, db, actor) => {
    const parsed = queryInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      throw new ToolError("Escribe una consulta de 5 a 1500 caracteres.");
    const apiKey = getGeminiApiKey();
    if (!apiKey)
      throw new ToolError("Configura Gemini para usar el asistente.", 503);
    const catalog = await getProductsFromFirestore(true);
    if (!catalog) throw new ToolError("Catálogo no disponible.", 503);
    if (catalog.length > 1000)
      throw new ToolError(
        "El asistente admite hasta 1000 productos en esta versión.",
        409,
      );
    const started = Date.now();
    let plan: z.infer<typeof assistantPlan> | undefined;
    for (const model of (await getSupportedGeminiModels(apiKey)).slice(0, 3)) {
      // Only the administrator's query is sent. Catalog/customer data never leaves the server.
      const response = await protectedAiFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "Interpreta una consulta de inventario en JSON estricto {filter,query,introduction}. filter: ALL,NO_IMAGE,NO_DESCRIPTION,NO_STOCK,NO_MANUFACTURER. query es una subcadena literal del nombre/SKU/tipo, o vacía. introduction es un texto editorial genérico en español opcional, sin especificaciones, autenticidad, precios o stock; no conoces los productos. No ejecutes operaciones ni afirmes resultados. No hay acceso al catálogo. Responde únicamente JSON.",
                },
              ],
            },
            contents: [{ role: "user", parts: [{ text: parsed.data.prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 2048,
              temperature: 0.2,
            },
          }),
        },
      );
      if (!response.ok) {
        await recordApiUsage({
          provider: "GEMINI",
          feature: "OTHER",
          endpoint: "/api/admin/assistant",
          model,
          latencyMs: Date.now() - started,
          statusCode: response.status,
          success: false,
        });
        continue;
      }
      const raw = resultSchema.safeParse(await response.json());
      if (!raw.success) continue;
      await recordApiUsage({
        provider: "GEMINI",
        feature: "OTHER",
        endpoint: "/api/admin/assistant",
        model,
        promptTokens: raw.data.usageMetadata?.promptTokenCount,
        candidatesTokens: raw.data.usageMetadata?.candidatesTokenCount,
        latencyMs: Date.now() - started,
        statusCode: 200,
      });
      try {
        const decoded = assistantPlan.safeParse(
          JSON.parse(
            raw.data.candidates[0]?.content.parts
              .map((part) => part.text || "")
              .join("") || "",
          ),
        );
        if (decoded.success) {
          plan = decoded.data;
          break;
        }
      } catch {
        /* Bounded retries through the shared protection layer. */
      }
    }
    if (!plan)
      throw new ToolError(
        "El modelo no devolvió una consulta válida. Reintenta.",
        503,
      );
    const products = filterAssistantProducts(catalog, plan);
    const jobId = randomUUID();
    const selected = parsed.data.prepareDescriptions
      ? products.slice(0, 5)
      : [];
    const snapshots = await Promise.all(
      selected.map((product) =>
        db.collection("products").doc(product.id).get(),
      ),
    );
    const proposals = selected.map((product, index) => ({
      id: product.id,
      description: [product.name, plan!.introduction]
        .filter(Boolean)
        .join(". "),
      before: snapshots[index].data()?.description || "",
      beforeHash: digest(snapshots[index].data() || null),
    }));
    await db
      .collection("assistant_plans")
      .doc(jobId)
      .set({
        actor,
        proposals,
        expiresAt: Date.now() + 3600000,
        applied: false,
      });
    return json({
      success: true,
      data: {
        filter: plan.filter,
        query: plan.query,
        proposals,
        jobId,
        products,
        totalCatalog: catalog.length,
      },
    });
  }),
);
export const POST = adminTool(async (request) => query(request));
const apply = z
  .object({
    jobId: z.string().uuid(),
    ids: z.array(z.string().max(150)).min(1).max(5),
  })
  .strict();
export const PATCH = adminTool(async (request, db, actor) => {
  const parsed = apply.safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    new Set(parsed.data.ids).size !== parsed.data.ids.length
  )
    throw new ToolError("Selecciona propuestas válidas.");
  const ref = db.collection("assistant_plans").doc(parsed.data.jobId);
  await db.runTransaction(async (tx) => {
    const job = (await tx.get(ref)).data();
    if (!job || job.actor !== actor)
      throw new ToolError("Propuesta no encontrada.", 404);
    if (job.applied) return;
    if (job.expiresAt < Date.now())
      throw new ToolError("La propuesta expiró.", 409);
    const proposals = job.proposals as {
      id: string;
      description: string;
      beforeHash: string;
    }[];
    const chosen = parsed.data.ids.map((id) =>
      proposals.find((proposal) => proposal.id === id),
    );
    if (chosen.some((proposal) => !proposal))
      throw new ToolError("Producto no incluido en la propuesta.");
    const snapshots = await Promise.all(
      chosen.map((proposal) =>
        tx.get(db.collection("products").doc(proposal!.id)),
      ),
    );
    snapshots.forEach((snapshot, index) => {
      if (
        !snapshot.exists ||
        digest(snapshot.data()) !== chosen[index]!.beforeHash
      )
        throw new ToolError(
          "El producto cambió; vuelve a consultar antes de aplicar.",
          409,
        );
    });
    snapshots.forEach((snapshot, index) => {
      const proposal = chosen[index]!;
      const before = snapshot.data()!;
      const after = {
        ...before,
        description: proposal.description,
        updatedAt: new Date().toISOString(),
      };
      tx.set(snapshot.ref, after);
      tx.set(db.collection("admin_audit").doc(), {
        actor,
        at: new Date().toISOString(),
        collection: "products",
        documentId: proposal.id,
        action: "UPDATE",
        before,
        after,
        source: "ASSISTANT",
      });
    });
    tx.update(ref, { applied: true, appliedAt: new Date().toISOString() });
  });
  invalidateProductsCache();
  return json({ success: true });
});
