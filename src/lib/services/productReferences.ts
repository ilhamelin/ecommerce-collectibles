import type { ConfirmedOrderEntity, ProductDomainEntity } from "../types/domain";

/** Indexes only real catalog identities. A reused SKU cannot revive a deleted ID. */
export function createProductReferenceIndex(products: ProductDomainEntity[]) {
  const ids = new Set(products.map(product => product.id));
  const skus = new Set(products.map(product => product.sku.toLowerCase()));
  return {
    ids,
    has(reference: { productId?: string; productSku?: string; sku?: string }) {
      if (reference.productId) return ids.has(reference.productId);
      const sku = reference.productSku || reference.sku;
      return Boolean(sku && skus.has(sku.toLowerCase()));
    },
  };
}

/** Customer view only: retain financial snapshots in the canonical order ledger. */
export function pruneOrderProductReferences(orders: ConfirmedOrderEntity[], products: ProductDomainEntity[]) {
  const index = createProductReferenceIndex(products);
  return orders.flatMap(order => {
    const items = order.items.filter(item => index.has(item));
    if (!items.length) return [];
    return [items.length === order.items.length ? order : { ...order, items }];
  });
}
