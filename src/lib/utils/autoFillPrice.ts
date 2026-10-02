/** Aligns AI suggestions with the sale input's 100 CLP increment. */
export function normalizeAutoFillSalePrice(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value / 100) * 100) : 0;
}
