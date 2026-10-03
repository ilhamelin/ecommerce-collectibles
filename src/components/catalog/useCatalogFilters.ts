"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseCatalogFilters, serializeCatalogFilters, type CatalogFilters } from "@/lib/services/catalogFilters";
/** Native history integration preserves Next navigation state without rerendering the route on each keystroke. */
export function useCatalogFilters() {
  const params = useSearchParams(); const raw = params.toString();
  const [filters, setFilters] = useState(() => parseCatalogFilters(new URLSearchParams(raw)));
  const lastWritten = useRef(raw);
  useEffect(() => { if (raw !== lastWritten.current) { lastWritten.current = raw; setFilters(parseCatalogFilters(new URLSearchParams(raw))); } }, [raw]);
  useEffect(() => {
    const next = serializeCatalogFilters(filters, new URLSearchParams(raw)); if (next === raw) return;
    const timer = window.setTimeout(() => { lastWritten.current = next; window.history.replaceState(window.history.state, "", "/catalog" + (next ? "?" + next : "")); }, 250);
    return () => window.clearTimeout(timer);
  }, [filters, raw]);
  const setFilter = (key: keyof CatalogFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  return { filters, setFilter };
}
