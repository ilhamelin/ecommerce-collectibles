import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
vi.mock("@/lib/firebase/admin", async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) return { adminDb: null, adminApp: null };
  const app = getApps().find(app => app.name === "persistent-tests") || initializeApp({ projectId: "demo-omnicollector-persistence" }, "persistent-tests");
  return { adminDb: getFirestore(app), adminApp: app };
});
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: async () => ({ authorized: true, actor: "verified@example.com" }) }));
import { adminDb } from "@/lib/firebase/admin";
import { withAdminHistory, writeAdminDocument } from "@/lib/services/adminHistory";
import { reserveAiUsage, readAiProtectionStatus } from "@/lib/services/aiProtection";
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
describe.skipIf(!enabled)("Persistent security · real Firestore transactions", () => {
  beforeEach(async () => {
    await fetch("http://" + process.env.FIRESTORE_EMULATOR_HOST + "/emulator/v1/projects/demo-omnicollector-persistence/databases/(default)/documents", { method: "DELETE" });
    vi.stubEnv("AI_GLOBAL_DAILY_REQUESTS", "10"); vi.stubEnv("AI_USER_DAILY_REQUESTS", "5"); vi.stubEnv("AI_GUEST_DAILY_REQUESTS", "2"); vi.stubEnv("AI_GLOBAL_DAILY_TOKENS", "2000000");
  }, 60000);
  it("commits product change and a truthful before/after audit together", async () => {
    await adminDb!.collection("products").doc("piece").set({ name: "Piece", price: 100 });
    await withAdminHistory(async () => { await writeAdminDocument("products", "piece", { price: 200 }); return new Response(); })(new NextRequest("http://localhost/api/products"));
    const changed = await adminDb!.collection("products").doc("piece").get(); const audit = await adminDb!.collection("admin_audit").get();
    expect(changed.data()?.price).toBe(200); expect(audit.size).toBe(1);
    expect(audit.docs[0].data()).toMatchObject({ actor: "verified@example.com", action: "UPDATE", before: { price: 100 }, after: { price: 200 } });
  }, 60000);
  it("preserves the prior product if the atomic audit write is invalid", async () => {
    await adminDb!.collection("products").doc("piece").set({ price: 100 });
    await expect(withAdminHistory(async () => { await writeAdminDocument("products", "piece", { price: 200, invalid: undefined }); return new Response(); })(new NextRequest("http://localhost"))).rejects.toThrow();
    expect((await adminDb!.collection("products").doc("piece").get()).data()?.price).toBe(100);
    expect((await adminDb!.collection("admin_audit").get()).size).toBe(0);
  }, 60000);
  it("automatically creates a persisted visual version on each effective save", async () => {
    const handler = withAdminHistory(async () => { await writeAdminDocument("branding_settings", "home_hero", { settings: { heading: "New heading" } }); return new Response(); });
    await handler(new NextRequest("http://localhost")); await handler(new NextRequest("http://localhost"));
    const versions = await adminDb!.collection("visual_versions").get();
    expect(versions.size).toBe(1); expect(versions.docs[0].data()).toMatchObject({ section: "portada", actor: "verified@example.com", payload: { settings: { heading: "New heading" } } });
  }, 60000);
  it("preserves the pre-existing visual design before the first audited edit", async () => {
    await adminDb!.collection("branding_settings").doc("home_hero").set({ settings: { heading: "Original" } });
    await withAdminHistory(async () => { await writeAdminDocument("branding_settings", "home_hero", { settings: { heading: "Updated" } }); return new Response(); })(new NextRequest("http://localhost"));
    const baseline = await adminDb!.collection("visual_versions").doc("portada-original").get();
    expect(baseline.data()?.payload.settings.heading).toBe("Original");
    expect((await adminDb!.collection("visual_versions").get()).size).toBe(2);
  }, 60000);
  it("global quota survives concurrent calls and never admits more than its limit", async () => {
    const results = await Promise.allSettled(Array.from({ length: 20 }, (_, index) => reserveAiUsage("caller-" + index, true, 48000, false)));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(10);
    const status = await readAiProtectionStatus(); expect(status.usage.requests).toBe(10); expect(status.usage.blocked).toBe(10); expect(status.durable).toBe(true);
  }, 60000);
  it("enforces per-visitor and estimated-token budgets independently", async () => {
    await reserveAiUsage("guest", false, 48000, true); await reserveAiUsage("guest", false, 48000, true);
    await expect(reserveAiUsage("guest", false, 48000, true)).rejects.toThrow("límite diario");
    vi.stubEnv("AI_GLOBAL_DAILY_TOKENS", "100000");
    await expect(reserveAiUsage("new-account", true, 48000, false)).rejects.toThrow("límite diario");
    expect((await readAiProtectionStatus()).usage.requests).toBe(2);
  }, 60000);
});
