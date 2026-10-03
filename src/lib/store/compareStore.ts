import { create } from "zustand";
import { persist } from "zustand/middleware";
type CompareState = { ids: string[]; toggle: (id: string) => "added" | "removed" | "full"; remove: (id: string) => void; reconcile: (ids: Set<string>) => void; clear: () => void };
export const useCompareStore = create<CompareState>()(persist((set, get) => ({
  ids: [],
  toggle: id => { const ids = get().ids; if (ids.includes(id)) { set({ ids: ids.filter(value => value !== id) }); return "removed"; } if (ids.length >= 3) return "full"; set({ ids: [...ids, id] }); return "added"; },
  remove: id => set({ ids: get().ids.filter(value => value !== id) }),
  reconcile: valid => { const ids = get().ids.filter(id => valid.has(id)); if (ids.length !== get().ids.length) set({ ids }); },
  clear: () => set({ ids: [] }),
}), { name: "omni-compare", partialize: state => ({ ids: state.ids }), merge: (persisted, current) => ({ ...current, ids: Array.isArray((persisted as { ids?: unknown })?.ids) ? Array.from(new Set((persisted as { ids: unknown[] }).ids.filter((id): id is string => typeof id === "string" && id.length <= 128))).slice(0, 3) : [] }) }));
