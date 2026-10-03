import { AsyncLocalStorage } from "node:async_hooks";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import type { DocumentData } from "firebase-admin/firestore";
const actors = new AsyncLocalStorage<string>();
export const visualDocuments = {
  portada: ["branding_settings", "home_hero"], marca: ["branding_settings", "main_brand"],
  carrusel: ["slider_settings", "home_slider"], anuncios: ["announcement_settings", "main_bar"],
  laterales: ["side_banners_settings", "main_skins"],
} as const;
export type VisualSection = keyof typeof visualDocuments;
/** Context survives streamed work without mixing concurrent administrators. */
export function withAdminHistory(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const identity = await verifyAdminAuthorization(request);
    if (!identity.authorized) return NextResponse.json({ success: false, error: "Sesión administrativa requerida.", code: "FORBIDDEN" }, { status: 403 });
    return identity.actor ? actors.run(identity.actor, () => handler(request)) : handler(request);
  };
}
/** Mutation, before/after audit and automatic visual revision commit atomically. */
export async function writeAdminDocument(collection: string, id: string, data: DocumentData | null, merge = true) {
  if (!adminDb) throw new Error("Persistencia administrativa no disponible.");
  const ref = adminDb.collection(collection).doc(id);
  const actor = actors.getStore();
  if (!actor) { if (data === null) await ref.delete(); else await ref.set(data, { merge }); return; }
  const audit = adminDb.collection("admin_audit").doc();
  const section = (Object.keys(visualDocuments) as VisualSection[]).find(key => visualDocuments[key][0] === collection && visualDocuments[key][1] === id);
  const version = section ? adminDb.collection("visual_versions").doc() : null;
  const at = new Date().toISOString();
  const baseline = section ? adminDb.collection("visual_versions").doc(section + "-original") : null;
  await adminDb.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const original = baseline ? await transaction.get(baseline) : null;
    const before = snapshot.data() ?? null;
    const after = data === null ? null : (merge ? { ...before, ...data } : data);
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    if (data === null) transaction.delete(ref); else transaction.set(ref, after!);
    transaction.set(audit, { actor, at, collection, documentId: id, action: data === null ? "DELETE" : snapshot.exists ? "UPDATE" : "CREATE", before, after });
    if (baseline && section && before && !original?.exists) transaction.set(baseline, { section, actor, at: new Date(Date.parse(at) - 1).toISOString(), name: "Diseño previo al historial", payload: before });
    if (version && section) transaction.set(version, { section, actor, at, name: "Guardado automático", payload: after });
  });
}
