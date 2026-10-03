// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ headers: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/auth/clientIdentity", () => ({ identityHeaders: mocks.headers }));
import StockPage from "@/app/admin/predictive-stock/page";
const report = { executiveSummary: "Diagnóstico guardado", urgentRestock: [], stagnantLiquidationTactics: [], marketTrendSignals: [] };
it("sends proof only for generation and preserves the saved report on rejection", async () => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  mocks.headers.mockResolvedValue({ "X-Firebase-AppCheck": "proof" });
  mocks.fetch.mockResolvedValueOnce(Response.json({ success: true, data: { metrics: [], summary: null, latestAiReport: report } })).mockImplementation(async () => Response.json({ success: false, error: "No se pudo verificar la protección." }, { status: 403 }));
  vi.stubGlobal("fetch", mocks.fetch);
  const node = document.createElement("div"); document.body.append(node); const root = createRoot(node);
  try {
    await act(async () => root.render(<StockPage />)); expect(mocks.headers).not.toHaveBeenCalled();
    const button = Array.from(node.querySelectorAll("button")).find(button => button.textContent?.includes("Escanear Estrategia")); expect(button).toBeTruthy();
    await act(async () => button!.click());
    expect(mocks.headers).toHaveBeenCalledWith(true); expect(mocks.fetch.mock.calls[1][1]).toMatchObject({ method: "POST", headers: { "X-Firebase-AppCheck": "proof" } });
    expect(node.querySelector('[role="alert"]')?.textContent).toContain("No se pudo verificar"); expect(node.textContent).toContain("Diagnóstico guardado");
  } finally { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); }
});
