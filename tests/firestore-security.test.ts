import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where } from "firebase/firestore";
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
describe.skipIf(!enabled)("Firestore rules · emulator", () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => { env = await initializeTestEnvironment({ projectId: "demo-omnicollector-security", firestore: { rules: readFileSync("firestore.rules", "utf8") } }); });
  afterAll(async () => { await env.cleanup(); });
  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { email: "alice@example.com", role: "CUSTOMER", fullName: "Alice", createdAt: "2026-01-01", wishlist: [] });
      await setDoc(doc(ctx.firestore(), "users/legacy"), { email: "alice@example.com", role: "CUSTOMER" });
      await setDoc(doc(ctx.firestore(), "orders/order"), { customer: { email: "alice@example.com" }, status: "PENDING" });
      await setDoc(doc(ctx.firestore(), "products/item"), { name: "Example", price: 100 });
      await setDoc(doc(ctx.firestore(), "admin_audit/change"), { actor: "admin@example.com" });
    });
  });
  it("keeps public catalog, categories and published designs readable", async () => {
    const db = env.unauthenticatedContext().firestore();
    for (const path of ["products/item", "custom_categories/demo", "branding_settings/home_hero", "slider_settings/home_slider", "announcement_settings/main_bar", "side_banners_settings/main_skins"]) await assertSucceeds(getDoc(doc(db, path)));
    await assertSucceeds(getDocs(collection(db, "products")));
  });
  it("does not expose profiles, sessions, history, quotas or versions publicly", async () => {
    const db = env.unauthenticatedContext().firestore();
    for (const name of ["users", "orders", "active_sessions", "admin_audit", "ai_quotas", "visual_versions"]) {
      await assertFails(getDocs(collection(db, name))); await assertFails(getDoc(doc(db, name, "change")));
    }
  });
  it("allows only the account owner to read a private profile", async () => {
    const alice = env.authenticatedContext("alice", { email: "alice@example.com", email_verified: true }).firestore();
    const bob = env.authenticatedContext("bob", { email: "bob@example.com", email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(alice, "users/alice"))); await assertSucceeds(getDoc(doc(alice, "users/legacy")));
    await assertFails(getDoc(doc(bob, "users/alice")));
    await assertFails(getDocs(collection(bob, "users")));
    await assertSucceeds(getDocs(query(collection(alice, "users"), where("email", "==", "alice@example.com"))));
  });
  it("does not grant authority from an email containing admin or a forged profile role", async () => {
    for (const claims of [{ email: "admin-attacker@example.com", email_verified: true }, { role: "ADMIN", email: "bob@example.com", email_verified: true }]) {
      const db = env.authenticatedContext("bob", claims).firestore();
      await assertFails(setDoc(doc(db, "custom_categories/injected"), { name: "Injected" }));
      await assertFails(updateDoc(doc(db, "products/item"), { price: -1 }));
      await assertFails(getDoc(doc(db, "users/alice")));
    }
  });
  it("rejects self-promotion, owner hijacking, invalid data, field removal and state shortcuts", async () => {
    const db = env.authenticatedContext("alice", { email: "alice@example.com", email_verified: true }).firestore();
    for (const data of [{ role: "ADMIN" }, { email: "bob@example.com" }, { createdAt: 0 }, { fullName: 12 }, { extraData: "malicious" }, { fullName: "x".repeat(990000) }, { orders: [{ status: "DELIVERED" }] }]) await assertFails(updateDoc(doc(db, "users/alice"), data));
    await assertFails(setDoc(doc(db, "users/alice"), { role: "ADMIN" }));
    await assertFails(deleteDoc(doc(db, "users/alice")));
    await assertFails(updateDoc(doc(db, "orders/order"), { status: "DELIVERED" }));
  });
  it("prevents unauthenticated order creation and cross-account order reads", async () => {
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "orders/injected"), { orderNumber: "fake", customer: { email: "alice@example.com" } }));
    await assertSucceeds(getDoc(doc(env.authenticatedContext("alice", { email: "alice@example.com", email_verified: true }).firestore(), "orders/order")));
    await assertFails(getDoc(doc(env.authenticatedContext("bob", { email: "bob@example.com", email_verified: true }).firestore(), "orders/order")));
    await assertFails(getDoc(doc(env.authenticatedContext("bob", { email: "alice@example.com", email_verified: false }).firestore(), "orders/order")));
  });
  it("default-denies orphan subcollections and future collections", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(db, "users/missing/private/item")));
    await assertFails(setDoc(doc(db, "unknown/new"), { ownerId: "alice" }));
  });
});
