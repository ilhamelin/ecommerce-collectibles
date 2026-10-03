import { describe, expect, it, vi, beforeEach } from "vitest";
const mock = vi.hoisted(() => ({ read: vi.fn(), protection: vi.fn(), telemetry: vi.fn(), auth: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: { collection: () => ({ limit: () => ({ get: mock.read }) }) } }));
vi.mock("@/lib/services/apiTelemetryService", () => ({ getTelemetrySummary: mock.telemetry }));
vi.mock("@/lib/services/aiProtection", () => ({ readAiProtectionStatus: mock.protection }));
vi.mock("@/lib/auth/adminAuthorization", () => ({ verifyAdminAuthorization: mock.auth }));
import { configuredServices, getSystemHealth } from "@/lib/services/systemHealth";
beforeEach(() => { vi.clearAllMocks(); mock.read.mockResolvedValue({}); mock.protection.mockResolvedValue({ durable: true }); mock.telemetry.mockResolvedValue({ recentLogs: [] }); });
describe("System health", () => {
 it("reports configuration without revealing values or claiming provider connectivity", () => {
  const text = JSON.stringify(configuredServices({ GEMINI_API_KEY: "secret-test-value", MERCADOPAGO_ACCESS_TOKEN: "TEST-private", MERCADOPAGO_SANDBOX_MODE: "false" }));
  expect(text).not.toContain("secret-test-value"); expect(text).not.toContain("TEST-private"); expect(text).toContain("Sandbox"); expect(text).toContain("No se ha probado");
 });
 it("confirms only a successful Firestore read", async () => {
  const result = await getSystemHealth(); expect(result.services[0].status).toBe("ok"); expect(result.services[0].latencyMs).toBeGreaterThanOrEqual(0);
 });
 it("returns partial failures honestly", async () => {
  mock.read.mockRejectedValue(new Error("private failure")); mock.protection.mockRejectedValue(new Error("failed")); mock.telemetry.mockRejectedValue(new Error("failed"));
  const result = await getSystemHealth(); expect(result.services[0].status).toBe("error"); expect(result.services[0].latencyMs).toBeUndefined(); expect(result.protection).toBeNull(); expect(result.telemetryAvailable).toBe(false); expect(JSON.stringify(result)).not.toContain("private failure");
 });
 it("excludes simulation and secret-bearing error messages from incidents", async () => {
  mock.telemetry.mockResolvedValue({ recentLogs: [{ id: "1", provider: "GEMINI", feature: "AUTO_FILL", success: false, errorMessage: "secret", timestamp: "2026-10-03", statusCode: 500 }, { id: "2", feature: "TEST_SIMULATION", success: false }] });
  const result = await getSystemHealth(); expect(result.incidents).toHaveLength(1); expect(JSON.stringify(result.incidents)).not.toContain("secret");
 });
 it("stops waiting for a hanging read after four seconds", async () => {
  vi.useFakeTimers(); try { mock.read.mockReturnValue(new Promise(() => {})); const pending = getSystemHealth(); await vi.advanceTimersByTimeAsync(4001); expect((await pending).services[0].status).toBe("error"); } finally { vi.useRealTimers(); }
 });
});
