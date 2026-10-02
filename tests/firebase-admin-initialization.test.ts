import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { deleteApp, getApps } from "firebase-admin/app";

beforeEach(async () => {
  for (const app of getApps()) await deleteApp(app);
  vi.resetModules();
  vi.stubEnv("FIREBASE_PROJECT_ID", "diagnostic-test");
  vi.stubEnv("FIREBASE_CLIENT_EMAIL", "server@diagnostic-test.iam.gserviceaccount.com");
});
afterEach(async () => {
  for (const app of getApps()) await deleteApp(app);
  vi.unstubAllEnvs(); vi.restoreAllMocks();
});
describe("Firebase Admin actual SDK initialization", () => {
  it("loads Auth and Firestore even when native require of ESM is disabled", () => {
    const result = spawnSync(process.execPath, ["--no-experimental-require-module", "-e", `
      const { initializeApp } = require("firebase-admin/app");
      const { getAuth } = require("firebase-admin/auth");
      const { getFirestore } = require("firebase-admin/firestore");
      const app = initializeApp({ projectId: "module-compatibility-test" });
      if (!getAuth(app) || !getFirestore(app)) process.exit(1);
      console.log("sdk-ready");
    `], { encoding: "utf8", timeout: 15000 });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("sdk-ready");
  });
  it("initializes Firestore and Auth with valid escaped PEM without any network requests", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
    vi.stubEnv("FIREBASE_PRIVATE_KEY", privateKey.replace(/\n/g, "\\n"));
    const admin = await import("@/lib/firebase/admin");
    expect(admin.adminDb).not.toBeNull(); expect(admin.adminAuth).not.toBeNull();
  });
  it("reports invalid PEM by safe SDK code and stage rather than blaming missing variables", async () => {
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "INVALID_SECRET_TEST_VALUE");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const admin = await import("@/lib/firebase/admin");
    expect(admin.adminDb).toBeNull();
    expect(admin.getFirebaseAdminUnavailableMessage()).toContain("credentials");
    expect(admin.getFirebaseAdminUnavailableMessage()).toContain("app/invalid-credential");
    expect(admin.getFirebaseAdminUnavailableMessage()).not.toContain("INVALID_SECRET_TEST_VALUE");
    expect(JSON.stringify(log.mock.calls)).not.toContain("INVALID_SECRET_TEST_VALUE");
  });
  it("identifies an absent variable separately", async () => {
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    const admin = await import("@/lib/firebase/admin");
    expect(admin.getFirebaseAdminUnavailableMessage()).toContain("no recibió FIREBASE_PRIVATE_KEY");
  });
});
