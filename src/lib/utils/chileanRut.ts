/**
 * Utilidades para validación y formateo de RUT chileno (Algoritmo Módulo 11)
 * Estándar requerido para emisión de órdenes de transporte (Starken, Chilexpress, Blue Express).
 */

/**
 * Limpia un RUT eliminando puntos, guiones y espacios, convirtiendo a mayúsculas.
 */
export function cleanRut(rut: string): string {
  return String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

/**
 * Calcula el dígito verificador para un cuerpo de RUT dado.
 */
export function calculateDv(rutBody: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/**
 * Valida si un RUT chileno es válido según el algoritmo módulo 11.
 */
export function validateChileanRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Asegurar que el cuerpo contenga únicamente dígitos numéricos
  if (!/^\d+$/.test(body)) {
    return false;
  }

  const expectedDv = calculateDv(body);
  return dv === expectedDv;
}

/**
 * Formatea un RUT en el formato estándar chileno: XX.XXX.XXX-X
 */
export function formatChileanRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return "";
  if (cleaned.length === 1) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let formattedBody = "";
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = "." + formattedBody;
    }
    formattedBody = body.charAt(i) + formattedBody;
  }

  return `${formattedBody}-${dv}`;
}
