import { describe, it, expect } from "vitest";
import {
  generateDigitalPassport,
  verifyPassportHash,
  computeSha256,
} from "../src/lib/utils/passport";
import type { ProductDomainEntity } from "../src/lib/types/domain";

describe("Digital Authenticity Passport & Traceability (Anti-Bootleg)", () => {
  it("generates a deterministic SHA-256 verification hash and unique passport ID", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "VG-FORZAH6-PS5",
      name: "Forza Horizon 6 [Juego PS5]",
      type: "VIDEO_GAME",
      gameMetadata: {
        platform: "PS5",
        gameType: "CONSOLE",
        isDigital: false,
        developer: "Playground Games",
        publisher: "Xbox Game Studios",
      },
    };

    const passport = generateDigitalPassport(product);

    expect(passport.passportId).toContain("OMNI-PASS-VG-FORZAH6-PS5");
    expect(passport.verificationHash).toMatch(/^[a-f0-9]{64}$/);
    expect(passport.antiBootlegScore).toBe(100);
    expect(passport.tamperProofQrUrl).toBe(`/verify/${encodeURIComponent(passport.passportId)}`);
  });

  it("verifies hash integrity successfully for authentic SKU", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "FIG-MAKIMA-17",
      name: "Chainsaw Man Makima 1/7",
      type: "FIGURE",
      figureMetadata: {
        scale: "SCALE_1_7",
        manufacturer: "KOTOBUKIYA",
      },
    };

    const passport = generateDigitalPassport(product);

    const isAuthentic = verifyPassportHash(passport, "FIG-MAKIMA-17");
    expect(isAuthentic).toBe(true);
  });

  it("fails verification when SKU or hash has been tampered with", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "TCG-CHARIZARD-PSA9",
      name: "Charizard Base Set PSA 9",
      type: "COLLECTIBLE",
    };

    const passport = generateDigitalPassport(product);

    // Tampered SKU
    expect(verifyPassportHash(passport, "TCG-FAKE-BOOTLEG")).toBe(false);

    // Tampered verification hash
    const fakePassport = { ...passport, verificationHash: computeSha256("counterfeit") };
    expect(verifyPassportHash(fakePassport, "TCG-CHARIZARD-PSA9")).toBe(false);
  });

  it("structures all 4 custody provenance milestones with verification proofs", () => {
    const product: Partial<ProductDomainEntity> = {
      sku: "CON-NSW-OLED",
      name: "Nintendo Switch OLED",
      type: "CONSOLE",
    };

    const passport = generateDigitalPassport(product);

    expect(passport.provenanceMilestones).toHaveLength(4);
    expect(passport.provenanceMilestones.map((m) => m.stepNumber)).toEqual([1, 2, 3, 4]);

    for (const milestone of passport.provenanceMilestones) {
      expect(milestone.status).toBe("VERIFIED");
      expect(milestone.verificationProofHash).toMatch(/^[a-f0-9]{64}$/);
      expect(milestone.actor).toBeDefined();
      expect(milestone.location).toBeDefined();
    }
  });
});
