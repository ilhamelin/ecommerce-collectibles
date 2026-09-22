import { NextResponse } from "next/server";
import {
  DEFAULT_SIDE_BANNERS,
  SideBannersConfig,
} from "@/lib/constants/sideBannersDefaults";
import { getSideBannersSettingsFromFirestore } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let cachedConfig: SideBannersConfig = { ...DEFAULT_SIDE_BANNERS };

export async function GET() {
  try {
    const firestoreConfig = await getSideBannersSettingsFromFirestore();

    if (
      firestoreConfig &&
      typeof firestoreConfig === "object" &&
      "leftBanner" in firestoreConfig
    ) {
      cachedConfig = firestoreConfig as SideBannersConfig;
      return NextResponse.json(
        {
          success: true,
          data: {
            config: firestoreConfig,
            source: "FIRESTORE",
          },
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          config: cachedConfig,
          source: "DEFAULT_FALLBACK",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.warn("[PUBLIC_SIDE_BANNERS_GET_ERROR]", error);
    return NextResponse.json(
      {
        success: true,
        data: {
          config: cachedConfig,
          source: "MEMORY_FALLBACK",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
