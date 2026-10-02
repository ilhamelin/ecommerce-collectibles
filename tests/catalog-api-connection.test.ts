import { it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/catalog/route";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
const { readProducts } = vi.hoisted(() => ({ readProducts: vi.fn() }));
vi.mock("@/lib/firebase/firestore", () => ({ getProductsFromFirestore: readProducts }));
beforeEach(() => { MemoryTransactionalStore.getInstance().reset(); readProducts.mockReset(); });
it("loads the persisted catalog on a cold instance instead of serving only memory", async () => {
  const store = MemoryTransactionalStore.getInstance();
  const product = { ...store.products.get("prod-vg-01")!, id: "persisted-one" };
  store.products.clear(); readProducts.mockResolvedValue([product]);
  const response = await GET(); const body = await response.json();
  expect(body.data.products.map((item: { id: string }) => item.id)).toEqual(["persisted-one"]);
});
it("does not resurrect deleted products when Firestore returns an empty collection", async () => {
  readProducts.mockResolvedValue([]);
  expect((await (await GET()).json()).data.products).toEqual([]);
});
