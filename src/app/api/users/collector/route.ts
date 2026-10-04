import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestIdentity } from "@/lib/auth/requestIdentity";
import { adminDb } from "@/lib/firebase/admin";
import { getProductsFromFirestore } from "@/lib/firebase/firestore";
import { collectorInput, parseCollectorEntries, type CollectorEntry } from "@/lib/collector/schema";
import { matchWantedPieces } from "@/lib/collector/matches";
import { collectorOwnerKey, CollectorError, updateCollectorEntries } from "@/lib/collector/storage";

export const dynamic = "force-dynamic";
const addInput = z.object({ kind: z.enum(["COLLECTION", "WANTED"]), entry: collectorInput }).strict();
const editInput = addInput.extend({ id: z.string().uuid() });
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function handle(request: NextRequest, operation: "GET" | "ADD" | "UPDATE" | "DELETE") {
  try {
    const identity = await requestIdentity(request);
    if (!identity) return reply({ success: false, error: "Inicia sesión para guardar tus piezas." }, 401);
    if (!identity.uid && !identity.email) return reply({ success: false, error: "No se pudo verificar tu cuenta." }, 403);
    if (!adminDb) return reply({ success: false, error: "El guardado de tu colección no está disponible. Reintenta." }, 503);
    const database = adminDb;
    const ref = database.collection("collector_profiles").doc(collectorOwnerKey(identity));
    let entries: CollectorEntry[];
    if (operation === "GET") entries = parseCollectorEntries((await ref.get()).data()?.entries);
    else {
      const now = new Date().toISOString();
      const body = operation === "DELETE" ? null : await request.json().catch(() => null);
      const id = operation === "DELETE" ? z.string().uuid().safeParse(request.nextUrl.searchParams.get("id")) : null;
      const parsed = operation === "UPDATE" ? editInput.safeParse(body) : addInput.safeParse(body);
      if (operation === "DELETE" ? !id?.success : !parsed.success) return reply({ success: false, error: "Revisa el nombre, foto y campos de la pieza." }, 400);
      // Resolve linked products from the server catalog; never accept an arbitrary product snapshot.
      const input = parsed.success ? parsed.data : null;
      if (input?.entry.productId) {
        const products = await getProductsFromFirestore();
        if (products === null) throw new CollectorError("No se pudo comprobar el producto. Reintenta.", 503);
        if (!products.some(product => product.id === input.entry.productId)) throw new CollectorError("El producto ya no está en el catálogo. Registra la pieza sin vincularla.", 400);
      }
      entries = await database.runTransaction(async tx => {
        const prior = parseCollectorEntries((await tx.get(ref)).data()?.entries);
        const entryId = operation === "DELETE" && id?.success ? id.data : operation === "UPDATE" && input && "id" in input ? String(input.id) : randomUUID();
        const existing = prior.find(item => item.id === entryId);
        const entry = input ? { ...input.entry, kind: input.kind, id: entryId, createdAt: existing?.createdAt || now, updatedAt: now } : { id: entryId };
        const next = updateCollectorEntries(prior, operation, entry);
        tx.set(ref, { entries: next, updatedAt: now });
        return next;
      });
    }
    // A catalog outage must not undo a successful private save.
    const products = await getProductsFromFirestore().catch(() => null);
    return reply({ success: true, data: { entries, matches: matchWantedPieces(entries, products || []), catalogAvailable: products !== null } });
  } catch (error) {
    if (error instanceof CollectorError) return reply({ success: false, error: error.message }, error.status);
    console.error("[Collector] No se pudo procesar la lista privada.");
    return reply({ success: false, error: "No se pudo consultar o guardar tu colección. Reintenta." }, 503);
  }
}
export const GET = (request: NextRequest) => handle(request, "GET");
export const POST = (request: NextRequest) => handle(request, "ADD");
export const PATCH = (request: NextRequest) => handle(request, "UPDATE");
export const DELETE = (request: NextRequest) => handle(request, "DELETE");
