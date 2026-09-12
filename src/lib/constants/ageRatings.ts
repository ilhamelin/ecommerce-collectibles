export interface AgeRatingOption {
  value: string;
  label: string;
  system: "CHILE" | "ESRB" | "PEGI" | "CERO" | "USK" | "OTHER";
  badgeColor?: string;
}

export const WORLDWIDE_AGE_RATINGS: AgeRatingOption[] = [
  // Chile - Ley 19.846
  { value: "TE", label: "TE - Todo Espectador (Chile)", system: "CHILE" },
  { value: "8+", label: "8+ - Mayores de 8 años (Chile)", system: "CHILE" },
  { value: "14+", label: "14+ - Mayores de 14 años (Chile)", system: "CHILE" },
  { value: "18+", label: "18+ - Mayores de 18 años (Chile)", system: "CHILE" },

  // ESRB (América)
  { value: "ESRB E", label: "ESRB: E (Everyone - Todas las edades)", system: "ESRB" },
  { value: "ESRB E10+", label: "ESRB: E10+ (Everyone 10+)", system: "ESRB" },
  { value: "ESRB T", label: "ESRB: T (Teen - Adolescentes 13+)", system: "ESRB" },
  { value: "ESRB M", label: "ESRB: M (Mature 17+ - Adultos jóvenes)", system: "ESRB" },
  { value: "ESRB AO", label: "ESRB: AO (Adults Only 18+)", system: "ESRB" },
  { value: "ESRB RP", label: "ESRB: RP (Rating Pending - Pendiente)", system: "ESRB" },

  // PEGI (Europa)
  { value: "PEGI 3", label: "PEGI 3 (Apto para mayores de 3 años)", system: "PEGI" },
  { value: "PEGI 7", label: "PEGI 7 (Mayores de 7 años)", system: "PEGI" },
  { value: "PEGI 12", label: "PEGI 12 (Mayores de 12 años)", system: "PEGI" },
  { value: "PEGI 16", label: "PEGI 16 (Mayores de 16 años)", system: "PEGI" },
  { value: "PEGI 18", label: "PEGI 18 (Solo adultos 18+)", system: "PEGI" },

  // CERO (Japón)
  { value: "CERO A", label: "CERO A (Todas las edades - Japón)", system: "CERO" },
  { value: "CERO B", label: "CERO B (Mayores de 12 años - Japón)", system: "CERO" },
  { value: "CERO C", label: "CERO C (Mayores de 15 años - Japón)", system: "CERO" },
  { value: "CERO D", label: "CERO D (Mayores de 17 años - Japón)", system: "CERO" },
  { value: "CERO Z", label: "CERO Z (Solo adultos 18+ - Japón)", system: "CERO" },

  // USK (Alemania)
  { value: "USK 0", label: "USK 0 (Sin restricciones de edad)", system: "USK" },
  { value: "USK 6", label: "USK 6 (Mayores de 6 años)", system: "USK" },
  { value: "USK 12", label: "USK 12 (Mayores de 12 años)", system: "USK" },
  { value: "USK 16", label: "USK 16 (Mayores de 16 años)", system: "USK" },
  { value: "USK 18", label: "USK 18 (No apto para menores de 18)", system: "USK" },

  // General / Coleccionismo
  { value: "EXEMPT", label: "Sin Sello / Coleccionable Exento", system: "OTHER" },
  { value: "CUSTOM", label: "Otro / Sello Personalizado", system: "OTHER" },
];
