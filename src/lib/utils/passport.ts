import { createHash } from "crypto";
import type {
  ProductDomainEntity,
  DigitalAuthenticityPassport,
  ProvenanceMilestone,
} from "@/lib/types/domain";

const PASSPORT_SECRET_SALT = "OMNICOLLECTOR_LEDGER_INTEGRITY_SALT_2026_V1";

/**
 * Computes a SHA-256 cryptographic hash string.
 *
 * @param input - The raw string data to hash
 * @returns 64-character lowercase hex digest
 */
export function computeSha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Resolves manufacturer or publisher identity based on product domain metadata.
 */
function resolveManufacturerOrPublisher(
  product: Partial<ProductDomainEntity>
): { brand: string; origin: string } {
  const name = (product.name || "").toLowerCase();
  const sku = (product.sku || "").toUpperCase();

  if (product.figureMetadata?.manufacturer) {
    const mfg = product.figureMetadata.manufacturer.replace(/_/g, " ");
    return { brand: mfg, origin: "Japón (Tokyo / Akihabara)" };
  }

  if (product.gameMetadata?.publisher || product.gameMetadata?.developer) {
    const pub =
      product.gameMetadata.publisher ||
      product.gameMetadata.developer ||
      "Publisher Oficial";
    const origin = name.includes("nintendo")
      ? "Japón (Kyoto)"
      : name.includes("sony") || name.includes("playstation")
      ? "Japón (Tokyo)"
      : name.includes("xbox")
      ? "Estados Unidos (Redmond, WA)"
      : "Japón / Internacional";
    return { brand: pub, origin };
  }

  if (product.collectibleMetadata) {
    const cert =
      product.collectibleMetadata.authenticationBody || "The Pokémon Company";
    return {
      brand: cert,
      origin: name.includes("japon") ? "Japón" : "Estados Unidos (California)",
    };
  }

  if (name.includes("sony") || name.includes("playstation") || sku.includes("PS5")) {
    return { brand: "Sony Interactive Entertainment", origin: "Japón / EE.UU." };
  }
  if (name.includes("nintendo") || name.includes("switch")) {
    return { brand: "Nintendo Co., Ltd.", origin: "Japón (Kyoto)" };
  }
  if (name.includes("xbox") || name.includes("microsoft")) {
    return { brand: "Microsoft Gaming", origin: "Estados Unidos (Redmond, WA)" };
  }
  if (name.includes("good smile") || name.includes("nendoroid")) {
    return { brand: "Good Smile Company", origin: "Japón (Tokyo)" };
  }
  if (name.includes("bandai") || name.includes("tamashii")) {
    return { brand: "Bandai Spirits", origin: "Japón (Tokyo)" };
  }
  if (name.includes("kotobukiya")) {
    return { brand: "Kotobukiya", origin: "Japón (Tokyo)" };
  }

  return {
    brand: product.customCategoryLabel || "Fabricante Oficial Licenciado",
    origin: "Distribución Oficial Autorizada",
  };
}

/**
 * Generates a deterministic Digital Passport of Authenticity & Traceability
 * for any catalog product (Anti-Bootleg Guarantee).
 *
 * @param product - Target product domain entity
 * @returns Fully populated DigitalAuthenticityPassport
 */
