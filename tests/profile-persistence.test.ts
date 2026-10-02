import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthStore, DEFAULT_USERS } from "@/lib/store/authStore";
const { syncProfile } = vi.hoisted(() => ({ syncProfile: vi.fn() }));
vi.mock("@/lib/firebase/client-firestore", () => ({ syncUserProfileToFirestoreClient: syncProfile }));
vi.mock("@/lib/firebase/config", () => ({ isFirebaseConfigured: () => true, getFirebaseAuth: () => null }));
beforeEach(() => {
  syncProfile.mockReset();
  useAuthStore.setState({ currentUser: structuredClone(DEFAULT_USERS[1]), isAuthenticated: true });
  vi.stubGlobal("window", {});
});
afterEach(() => vi.unstubAllGlobals());
it("does not claim success or change the profile when both persistence paths fail", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false })); syncProfile.mockResolvedValue(false);
  const previous = useAuthStore.getState().currentUser!.fullName;
  expect(await useAuthStore.getState().updateProfile({ fullName: "Changed" })).toBe(false);
  expect(useAuthStore.getState().currentUser!.fullName).toBe(previous);
});
it("updates the profile only after the backend reports a durable save", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { syncedToFirestore: true } }) }));
  expect(await useAuthStore.getState().updateProfile({ fullName: "Saved" })).toBe(true);
  expect(useAuthStore.getState().currentUser!.fullName).toBe("Saved");
  expect(syncProfile).not.toHaveBeenCalled();
});
