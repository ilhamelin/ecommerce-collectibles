import { describe, it, expect } from "vitest";
import { extractGoogleDriveFileId, normalizeImageUrl } from "../src/lib/utils/media";

describe("Media Utils & Google Drive Normalization", () => {
  const sampleFileId = "1aBcDeFgHiJkLmNoPqRsTuVwXyZ_01234";

  describe("extractGoogleDriveFileId", () => {
    it("extracts ID from standard view sharing link", () => {
      const url = `https://drive.google.com/file/d/${sampleFileId}/view?usp=sharing`;
      expect(extractGoogleDriveFileId(url)).toBe(sampleFileId);
    });

    it("extracts ID from view link without query params", () => {
      const url = `https://drive.google.com/file/d/${sampleFileId}/view`;
      expect(extractGoogleDriveFileId(url)).toBe(sampleFileId);
    });

    it("extracts ID from open?id= URL", () => {
      const url = `https://drive.google.com/open?id=${sampleFileId}`;
      expect(extractGoogleDriveFileId(url)).toBe(sampleFileId);
    });

    it("extracts ID from uc?id= URL", () => {
      const url = `https://drive.google.com/uc?id=${sampleFileId}&export=download`;
      expect(extractGoogleDriveFileId(url)).toBe(sampleFileId);
    });

    it("extracts ID from docs.google.com link", () => {
      const url = `https://docs.google.com/file/d/${sampleFileId}/edit`;
      expect(extractGoogleDriveFileId(url)).toBe(sampleFileId);
    });

    it("extracts ID from lh3.googleusercontent.com link", () => {
      const url = `https://lh3.googleusercontent.com/d/${sampleFileId}`;
      expect(extractGoogleDriveFileId(url)).toBe(sampleFileId);
    });

    it("returns the raw string if already a long Google Drive alphanumeric ID", () => {
      expect(extractGoogleDriveFileId(sampleFileId)).toBe(sampleFileId);
    });

    it("returns null for non-Google Drive URLs", () => {
      expect(extractGoogleDriveFileId("https://images.unsplash.com/photo-1542751371-adc38448a05e")).toBeNull();
      expect(extractGoogleDriveFileId("")).toBeNull();
      expect(extractGoogleDriveFileId(undefined)).toBeNull();
    });
  });

  describe("normalizeImageUrl", () => {
    it("converts Google Drive sharing link to direct CDN format", () => {
      const input = `https://drive.google.com/file/d/${sampleFileId}/view?usp=sharing`;
      const expected = `https://lh3.googleusercontent.com/d/${sampleFileId}`;
      expect(normalizeImageUrl(input)).toBe(expected);
    });

    it("converts open?id= link to direct CDN format", () => {
      const input = `https://drive.google.com/open?id=${sampleFileId}`;
      const expected = `https://lh3.googleusercontent.com/d/${sampleFileId}`;
      expect(normalizeImageUrl(input)).toBe(expected);
    });

    it("leaves standard direct image URLs untouched", () => {
      const standardUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e";
      expect(normalizeImageUrl(standardUrl)).toBe(standardUrl);
    });

    it("handles raw long Drive IDs by prepending CDN prefix", () => {
      const expected = `https://lh3.googleusercontent.com/d/${sampleFileId}`;
      expect(normalizeImageUrl(sampleFileId)).toBe(expected);
    });
  });
});
