// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { DialogSurface } from "../src/components/common/DialogSurface";

it("restores focus and body scrolling when React unmounts the dialog", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  // jsdom has no native dialog implementation; model its focus and open/close behavior.
  const openDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
  const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); this.querySelector<HTMLButtonElement>("button")?.focus(); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open"); } });
  const trigger = document.createElement("button");
  const container = document.createElement("div");
  document.body.append(trigger, container);
  trigger.focus();
  const root = createRoot(container);
  try {
    await act(async () => root.render(<DialogSurface label="Búsqueda" onClose={vi.fn()}><button>Cerrar</button></DialogSurface>));
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement?.textContent).toBe("Cerrar");
    await act(async () => root.unmount());
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  } finally {
    if (openDescriptor) Object.defineProperty(HTMLDialogElement.prototype, "showModal", openDescriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, "close", closeDescriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
    trigger.remove(); container.remove(); vi.unstubAllGlobals();
  }
});
