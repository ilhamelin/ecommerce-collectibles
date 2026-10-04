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
vi.mock("@/lib/auth/requestIdentity", () => ({ requestIdentity: async () => ({ uid: "collector", email: "collector@example.com", admin: false }) }));
import { POST as addCollector, PATCH as editCollector } from "@/app/api/users/collector/route";
import { collectorInput, parseCollectorEntries } from "@/lib/collector/schema";
import { collectorOwnerKey } from "@/lib/collector/storage";
import { confirmVerifiedPayment } from "@/lib/payments/paymentConfirmation";
import { POST as importProducts } from "@/app/api/admin/import/route";
import { GET as readLaboratory, POST as writeLaboratory } from "@/app/api/admin/laboratory/route";
import { importHeaders } from "@/lib/admin-tools/import";
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
  it("confirms concurrent duplicate payments once with atomic stock/receipt persistence", async () => {
    await adminDb!.doc("products/piece").set({ stockAvailable: 10 });
    await adminDb!.doc("orders/pay-one").set({ id: "pay-one", status: "PENDING", paymentMethod: "MERCADO_PAGO", paymentStatus: "PENDING", totalChargedNow: 100, remainingBalanceLater: 0, stockDeducted: false, checkoutGateway: { mode: "SANDBOX", gatewayName: "MERCADO_PAGO" }, items: [{ productId: "piece", quantity: 2 }] });
    const payment = { provider: "MERCADO_PAGO" as const, id: "123", reference: "pay-one", amount: 100, currency: "CLP", approved: true, live: false };
    const results = await Promise.all(Array.from({ length: 8 }, () => confirmVerifiedPayment(payment)));
    expect(results.filter(result => !result.idempotent)).toHaveLength(1);
    expect((await adminDb!.doc("products/piece").get()).data()?.stockAvailable).toBe(8);
    expect((await adminDb!.doc("orders/pay-one").get()).data()?.paymentStatus).toBe("PAID");
    expect((await adminDb!.collection("payment_confirmations").get()).size).toBe(1);
  }, 60000);
  it("preserves concurrent collector additions and moves a piece without duplication", async () => {
    const input = collectorInput.parse({ title: "Link Nendoroid", category: "FIGURE" });
    const replies = await Promise.all(Array.from({ length: 5 }, (_, index) => addCollector(new NextRequest("https://localhost/api/users/collector", { method: "POST", body: JSON.stringify({ kind: "WANTED", entry: { ...input, title: "Piece " + index } }), headers: { "Content-Type": "application/json" } }))));
    expect(replies.map(reply => reply.status)).toEqual([200, 200, 200, 200, 200]);
    const ref = adminDb!.collection("collector_profiles").doc(collectorOwnerKey({ uid: "collector", email: "collector@example.com" }));
    const saved = parseCollectorEntries((await ref.get()).data()?.entries); expect(saved).toHaveLength(5);
    const changed = await editCollector(new NextRequest("https://localhost/api/users/collector", { method: "PATCH", body: JSON.stringify({ kind: "COLLECTION", id: saved[0].id, entry: input }), headers: { "Content-Type": "application/json" } }));
    expect(changed.status).toBe(200);
    const moved = parseCollectorEntries((await ref.get()).data()?.entries); expect(moved).toHaveLength(5); expect(moved.filter(piece => piece.kind === "COLLECTION")).toHaveLength(1);
  }, 60000);
  it("rolls back all payment writes when stock is insufficient", async () => {
    await adminDb!.doc("products/piece").set({ stockAvailable: 1 });
    await adminDb!.doc("orders/pay-one").set({ id: "pay-one", status: "PENDING", paymentMethod: "MERCADO_PAGO", paymentStatus: "PENDING", totalChargedNow: 100, remainingBalanceLater: 0, stockDeducted: false, checkoutGateway: { mode: "SANDBOX", gatewayName: "MERCADO_PAGO" }, items: [{ productId: "piece", quantity: 2 }] });
    await expect(confirmVerifiedPayment({ provider: "MERCADO_PAGO", id: "123", reference: "pay-one", amount: 100, currency: "CLP", approved: true, live: false })).rejects.toThrow();
    expect((await adminDb!.doc("orders/pay-one").get()).data()?.paymentStatus).toBe("PENDING");
    expect((await adminDb!.collection("payment_confirmations").get()).size).toBe(0);
  }, 60000);

  it("allows only one concurrent import of the same SKU", async () => {
    const request = (body: unknown) => new NextRequest("http://localhost/api/admin/import", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
    const matrix = [importHeaders, ["FIG-001", "Figura de prueba", "FIGURE", "54990", "42000", "8", "Figura para comprobar el importador.", ""]];
    const previews = await Promise.all([0, 1].map(async () => (await (await importProducts(request({ action: "preview", mode: "CREATE", matrix }))).json()).data.jobId));
    const replies = await Promise.all(previews.map(jobId => importProducts(request({ action: "commit", jobId, rows: [2] }))));
    expect(replies.map(reply => reply.status).sort()).toEqual([200, 409]);
    expect((await adminDb!.collection("products").get()).size).toBe(1);
    expect((await adminDb!.collection("admin_audit").get()).size).toBe(1);
  }, 60000);
  it("rejects a stale import without overwriting the newer product", async () => {
    await adminDb!.doc("products/piece").set({ sku: "FIG-001", name: "Original", type: "FIGURE", price: 100, stockReserved: 0 });
    const request = (body: unknown) => new NextRequest("http://localhost/api/admin/import", { method: "POST", body: JSON.stringify(body) });
    const preview = await (await importProducts(request({ action: "preview", mode: "UPDATE", matrix: [importHeaders, ["FIG-001", "Figura actualizada", "FIGURE", "54990", "42000", "8", "Descripción de prueba válida.", ""]] }))).json();
    await adminDb!.doc("products/piece").update({ price: 200 });
    expect((await importProducts(request({ action: "commit", jobId: preview.data.jobId, rows: [2] }))).status).toBe(409);
    expect((await adminDb!.doc("products/piece").get()).data()?.price).toBe(200);
    expect((await adminDb!.collection("admin_audit").get()).size).toBe(0);
  }, 60000);
  it("publishes the laboratory draft with its audit and saved version atomically", async () => {
    const initial = await (await readLaboratory(new NextRequest("http://localhost/api/admin/laboratory"))).json();
    const request = (body: unknown) => new NextRequest("http://localhost/api/admin/laboratory", { method: "POST", body: JSON.stringify(body) });
    const saved = await (await writeLaboratory(request({ action: "save", name: "Prueba", settings: { ...initial.data.settings, heading: "Portada probada", featuredProductId: null }, baseHash: initial.data.baseHash }))).json();
    expect((await adminDb!.doc("branding_settings/home_hero").get()).exists).toBe(false);
    expect((await writeLaboratory(request({ action: "publish", id: saved.data.id }))).status).toBe(200);
    expect((await adminDb!.doc("branding_settings/home_hero").get()).data()?.settings.heading).toBe("Portada probada");
    expect((await adminDb!.collection("admin_audit").get()).size).toBe(1);
    expect((await adminDb!.collection("visual_versions").get()).size).toBe(1);
  }, 60000);

});
