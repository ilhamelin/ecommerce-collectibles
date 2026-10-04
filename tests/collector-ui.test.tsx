// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectorInput, type CollectorFeed } from "@/lib/collector/schema";
const mocks = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("@/lib/auth/clientIdentity", () => ({ identityHeaders: mocks.headers }));
import { CollectorCabinet } from "@/components/account/CollectorCabinet";

let host: HTMLDivElement; let root: Root;
const entry = { ...collectorInput.parse({ title: "Pikachu", category: "FIGURE", universe: "Pokémon" }), id: "550e8400-e29b-41d4-a716-446655440000", kind: "WANTED" as const, createdAt: "2026-10-03", updatedAt: "2026-10-03" };
const feed: CollectorFeed = { entries: [entry], matches: { [entry.id]: [{ id: "p1", sku: "FIG-1", name: "Pikachu", price: 10000, photoUrl: "", updatedAt: "2026-10-03" }] }, catalogAvailable: true };
const response = (data = feed) => ({ ok: true, json: async () => ({ success: true, data }) });
beforeEach(() => {
  vi.clearAllMocks(); host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); mocks.headers.mockResolvedValue({ Authorization: "Bearer verified" }); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response()));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const click = async (text: string) => { const button = Array.from(host.querySelectorAll("button")).find(item => item.textContent?.includes(text)); expect(button).toBeTruthy(); await act(async () => button!.click()); };
describe("Collector interface", () => {
  it("shows real catalog suggestions and moves a wanted piece only after a server-confirmed save", async () => {
    await act(async () => root.render(<CollectorCabinet kind="WANTED" products={[]} />));
    expect(host.querySelector('a[href="/product/FIG-1"]')).not.toBeNull();
    await click("Ya la tengo");
    const calls = vi.mocked(fetch).mock.calls; const options = calls[1][1]!;
    expect(options.method).toBe("PATCH"); expect(options.headers).toMatchObject({ Authorization: "Bearer verified" });
    expect(JSON.parse(String(options.body))).toMatchObject({ id: entry.id, kind: "COLLECTION", entry: { maxBudget: null } });
  });
  it("asks before deleting and sends only the selected entry ID", async () => {
    await act(async () => root.render(<CollectorCabinet kind="WANTED" products={[]} />));
    await click("Eliminar"); expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    await click("Conservar"); expect(host.textContent).not.toContain("¿Eliminar esta pieza");
    await click("Eliminar"); await click("Sí, eliminar");
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe("/api/users/collector?id=" + entry.id); expect(vi.mocked(fetch).mock.calls[1][1]?.method).toBe("DELETE");
  });
  it("keeps the form and saved piece visible when an edit fails", async () => {
    await act(async () => root.render(<CollectorCabinet kind="WANTED" products={[]} />)); await click("Editar");
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ success: false, error: "No se pudo guardar." }) } as Response);
    await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("No se pudo guardar"); expect(host.querySelector("form")).not.toBeNull(); expect(host.querySelectorAll("article")).toHaveLength(1);
  });
  it("shows catalog outages explicitly and keeps own pieces separate from wanted entries", async () => {
    vi.mocked(fetch).mockResolvedValue(response({ ...feed, catalogAvailable: false }) as Response);
    await act(async () => root.render(<CollectorCabinet kind="WANTED" products={null} />)); expect(host.textContent).toContain("no pudimos consultar el catálogo");
    await act(async () => root.render(<CollectorCabinet kind="COLLECTION" products={null} />)); expect(host.querySelectorAll("article")).toHaveLength(0); expect(host.textContent).toContain("primera pieza");
  });
});
