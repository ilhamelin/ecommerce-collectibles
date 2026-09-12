/**
 * Utility functions for formatting Chilean Pesos (CLP)
 * In Chile, currency amounts are whole integers with thousands separators (e.g., $ 79.990 CLP).
 */
export function formatCLP(amount: number, includeSuffix: boolean = true): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("es-CL");
  return includeSuffix ? `$ ${formatted} CLP` : `$ ${formatted}`;
}

export function formatCLPShort(amount: number): string {
  const rounded = Math.round(amount);
  return `$ ${rounded.toLocaleString("es-CL")}`;
}
