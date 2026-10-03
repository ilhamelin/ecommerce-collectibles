// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import VersionsPage from "@/app/admin/visual-versions/page";
import SecurityPage from "@/app/admin/security/page";
import { DEFAULT_HOME_HERO } from "@/lib/constants/homeHeroDefaults";
const version = { id: "version-1", section: "portada", name: "Campaña de prueba", actor: "admin@example.com", at: "2026-10-03T00:00:00.000Z", payload: { settings: { ...DEFAULT_HOME_HERO, heading: "Portada guardada" } } };
describe("Admin history and version screens", () => {
  let node: HTMLDivElement; let root: Root;
  const fetcher = vi.fn();
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    fetcher.mockReset(); vi.stubGlobal("fetch", fetcher);
    node = document.createElement("div"); document.body.append(node); root = createRoot(node);
  });
  afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
  async function render(page: React.ReactNode) { await act(async () => { root.render(page); }); }
  async function click(text: string) { const button = Array.from(node.querySelectorAll("button")).find(button => button.textContent?.includes(text)); expect(button).toBeTruthy(); await act(async () => button!.click()); }
  it("previews a saved hero and restores only after the explicit confirmation control", async () => {
    fetcher.mockImplementation(async (url: string, options?: RequestInit) => new Response(JSON.stringify(options?.method === "POST" ? { success: true } : url.includes("visual-versions") ? { success: true, data: [version] } : { success: true, data: { products: [] } })));
    await render(<VersionsPage/>); await click("Campaña de prueba");
    expect(node.textContent).toContain("Portada guardada");
    expect(fetcher.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(0);
    await act(async () => node.querySelector("summary")!.click()); await click("Confirmar recuperación");
    const mutation = fetcher.mock.calls.find(([, options]) => options?.method === "POST");
    expect(JSON.parse(mutation![1].body as string)).toEqual({ action: "restore", id: "version-1" });
    expect(node.textContent).toContain("Cambio confirmado y guardado en Firestore.");
  });
  it("keeps a failed restore visible without displaying successful persistence", async () => {
    fetcher.mockImplementation(async (url: string, options?: RequestInit) => new Response(JSON.stringify(options?.method === "POST" ? { success: false, error: "La versión no se aplicó." } : url.includes("visual-versions") ? { success: true, data: [version] } : { success: true, data: { products: [] } }), { status: options?.method === "POST" ? 503 : 200 }));
    await render(<VersionsPage/>); await click("Campaña de prueba"); await act(async () => node.querySelector("summary")!.click()); await click("Confirmar recuperación");
    expect(node.querySelector('[role="alert"]')?.textContent).toContain("La versión no se aplicó.");
    expect(node.textContent).not.toContain("Cambio confirmado");
  });
  it("shows truthful quota labels and actual before/after audit fields", async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ success: true, data: {
      audit: [{ id: "audit", actor: "admin@example.com", at: "2026-10-03T00:00:00.000Z", action: "UPDATE", collection: "products", documentId: "piece", before: { price: 54990 }, after: { price: 59990 } }],
      protection: { day: "2026-10-03", durable: true, appCheckMode: "monitor", limits: { user: 40, guest: 12, global: 300, tokens: 2000000 }, usage: { requests: 2, tokens: 96000, blocked: 1, unchecked: 2 } },
    } })));
    await render(<SecurityPage/>); expect(node.textContent).toContain("Tokens reservados"); expect(node.textContent).toContain("Observación");
    expect(node.textContent).toContain("Administrador: admin@example.com"); expect(node.textContent).toContain("Campos cambiados: price");
    expect(node.querySelector("pre")?.textContent).toContain("54990");
  });
});
