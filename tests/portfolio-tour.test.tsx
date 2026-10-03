// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import PortfolioPage from "@/app/portfolio/page";
describe("Isolated portfolio tour", () => {
  let root: Root; let node: HTMLDivElement; const request = vi.fn();
  beforeEach(async () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    request.mockReset(); vi.stubGlobal("fetch", request); node = document.createElement("div"); document.body.append(node); root = createRoot(node);
    await act(async () => root.render(<PortfolioPage/>));
  });
  afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); });
  async function click(text: string) { const button = Array.from(node.querySelectorAll("button")).find(button => button.textContent?.includes(text)); expect(button).toBeTruthy(); await act(async () => button!.click()); }
  it("shows explicit demo scope and compares local examples without requests", async () => {
    expect(node.textContent).toContain("datos ficticios y estado local"); await click("Comparar estos ejemplos");
    expect(node.querySelector("table")?.textContent).toContain("54.990"); expect(request).not.toHaveBeenCalled();
  });
  it("walks through all image-analysis stages without calling a model", async () => {
    await click("Una imagen, una pista"); for (let i = 0; i < 4; i++) await click("Ver siguiente etapa");
    expect(node.textContent).toContain("Los resultados reales dependen del catálogo"); expect(request).not.toHaveBeenCalled();
  });
  it("keeps a simulated reservation reversible and never creates a real order", async () => {
    await click("Cada unidad cuenta"); await click("Simular una reserva");
    expect(node.textContent).toContain("Una unidad reservada únicamente"); await click("Liberar reserva del ejemplo");
    expect(node.textContent).toContain("Ninguna reserva activa"); expect(request).not.toHaveBeenCalled();
  });
  it("captures and previews local designs without admin access or cloud writes", async () => {
    await click("Cambios con memoria"); await click("Capturar título del ejemplo");
    expect(node.textContent).toContain("Versión 2"); await click("Ver diseño"); expect(node.textContent).toContain("Vista previa local");
    expect(request).not.toHaveBeenCalled();
  });
});
