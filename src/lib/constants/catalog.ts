import { ProductDomainEntity } from "../types/domain";

/**
 * Catálogo base en memoria.
 * Inicialmente vacío: todos los productos se cargan y administran
 * en tiempo real desde la base de datos oficial (Cloud Firestore).
 */
export const BASE_PRODUCTS: ProductDomainEntity[] = [];

export const PRICE_PRESETS = [
  { label: "< $50.000", min: "", max: "50000" },
  { label: "$50k - $150k", min: "50000", max: "150000" },
  { label: "$150k - $500k", min: "150000", max: "500000" },
  { label: "> $500.000", min: "500000", max: "" },
];
