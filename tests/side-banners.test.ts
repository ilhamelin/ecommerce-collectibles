import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as adminGet, POST as adminPost } from "../src/app/api/admin/side-banners/route";
import {
  DEFAULT_SIDE_BANNERS,
  POPULAR_SIDE_PRESETS,
} from "../src/lib/constants/sideBannersDefaults";

describe("Promotional Side Banners (Skins & Ads) Suite", () => {
  it("should have valid default configuration with both left and right banners", () => {
    expect(DEFAULT_SIDE_BANNERS.enabled).toBe(true);
    expect(DEFAULT_SIDE_BANNERS.leftBanner.enabled).toBe(true);
    expect(DEFAULT_SIDE_BANNERS.leftBanner.title).toBe("ELDEN RING");
    expect(DEFAULT_SIDE_BANNERS.rightBanner.enabled).toBe(true);
    expect(DEFAULT_SIDE_BANNERS.rightBanner.title).toBe("POKÉMON TCG");
    expect(POPULAR_SIDE_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("should return side banner settings on GET", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/side-banners", {
      method: "GET",
    });
    const res = await adminGet(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.config).toBeDefined();
    expect(json.data.config.leftBanner).toBeDefined();
    expect(json.data.config.rightBanner).toBeDefined();
  });

  it("should reject POST requests without admin authorization", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/side-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: DEFAULT_SIDE_BANNERS,
      }),
    });

    const res = await adminPost(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe("FORBIDDEN");
  });

  it("should accept POST and update configuration when authorized", async () => {
    const customConfig = {
      enabled: true,
      leftBanner: {
        ...DEFAULT_SIDE_BANNERS.leftBanner,
        title: "FINAL FANTASY VII",
        badge: "ESTRENO PS5",
      },
      rightBanner: {
        ...DEFAULT_SIDE_BANNERS.rightBanner,
        title: "ZELDA TOTK",
        badge: "OBRA MAESTRA",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/admin/side-banners", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-role": "ADMIN",
        "x-user-id": "admin-test-id",
      },
      body: JSON.stringify({ config: customConfig }),
    });

    const res = await adminPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.config.leftBanner.title).toBe("FINAL FANTASY VII");
    expect(json.data.config.rightBanner.title).toBe("ZELDA TOTK");
  });

  it("should support RESET action to restore defaults", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/side-banners", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-role": "ADMIN",
        "x-user-id": "admin-test-id",
      },
      body: JSON.stringify({ action: "RESET" }),
    });

    const res = await adminPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.config.leftBanner.title).toBe(DEFAULT_SIDE_BANNERS.leftBanner.title);
  });
});
