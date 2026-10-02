import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore } from "@/lib/store/authStore";

beforeEach(() => useAuthStore.setState({ currentUser: null, isAuthenticated: false, isAdmin: false }));
afterEach(() => vi.unstubAllGlobals());

describe("Admin login waits for server verification", () => {
  it("does not authenticate when the server refuses credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await useAuthStore.getState().login("admin@omnicollector.cl", "admin123");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().isAdmin).toBe(false);
  });
  it("waits for the cookie response and supports the configured demo password", async () => {
    let respond!: (value: { ok: boolean }) => void;
    const response = new Promise<{ ok: boolean }>((resolve) => { respond = resolve; });
    const fetchMock = vi.fn().mockReturnValue(response);
    vi.stubGlobal("fetch", fetchMock);
    const login = useAuthStore.getState().login("admin@omnicollector.cl", "configured-demo-password");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    respond({ ok: true });
    expect((await login).success).toBe(true);
    expect(useAuthStore.getState().isAdmin).toBe(true);
    expect(fetchMock.mock.calls[0][1].body).toContain("configured-demo-password");
  });
  it("fails safely when the session request cannot reach the server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await useAuthStore.getState().login("admin@omnicollector.cl", "admin123")).success).toBe(false);
    expect(useAuthStore.getState().isAdmin).toBe(false);
  });
});
