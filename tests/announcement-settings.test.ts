import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as adminGet, POST as adminPost } from "../src/app/api/admin/announcement/route";
import { GET as publicGet } from "../src/app/api/announcement/route";
import { DEFAULT_ANNOUNCEMENT_DATA } from "../src/lib/constants/announcementDefaults";

describe("Store Top Announcement Bar Suite", () => {
  it("should return default announcement settings on public GET", async () => {
    const res = await publicGet();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.shippingText).toBe(DEFAULT_ANNOUNCEMENT_DATA.shippingText);
    expect(json.data.whatsappPhone).toBe(DEFAULT_ANNOUNCEMENT_DATA.whatsappPhone);
  });

  it("should return default announcement settings on admin GET", async () => {
    const res = await adminGet();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.announcement).toBeDefined();
    expect(json.data.announcement.enabled).toBe(true);
  });

  it("should reject POST requests without admin credentials", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcement: {
          shippingText: "Envíos Express Chile",
        },
      }),
    });

    const res = await adminPost(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe("FORBIDDEN");
  });

  it("should allow POST requests with valid admin bypass/role", async () => {
    const customAnnouncement = {
      ...DEFAULT_ANNOUNCEMENT_DATA,
      shippingText: "Despachos Gratis a Todo Chile",
      shippingHighlight: "(Chilexpress Express)",
      whatsappPhone: "+56 9 1234 5678",
    };

    const req = new NextRequest("http://localhost:3000/api/admin/announcement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-role": "ADMIN",
        "x-user-id": "admin-test-id",
      },
      body: JSON.stringify({
        announcement: customAnnouncement,
      }),
    });

    const res = await adminPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.announcement.shippingText).toBe("Despachos Gratis a Todo Chile");
    expect(json.data.announcement.whatsappPhone).toBe("+56 9 1234 5678");
  });
});
