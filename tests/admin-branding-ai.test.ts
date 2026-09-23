import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  DEFAULT_BRANDING_DATA,
  LOGO_ICON_OPTIONS,
  AI_ICON_PRESETS,
} from "../src/lib/constants/brandingDefaults";
import { getAdminHeaders } from "../src/lib/auth/security";
import { POST as generateIconPost } from "../src/app/api/admin/branding/generate-icon/route";
import { GET as brandingGet, POST as brandingPost } from "../src/app/api/admin/branding/route";

describe("AI Branding Icon Generation & Isotype Suite", () => {
  it("should define AI_GENERATED icon option and rich collector presets in branding defaults", () => {
    const aiOption = LOGO_ICON_OPTIONS.find((opt) => opt.id === "AI_GENERATED");
    expect(aiOption).toBeDefined();
    expect(aiOption?.label).toContain("IA");
    expect((aiOption as unknown as { isAi?: boolean }).isAi).toBe(true);

    expect(AI_ICON_PRESETS.length).toBeGreaterThanOrEqual(6);
    AI_ICON_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.title).toBeTruthy();
      expect(preset.prompt).toBeTruthy();
      expect(preset.description).toBeTruthy();
    });
  });

  it("should reject unauthenticated requests to generate-icon endpoint", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/branding/generate-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presetId: "mascara_kitsune" }),
    });

    const res = await generateIconPost(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe("FORBIDDEN");
  });

  it("should generate a clean vector SVG from a preset when authorized", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/branding/generate-icon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ presetId: "mascara_kitsune" }),
    });

    const res = await generateIconPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.svg).toContain("<svg");
    expect(json.data.svg).toContain("</svg>");
    expect(json.data.svg).not.toContain("<script");
    expect(json.data.title).toContain("Kitsune");
    expect(json.data.source).toBeDefined();
  });

  it("should fallback cleanly to custom prompt vector even in offline sandbox mode", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/branding/generate-icon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ prompt: "A sparkling dragon jewel for collectors" }),
    });

    const res = await generateIconPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.svg).toContain("<svg");
    expect(json.data.svg).toContain("</svg>");
    expect(json.data.title).toBeDefined();
  });

  it("should persist customSvgIcon through admin branding route with sanitization", async () => {
    const maliciousSvg = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><script>alert("xss")</script></svg>';

    const postReq = new NextRequest("http://localhost:3000/api/admin/branding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({
        branding: {
          ...DEFAULT_BRANDING_DATA,
          logoIcon: "AI_GENERATED",
          customSvgIcon: maliciousSvg,
        },
      }),
    });

    const postRes = await brandingPost(postReq);
    expect(postRes.status).toBe(200);
    const postJson = await postRes.json();
    expect(postJson.success).toBe(true);
    expect(postJson.data.branding.customSvgIcon).not.toContain("<script");
    expect(postJson.data.branding.customSvgIcon).toContain("<circle");

    // Verify GET retrieves it
    const getReq = new NextRequest("http://localhost:3000/api/admin/branding", {
      method: "GET",
    });
    const getRes = await brandingGet(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.data.branding.logoIcon).toBe("AI_GENERATED");
    expect(getJson.data.branding.customSvgIcon).toContain("<circle");
    expect(getJson.data.branding.customSvgIcon).not.toContain("<script");
  });
});
