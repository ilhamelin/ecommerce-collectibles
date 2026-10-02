export type AutoFillEvent =
  | { kind: "progress"; message: string }
  | { kind: "field"; field: string; value: unknown }
  | { kind: "result"; data: Record<string, unknown> }
  | { kind: "error"; message: string };

/** Reads newline-delimited events across arbitrary UTF-8/network chunk boundaries. */
export async function readAutoFillResponse(response: Response, onEvent: (event: AutoFillEvent) => void): Promise<{ success: boolean; data: Record<string, unknown> }> {
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || "No se pudo autocompletar.");
    return body;
  }
  if (!response.ok || !response.body) throw new Error("No se pudo conectar con el autocompletado.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Record<string, unknown> | undefined;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event: AutoFillEvent = JSON.parse(line);
    if (event.kind === "error") throw new Error(event.message);
    if (event.kind === "result") result = event.data;
    onEvent(event);
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(consume);
      if (chunk.done) break;
    }
    consume(buffer);
    if (!result) throw new Error("La transmisión terminó sin una ficha completa. Puedes reintentar.");
    return { success: true, data: result };
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
