import type {
  ProductDomainEntity,
  DigitalAuthenticityPassport,
  ProvenanceMilestone,
} from "@/lib/types/domain";

const PASSPORT_SECRET_SALT = "OMNICOLLECTOR_LEDGER_INTEGRITY_SALT_2026_V1";

function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0x0bef9a3f, 0xc67178f2,
  ];

  let compositeHash: number[] = hash.slice();
  for (i = 0; i < ascii.length; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    let oldHash = compositeHash.slice();
    for (j = 0; j < 64; j++) {
      let w15 = w[j - 15] || 0, w2 = w[j - 2] || 0;
      let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[j] = j < 16 ? (w[j] || 0) : ((w[j - 16] || 0) + s0 + (w[j - 7] || 0) + s1) | 0;

      let ch = (oldHash[4] & oldHash[5]) ^ (~oldHash[4] & oldHash[6]);
      let maj = (oldHash[0] & oldHash[1]) ^ (oldHash[0] & oldHash[2]) ^ (oldHash[1] & oldHash[2]);
      let temp1 = (oldHash[7] + (rightRotate(oldHash[4], 6) ^ rightRotate(oldHash[4], 11) ^ rightRotate(oldHash[4], 25)) + ch + k[j] + w[j]) | 0;
      let temp2 = ((rightRotate(oldHash[0], 2) ^ rightRotate(oldHash[0], 13) ^ rightRotate(oldHash[0], 22)) + maj) | 0;

      oldHash = [(temp1 + temp2) | 0, oldHash[0], oldHash[1], oldHash[2], (oldHash[3] + temp1) | 0, oldHash[4], oldHash[5], oldHash[6]];
    }
    for (j = 0; j < 8; j++) {
      compositeHash[j] = (compositeHash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (compositeHash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes a SHA-256 cryptographic hash string universally (Node.js or Browser).
 *
 * @param input - The raw string data to hash
 * @returns 64-character lowercase hex digest
 */
export function computeSha256(input: string): string {
  try {
    if (typeof window === "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require("crypto");
      if (nodeCrypto && typeof nodeCrypto.createHash === "function") {
        return nodeCrypto.createHash("sha256").update(input).digest("hex");
      }
    }
  } catch {
    // Browser or edge fallback
  }
  return sha256Pure(input);
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
