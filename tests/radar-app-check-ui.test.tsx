// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ headers: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/auth/clientIdentity", () => ({ identityHeaders: mocks.headers }));
import RadarPage from "@/app/admin/radar/page";
const report = { marketOverview: "Informe anterior verificable", scannedAt: "2026-10-03T00:00:00.000Z", reissueAlerts: [], hotTrends: [], urgentRecommendations: [] };
describe("Radar client token and error handling", () => {
  let node: HTMLDivElement; let root: Root;
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks();
    mocks.headers.mockResolvedValue({ "X-Firebase-AppCheck": "app-proof", Authorization: "Bearer verified-user" }); vi.stubGlobal("fetch", mocks.fetch);
    node = document.createElement("div"); document.body.append(node); root = createRoot(node);
  });
  afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
  async function render() { await act(async () => root.render(<RadarPage/>)); }
  async function click(text: string) { const button = Array.from(node.querySelectorAll("button")).find(button => button.textContent?.includes(text)); expect(button).toBeTruthy(); await act(async () => button!.click()); }
  it("sends App Check on initial load and manual rescans", async () => {
    mocks.fetch.mockImplementation(async () => Response.json({ success: true, data: report, engine: "GEMINI_AI" }));
    await render(); await click("Escanear Tendencias con IA"); expect(mocks.headers).toHaveBeenNthCalledWith(1, true); expect(mocks.headers).toHaveBeenNthCalledWith(2, true);
    expect(mocks.fetch.mock.calls[0][1]).toMatchObject({ headers: { "X-Firebase-AppCheck": "app-proof" }, cache: "no-store" });
    expect(node.textContent).toContain(report.marketOverview);
  });
  it("shows missing proof errors with a working retry instead of an empty successful report", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ success: false, error: "No se pudo verificar la protección." }, { status: 403 })).mockImplementation(async () => Response.json({ success: true, data: report, engine: "GEMINI_AI" }));
    await render(); expect(node.querySelector('[role="alert"]')?.textContent).toContain("No se pudo verificar");
    expect(node.textContent).not.toContain("Alertas de Reedición"); await click("Reintentar"); expect(node.textContent).toContain(report.marketOverview); expect(node.querySelector('[role="alert"]')).toBeNull();
  });
  it("keeps the previous report identifiable if quota blocks a rescan", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ success: true, data: report, engine: "GEMINI_AI" })).mockImplementation(async () => Response.json({ success: false, error: "Límite diario alcanzado." }, { status: 429 }));
    await render(); await click("Escanear Tendencias con IA");
    expect(node.querySelector('[role="alert"]')?.textContent).toContain("Límite diario alcanzado."); expect(node.querySelector('[role="alert"]')?.textContent).toContain("informe anterior");
    expect(node.textContent).toContain(report.marketOverview);
  });
});
