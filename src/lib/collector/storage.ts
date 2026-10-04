import { createHash } from "node:crypto";
import type { CollectorEntry } from "./schema";

export const collectorOwnerKey = (identity: { uid: string; email: string }) => createHash("sha256").update(identity.uid ? "uid:" + identity.uid : "email:" + identity.email).digest("hex");
export class CollectorError extends Error { constructor(message: string, public status: number) { super(message); } }
/** Pure mutation plan; the API executes this inside a Firestore transaction. */
export function updateCollectorEntries(entries: CollectorEntry[], operation: "ADD" | "UPDATE" | "DELETE", entry: CollectorEntry | { id: string }): CollectorEntry[] {
  const index = entries.findIndex(item => item.id === entry.id);
  if (operation !== "ADD" && index < 0) throw new CollectorError("La pieza no pertenece a tu lista.", 404);
  if (operation === "DELETE") return entries.filter(item => item.id !== entry.id);
  if (!("kind" in entry)) throw new CollectorError("Pieza incompleta.", 400);
  if (operation === "ADD" && index >= 0) throw new CollectorError("La pieza ya existe.", 409);
  const others = entries.filter(item => item.id !== entry.id);
  if (others.filter(item => item.kind === entry.kind).length >= 60) throw new CollectorError("Puedes guardar hasta 60 piezas por lista.", 409);
  return [...others, entry];
}
