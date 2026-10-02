import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/admin/auto-fill-product/route";
import { readAutoFillResponse, type AutoFillEvent } from "../src/lib/services/autoFillStream";
vi.mock("@/lib/services/apiTelemetryService", () => ({ recordApiUsage: async () => undefined }));
vi.mock("@/lib/services/geminiClient", () => ({ getGeminiApiKey: () => undefined, getSupportedGeminiModels: vi.fn() }));
afterEach(() => vi.restoreAllMocks());
const streamResponse = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
    controller.close();
  } }), { headers: { "Content-Type": "application/x-ndjson" } });
};
describe("Auto-fill live transport", () => {
  it("handles split UTF-8 and applies field events before the final result", async () => {
    const events: AutoFillEvent[] = [];
    const response = streamResponse([
      { kind: "progress", message: "Validación" },
      { kind: "field", field: "name", value: "Figura edición" },
      { kind: "result", data: { name: "Figura edición" } },
    ].map(event => JSON.stringify(event)).join("\n"));
    const result = await readAutoFillResponse(response, event => events.push(event));
    expect(events.map(event => event.kind)).toEqual(["progress", "field", "result"]);
    expect(result.data.name).toBe("Figura edición");
  });
  it("rejects interrupted and failed streams without reporting completion", async () => {
    await expect(readAutoFillResponse(streamResponse('{"kind":"progress","message":"Esperando"}\n'), () => {})).rejects.toThrow("sin una ficha completa");
    await expect(readAutoFillResponse(streamResponse('{"kind":"error","message":"Fallo de servidor"}\n'), () => {})).rejects.toThrow("Fallo de servidor");
  });
  it("preserves the JSON response contract", async () => {
    const result = await readAutoFillResponse(Response.json({ success: true, data: { name: "Figura" } }), () => {});
    expect(result.data.name).toBe("Figura");
  });
  it("streams real fallback events and validated data without exposing credentials", async () => {
    const response = await POST(new NextRequest("http://localhost/api/admin/auto-fill-product", {
      method: "POST", headers: { Accept: "application/x-ndjson", "Content-Type": "application/json" }, body: JSON.stringify({ name: "Bandai Son Goku" }),
    }));
    const events: AutoFillEvent[] = [];
    const result = await readAutoFillResponse(response, event => events.push(event));
    expect(result.data.engine).toBe("SMART_KNOWLEDGE_ENGINE");
    expect(events.some(event => event.kind === "progress" && event.message.includes("heurístico"))).toBe(true);
    expect(events.some(event => event.kind === "field" && event.field === "description")).toBe(true);
    expect(events.at(-1)?.kind).toBe("result");
  });
  it("communicates validation errors inside the stream", async () => {
    const response = await POST(new NextRequest("http://localhost/api/admin/auto-fill-product", {
      method: "POST", headers: { Accept: "application/x-ndjson" }, body: "{}",
    }));
    await expect(readAutoFillResponse(response, () => {})).rejects.toThrow("Debes ingresar");
  });
});
