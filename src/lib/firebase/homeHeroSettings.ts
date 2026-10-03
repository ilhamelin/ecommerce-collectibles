import { writeAdminDocument } from "@/lib/services/adminHistory";
import { adminDb } from "./admin";
import { COLLECTIONS } from "./collections";
import { DEFAULT_HOME_HERO, HomeHeroSettingsSchema, type HomeHeroSettings } from "@/lib/constants/homeHeroDefaults";

// Reuses the existing visual settings collection; browser writes remain unnecessary.
const documentId = "home_hero";

export async function readHomeHeroSettings() {
  if (!adminDb) return { settings: { ...DEFAULT_HOME_HERO }, canPersist: false };
  const snapshot = await adminDb.collection(COLLECTIONS.BRANDING_SETTINGS).doc(documentId).get();
  const settings = snapshot.exists ? HomeHeroSettingsSchema.parse(snapshot.data()?.settings) : { ...DEFAULT_HOME_HERO };
  return { settings, canPersist: true };
}

/** A successful response always means the durable write completed. No memory fallback. */
export async function saveHomeHeroSettings(settings: HomeHeroSettings): Promise<void> {
  if (!adminDb) throw new Error("La configuración no se guardó: Firebase Admin no está disponible en el servidor.");
  await writeAdminDocument(COLLECTIONS.BRANDING_SETTINGS, documentId, {
    settings: HomeHeroSettingsSchema.parse(settings),
    updatedAt: new Date().toISOString(),
  });
}

/** Keep the original storefront visible during configuration or database outages. */
export async function getStorefrontHomeHeroSettings(): Promise<HomeHeroSettings> {
  try {
    return (await readHomeHeroSettings()).settings;
  } catch (error: unknown) {
    console.warn("[Home Hero] Settings unavailable; using original design", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return { ...DEFAULT_HOME_HERO };
  }
}
