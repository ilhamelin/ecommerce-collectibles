import { NextResponse } from "next/server";
import { DEFAULT_ANNOUNCEMENT_DATA, StoreAnnouncementData } from "@/lib/constants/announcementDefaults";
import { getAnnouncementSettingsFromFirestore } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

let cachedAnnouncement: StoreAnnouncementData = { ...DEFAULT_ANNOUNCEMENT_DATA };

export async function GET() {
  try {
    const firestoreData = await getAnnouncementSettingsFromFirestore();

    if (firestoreData && typeof firestoreData === "object") {
      cachedAnnouncement = {
        ...DEFAULT_ANNOUNCEMENT_DATA,
        ...firestoreData,
      };
      return NextResponse.json({
        success: true,
        data: cachedAnnouncement,
        source: "FIRESTORE",
      });
    }

    return NextResponse.json({
      success: true,
      data: cachedAnnouncement,
      source: "DEFAULT",
    });
  } catch (error) {
    console.warn("[PUBLIC_ANNOUNCEMENT_GET_ERROR]", error);
    return NextResponse.json({
      success: true,
      data: cachedAnnouncement,
      source: "FALLBACK",
    });
  }
}
