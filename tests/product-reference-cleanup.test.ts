import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ProductDomainEntity } from "@/lib/types/domain";
const state = vi.hoisted(() => ({ users: new Map<string, Record<string, unknown>>(), alerts: new Map<string, Record<string, unknown>>() }));
function snapshots(collection: string) {
  const records = collection === "users" ? state.users : state.alerts;
  return [...records].map(([id, data]) => ({ exists: true, ref: { id, collection }, data: () => data }));
}
vi.mock("@/lib/firebase/admin", () => ({ adminDb: {
  collection: (collection: string) => ({
    get: async () => ({ docs: snapshots(collection).map(s => ({ ...s, ref: { ...s.ref,
      delete: async () => { state.alerts.delete(s.ref.id); } } })) }),
    doc: (id: string) => ({ get: async () => snapshots(collection).find(s => s.ref.id === id) }),
  }),
  runTransaction: async (operation: (tx: unknown) => Promise<void>) => operation({
    get: async (ref: { id: string; collection: string }) => snapshots(ref.collection).find(s => s.ref.id === ref.id),
    update: (ref: { id: string }, data: Record<string, unknown>) => { state.users.set(ref.id, { ...state.users.get(ref.id), ...data }); },
  }),
} }));
import { cleanupPersistedProductReferences } from "@/lib/firebase/productReferenceCleanup";
beforeEach(() => { state.users.clear(); state.alerts.clear(); });
describe("Cross-account cleanup", () => {
  it("cleans all accounts and orphan alerts while preserving live IDs and profile fields", async () => {
    state.users.set("one", { wishlist: ["live", "deleted"], orders: [], fullName: "One" });
    state.users.set("two", { wishlist: ["deleted"], orders: [], fullName: "Two" });
    state.alerts.set("old", { productId: "deleted" }); state.alerts.set("valid", { productId: "live" });
    await cleanupPersistedProductReferences([{ id: "live", sku: "LIVE" } as ProductDomainEntity]);
    expect(state.users.get("one")?.wishlist).toEqual(["live"]);
    expect(state.users.get("two")?.wishlist).toEqual([]);
    expect(state.users.get("one")?.fullName).toBe("One");
    expect([...state.alerts.keys()]).toEqual(["valid"]);
  });
});
