import { describe, it, expect, vi, beforeEach } from "vitest";
import { isConfiguredAdminEmail, getAdminEmails } from "@/lib/auth/adminRoles";
import { PATCH, GET } from "@/lib/../app/api/users/route";
import { DEFAULT_USERS } from "@/lib/store/authStore";
import { NextRequest } from "next/server";

describe("Admin Roles Architecture & Whitelist Resolution", () => {
  it("should recognize default admin emails regardless of casing or whitespace", () => {
    expect(isConfiguredAdminEmail("admin@omnicollector.cl")).toBe(true);
    expect(isConfiguredAdminEmail("ADMIN@OMNICOLLECTOR.CL")).toBe(true);
    expect(isConfiguredAdminEmail("  admin@omnicollector.cl  ")).toBe(true);
    expect(isConfiguredAdminEmail("benjaigancioreyes56@gmail.com")).toBe(true);
    expect(isConfiguredAdminEmail("BENJAIGANCIOReyes56@gmail.com")).toBe(true);
    expect(isConfiguredAdminEmail("customer@example.com")).toBe(false);
    expect(isConfiguredAdminEmail(null)).toBe(false);
    expect(isConfiguredAdminEmail(undefined)).toBe(false);
  });

  it("should return unified list of admin emails including defaults", () => {
    const emails = getAdminEmails();
    expect(emails).toContain("admin@omnicollector.cl");
    expect(emails).toContain("benjaigancioreyes56@gmail.com");
  });
});

describe("Admin Role Management API (PATCH /api/users)", () => {
  beforeEach(() => {
    // Ensure test user exists in DEFAULT_USERS
    const existing = DEFAULT_USERS.find((u) => u.email === "testuser-role@omnicollector.cl");
    if (!existing) {
      DEFAULT_USERS.push({
        id: "usr-test-role-99",
        email: "testuser-role@omnicollector.cl",
        fullName: "Test User Role",
        phone: "+56 9 1111 2222",
        role: "CUSTOMER",
        addresses: [],
        paymentMethods: [],
        orders: [],
        wishlist: [],
        createdAt: new Date().toISOString(),
      });
    }
  });

  it("should reject role update without admin authorization", async () => {
    const req = new NextRequest("http://localhost:3000/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testuser-role@omnicollector.cl",
        role: "ADMIN",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe("FORBIDDEN");
  });

  it("should successfully promote customer to ADMIN with valid admin key", async () => {
    const req = new NextRequest("http://localhost:3000/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": "omni-super-secret-key-2026",
      },
      body: JSON.stringify({
        email: "testuser-role@omnicollector.cl",
        role: "ADMIN",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.role).toBe("ADMIN");

    const cached = DEFAULT_USERS.find((u) => u.email === "testuser-role@omnicollector.cl");
    expect(cached?.role).toBe("ADMIN");
  });

  it("should prevent demoting the root system admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": "omni-super-secret-key-2026",
      },
      body: JSON.stringify({
        email: "admin@omnicollector.cl",
        role: "CUSTOMER",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe("ROOT_ADMIN_IMMUTABLE");
  });

  it("should reject invalid role payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": "omni-super-secret-key-2026",
      },
      body: JSON.stringify({
        email: "testuser-role@omnicollector.cl",
        role: "SUPER_GOD_MODE",
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe("INVALID_ROLE");
  });
});
