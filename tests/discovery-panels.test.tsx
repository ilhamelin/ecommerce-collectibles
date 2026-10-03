// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ params: "q=Zelda&platform=NINTENDO_SWITCH", headers: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(mock.params) }));
vi.mock("@/lib/auth/clientIdentity", () => ({ identityHeaders: mock.headers }));
import { NotificationCenter } from "@/components/account/NotificationCenter";
import SystemHealthPage from "@/app/admin/health/page";
import { useCatalogFilters } from "@/components/catalog/useCatalogFilters";
let root: Root; let host: HTMLDivElement;
const feed = { success: true, data: { checkedAt: "2026-10-03", unread: 1, items: [{ id: "a".repeat(64), kind: "ORDER", title: "Pedido confirmado", message: "Estado real", href: "/order-confirmation/o1", at: "2026-10-03", read: false }] } };
const response = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;
async function mount(element: React.ReactElement) { await act(async () => { root.render(element); }); }
async function click(text: string) { const button = Array.from(host.querySelectorAll("button")).find(el => el.textContent?.includes(text)); expect(button).toBeDefined(); await act(async () => button!.click()); }
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); mock.headers.mockResolvedValue({ Authorization: "Bearer verified" }); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("Customer notification screen", () => {
 it("sends identity and waits for confirmed read state", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response(feed)).mockResolvedValueOnce(response({ success: false, error: "No se pudo guardar" }, false)); vi.stubGlobal("fetch", fetcher);
  await mount(<NotificationCenter />); expect(host.textContent).toContain("Pedido confirmado"); expect(fetcher.mock.calls[0][1].headers.Authorization).toContain("Bearer");
  await click("Marcar como leída"); expect(host.querySelector('[role="alert"]')?.textContent).toContain("No se pudo guardar"); expect(host.textContent).toContain("Sin leer (1)");
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ ids: ["a".repeat(64)] });
 });
 it("renders server-confirmed reads and filters unread notices", async () => {
  const read = { ...feed, data: { ...feed.data, unread: 0, items: [{ ...feed.data.items[0], read: true }] } };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response(feed)).mockResolvedValueOnce(response(read)));
  await mount(<NotificationCenter />); await click("Marcar todas"); expect(host.textContent).toContain("Leída"); await click("Sin leer (0)"); expect(host.textContent).toContain("No tienes notificaciones sin leer.");
 });
 it("shows an honest empty state", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ success: true, data: { ...feed.data, items: [], unread: 0 } })));
  await mount(<NotificationCenter />); expect(host.textContent).toContain("Todavía no hay novedades");
 });
});
describe("System health screen", () => {
 it("distinguishes verified database connectivity from configuration and preserves prior checks on failure", async () => {
  const data = { checkedAt: "2026-10-03", services: [{ id: "firestore", name: "Firestore", status: "ok", mode: "Lectura comprobada", detail: "Confirmada", latencyMs: 15 }, { id: "gemini", name: "Gemini IA", status: "ok", mode: "Configuración", detail: "No se ha probado conexión externa" }], protection: null, telemetryAvailable: false, incidents: [] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({ success: true, data })).mockResolvedValueOnce(response({ success: false, error: "Temporalmente no disponible" }, false)));
  await mount(<SystemHealthPage />); expect(host.textContent).toContain("Conectado"); expect(host.textContent).toContain("Configurado"); expect(host.textContent).toContain("No se pudo consultar la telemetría");
  await click("Actualizar"); expect(host.textContent).toContain("Se conserva la comprobación anterior"); expect(host.textContent).toContain("Firestore");
 });
});
function Filters() { const { filters, setFilter } = useCatalogFilters(); return <><span>{filters.searchQuery}:{filters.platformFilter}</span><button onClick={() => setFilter("searchQuery", "Máscara")}>Cambiar</button></>; }
describe("URL filter state", () => {
 it("hydrates shared filters, writes changes and follows external navigation", async () => {
  vi.useFakeTimers(); mock.params = "q=Zelda&platform=NINTENDO_SWITCH"; const history = vi.spyOn(window.history, "replaceState");
  await mount(<Filters />); expect(host.textContent).toContain("Zelda:NINTENDO_SWITCH"); await click("Cambiar"); await act(async () => { vi.advanceTimersByTime(251); });
  expect(history).toHaveBeenCalledWith(window.history.state, "", expect.stringContaining("q=M%C3%A1scara"));
  mock.params = "q=Elden&platform=PS5"; await mount(<Filters />); expect(host.textContent).toContain("Elden:PS5"); history.mockRestore();
 });
});
