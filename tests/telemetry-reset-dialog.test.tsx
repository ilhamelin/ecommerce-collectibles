// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TelemetryResetDialog } from "../src/components/admin/TelemetryResetDialog";

describe("Telemetry reset confirmation", () => {
  let container: HTMLDivElement;
  let root: Root;
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    onConfirm.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  async function open() {
    await act(async () => root.render(<TelemetryResetDialog disabled={false} onConfirm={onConfirm} />));
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    await act(async () => trigger.click());
    return document.querySelector<HTMLElement>('[role="alertdialog"]')!;
  }

  it("explains the scope and focuses the safe action without resetting on open", async () => {
    const dialog = await open();
    expect(dialog.textContent).toContain("incluyendo los períodos anteriores");
    expect(dialog.textContent).toContain("no se puede deshacer");
    expect(document.activeElement?.textContent).toBe("Conservar historial");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels without resetting and restores focus to the trigger", async () => {
    const dialog = await open();
    const cancel = [...dialog.querySelectorAll("button")].find(button => button.textContent === "Conservar historial")!;
    await act(async () => cancel.click());
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    // Radix restores focus after its deferred close callback.
    await act(async () => new Promise(resolve => setTimeout(resolve, 10)));
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Limpiar historial de telemetría");
  });

  it("calls the existing action once only after explicit confirmation", async () => {
    const dialog = await open();
    const confirm = [...dialog.querySelectorAll("button")].find(button => button.textContent === "Sí, eliminar historial")!;
    await act(async () => confirm.click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("does not open or reset while another action is pending", async () => {
    await act(async () => root.render(<TelemetryResetDialog disabled onConfirm={onConfirm} />));
    await act(async () => container.querySelector<HTMLButtonElement>("button")!.click());
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