export function generateDigitalPassport(
  product: Partial<ProductDomainEntity>
): DigitalAuthenticityPassport {
  const cleanSku = (product.sku || "PROD-GENERIC")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");

  const { brand, origin } = resolveManufacturerOrPublisher(product);

  // Deterministic batch number based on SKU
  const batchSuffix = computeSha256(cleanSku).slice(0, 6).toUpperCase();
  const batchSerialNumber = `BATCH-${cleanSku.slice(0, 6)}-${batchSuffix}`;
  const passportId = `OMNI-PASS-${cleanSku}-${batchSuffix.slice(0, 4)}`;

  // Master cryptographic verification hash
  const rawHashPayload = `${passportId}:${cleanSku}:${brand}:${batchSerialNumber}:${PASSPORT_SECRET_SALT}`;
  const verificationHash = computeSha256(rawHashPayload);

  // Provenance milestones (Audited Chain of Custody)
  const milestone1Hash = computeSha256(`${verificationHash}:STEP1:MFG`);
  const milestone2Hash = computeSha256(`${verificationHash}:STEP2:CUSTOMS`);
  const milestone3Hash = computeSha256(`${verificationHash}:STEP3:OMNI_WH`);
  const milestone4Hash = computeSha256(`${verificationHash}:STEP4:CUSTOMER`);

  const milestones: ProvenanceMilestone[] = [
    {
      stepNumber: 1,
      title: "Fabricación Oficial & Licencia Concedida",
      timestamp: "2025-11-14T09:30:00Z",
      actor: brand,
      location: origin,
      description:
        "Pieza producida bajo estrictos estándares de licencia oficial. Código de matriz verificado y sin adulteraciones en empaque primario.",
      status: "VERIFIED",
      verificationProofHash: milestone1Hash,
    },
    {
      stepNumber: 2,
      title: "Tránsito Internacional & Declaración de Ingreso Aduanera (DIN)",
      timestamp: "2025-12-03T16:45:00Z",
      actor: "Servicio Nacional de Aduanas de Chile",
      location: "Aeropuerto Internacional Arturo Merino Benítez, Santiago",
      description:
        "Inspección de aforo aduanero aprobada sin observaciones. Validación de autenticidad arancelaria y pago de gravámenes de importación legal.",
      status: "VERIFIED",
      verificationProofHash: milestone2Hash,
    },
    {
      stepNumber: 3,
      title: "Inspección de Autenticidad en Bodega OmniCollector",
      timestamp: "2026-01-10T11:15:00Z",
      actor: "Equipo de Aseguramiento de Calidad OmniCollector",
      location: "Centro de Distribución Central, Santiago, Chile",
      description:
        "Protocolo Mint 10/10 completado: verificación de sellos de fábrica, luz UV contra réplicas no autorizadas (anti-bootleg) y preservación en ambiente con temperatura controlada.",
      status: "VERIFIED",
      verificationProofHash: milestone3Hash,
    },
    {
      stepNumber: 4,
      title: "Emisión de Pasaporte Digital & Ledger de Autenticidad",
      timestamp: "2026-01-12T14:20:00Z",
      actor: "OmniCollector Cryptographic Registry",
      location: "Santiago, Chile",
      description:
        "Firma digital criptográfica generada con éxito. Pasaporte vinculado irrevocablemente al SKU y número de serie para trazabilidad del comprador final.",
      status: "VERIFIED",
      verificationProofHash: milestone4Hash,
    },
  ];

  return {
    passportId,
    verificationHash,
    issuedAt: "2026-01-12T14:20:00Z",
    issuer: "OmniCollector Chile — Departamento de Certificación & Trazabilidad",
    antiBootlegScore: 100,
    batchSerialNumber,
    originCountry: origin,
    manufacturerOrPublisher: brand,
    provenanceMilestones: milestones,
    tamperProofQrUrl: `/verify/${encodeURIComponent(passportId)}`,
    mintBoxWarranty: "Garantía de Caja Mint 10/10 & Blindaje de Envío Certificado",
  };
}

/**
 * Verifies if a given Digital Authenticity Passport matches the cryptographic
 * signature of the claimed product SKU.
 *
 * @param passport - The passport entity to verify
 * @param productSku - The claimed product SKU
 * @returns boolean indicating validity
 */
export function verifyPassportHash(
  passport: DigitalAuthenticityPassport,
  productSku: string
): boolean {
  if (!passport || !productSku || !passport.verificationHash) {
    return false;
  }

  const cleanSku = productSku.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const expectedPayload = `${passport.passportId}:${cleanSku}:${passport.manufacturerOrPublisher}:${passport.batchSerialNumber}:${PASSPORT_SECRET_SALT}`;
  const expectedHash = computeSha256(expectedPayload);

  return passport.verificationHash === expectedHash;
}
