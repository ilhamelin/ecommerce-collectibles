import { describe, expect, it } from "vitest";
import { normalizeFirebasePrivateKey } from "../src/lib/firebase/adminCredentials";
describe("Firebase Admin PEM normalization", () => {
  const pem = "-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----";
  it("preserves multiline PEM", () => { expect(normalizeFirebasePrivateKey(pem)).toBe(pem); });
  it("accepts escaped newlines and surrounding quotes", () => {
    expect(normalizeFirebasePrivateKey('  "' + pem.replace(/\n/g, "\\n") + '"  ')).toBe(pem);
  });
  it("normalizes Windows and escaped Windows line endings", () => {
    expect(normalizeFirebasePrivateKey(pem.replace(/\n/g, "\r\n"))).toBe(pem);
    expect(normalizeFirebasePrivateKey(pem.replace(/\n/g, "\\r\\n"))).toBe(pem);
  });
});
