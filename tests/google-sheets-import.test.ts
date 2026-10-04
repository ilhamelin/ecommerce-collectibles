import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const mock = vi.hoisted(() => ({
  token: vi.fn(),
  constructor: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("google-auth-library", () => ({
  JWT: class {
    constructor(options: unknown) {
      mock.constructor(options);
    }
    getAccessToken() {
      return mock.token();
    }
  },
}));
vi.mock("@/lib/firebase/admin", () => ({ adminDb: {} }));
vi.mock("@/lib/auth/security", () => ({ verifyAdminAuthorization: mock.auth }));
import {
  parseGoogleSheetLink,
  googleValuesToMatrix,
} from "@/lib/admin-tools/googleSheets";
import {
  inspectGoogleSheet,
  readGoogleSheet,
} from "@/lib/admin-tools/googleSheets.server";
import { GET, POST } from "@/app/api/admin/import/google-sheets/route";
import { importHeaders } from "@/lib/admin-tools/import";
const id = "abcdefghijklmnopqrstuv123456";
const url = `https://docs.google.com/spreadsheets/d/${id}/edit#gid=7`;
const metadata = {
  spreadsheetId: id,
  properties: { title: "Productos privados" },
  sheets: [
    { properties: { sheetId: 0, title: "Primera", sheetType: "GRID" } },
    { properties: { sheetId: 7, title: "L'artículo", sheetType: "GRID" } },
  ],
};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv(
    "FIREBASE_CLIENT_EMAIL",
    "import-test@example.iam.gserviceaccount.com",
  );
  vi.stubEnv("FIREBASE_PRIVATE_KEY", "test-key");
  mock.auth.mockResolvedValue({ authorized: true, actor: "admin" });
  mock.token.mockResolvedValue({ token: "only-server-token" });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const request = (body: unknown) =>
  new NextRequest("https://localhost/api/admin/import/google-sheets", {
    method: "POST",
    body: JSON.stringify(body),
  });
describe("Google Sheets importer", () => {
  it("accepts standard Sheets links and selects the numeric gid", () => {
    expect(parseGoogleSheetLink(url)).toEqual({
      spreadsheetId: id,
      sheetId: 7,
    });
    expect(
      parseGoogleSheetLink(
        `https://docs.google.com/spreadsheets/u/0/d/${id}/edit`,
      ),
    ).toEqual({ spreadsheetId: id, sheetId: undefined });
  });
  it.each([
    "http://docs.google.com/spreadsheets/d/abcdefghijklmnopqrst",
    "https://docs.google.com.attacker.test/spreadsheets/d/abcdefghijklmnopqrst",
    "https://attacker.test/a",
    "https://user:secret@docs.google.com/spreadsheets/d/abcdefghijklmnopqrst",
    "https://docs.google.com:444/spreadsheets/d/abcdefghijklmnopqrst",
    "https://drive.google.com/file/d/abcdefghijklmnopqrst",
    url.replace("gid=7", "gid=-1"),
  ])("rejects untrusted or incompatible links: %s", (value) => {
    expect(() => parseGoogleSheetLink(value)).toThrow();
  });
  it("pads empty image cells and preserves integer CLP without formatted separators", () => {
    expect(
      googleValuesToMatrix({
        values: [
          importHeaders,
          ["FIG-001", "Figura", "FIGURE", 54990, 42000, 8, "Descripción"],
        ],
      })[1],
    ).toEqual([
      "FIG-001",
      "Figura",
      "FIGURE",
      "54990",
      "42000",
      "8",
      "Descripción",
      "",
    ]);
  });
  it("rejects excessive rows, unexpected values and occupied column I", () => {
    for (const raw of [
      { values: Array.from({ length: 102 }, () => ["x"]) },
      { values: [importHeaders, [true]] },
      { values: [importHeaders, ["x".repeat(2001)]] },
      { values: [importHeaders, Array(9).fill("x")] },
      { values: [] },
    ])
      expect(() => googleValuesToMatrix(raw)).toThrow();
  });
  it("inspects metadata without returning OAuth tokens or private keys", async () => {
    fetchMock.mockResolvedValue(Response.json(metadata));
    const response = await POST(request({ action: "inspect", url }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.selectedSheetId).toBe(7);
    expect(body.data.sheets).toHaveLength(2);
    expect(JSON.stringify(body)).not.toContain("only-server-token");
    expect(JSON.stringify(body)).not.toContain("test-key");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it("requests read-only scope and safely quotes the selected tab range", async () => {
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "second-test-key");
    fetchMock
      .mockResolvedValueOnce(Response.json(metadata))
      .mockResolvedValueOnce(
        Response.json({
          values: [
            importHeaders,
            ["FIG-001", "Figura", "FIGURE", 54990, 42000, 8, "Descripción"],
          ],
        }),
      );
    const data = await readGoogleSheet(url, 7);
    expect(data.matrix[1][3]).toBe("54990");
    expect(mock.constructor).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      }),
    );
    const [target, options] = fetchMock.mock.calls[1];
    expect(new URL(target).hostname).toBe("sheets.googleapis.com");
    expect(decodeURIComponent(new URL(target).pathname)).toContain(
      "'L''artículo'!A:I",
    );
    expect(new URL(target).searchParams.get("valueRenderOption")).toBe(
      "UNFORMATTED_VALUE",
    );
    expect(options.headers.Authorization).toBe("Bearer only-server-token");
    expect(options.redirect).toBe("error");
  });
  it("denies access before fetching Google or exposing configuration", async () => {
    mock.auth.mockResolvedValue({ authorized: false });
    expect((await GET(request({}))).status).toBe(403);
    expect((await POST(request({ action: "inspect", url }))).status).toBe(403);
    expect(mock.token).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("validates the route body and URL before provider requests", async () => {
    for (const body of [
      { action: "inspect", url: "https://attacker.test" },
      { action: "read", url, sheetId: -1 },
      { action: "read", url, sheetId: 7, token: "injected" },
    ])
      expect((await POST(request(body))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("exposes only the service email and configuration status to the administrator", async () => {
    const body = await (await GET(request({}))).json();
    expect(body.data).toEqual({
      serviceEmail: "import-test@example.iam.gserviceaccount.com",
      configured: true,
    });
  });
  it("reports configuration and authentication failures without leaking secrets", async () => {
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
    await expect(inspectGoogleSheet(url)).rejects.toMatchObject({
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "private-secret");
    mock.token.mockRejectedValue(new Error("private-secret only-server-token"));
    await expect(inspectGoogleSheet(url)).rejects.toThrow(
      "No se pudo autenticar",
    );
  });
  it.each([403, 404, 429, 500])(
    "maps provider status %s to an actionable error without raw details",
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response("secret-provider-body", { status }),
      );
      const response = await POST(request({ action: "inspect", url }));
      expect(response.status).toBe(status === 500 ? 503 : status);
      expect(await response.text()).not.toContain("secret-provider-body");
    },
  );
  it("fails closed on malformed JSON and a removed tab", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not json"));
    await expect(inspectGoogleSheet(url)).rejects.toMatchObject({
      status: 503,
    });
    fetchMock.mockResolvedValueOnce(Response.json(metadata));
    await expect(readGoogleSheet(url, 90)).rejects.toMatchObject({
      status: 409,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("bounds external response size before JSON parsing", async () => {
    fetchMock.mockResolvedValue(new Response("x".repeat(2 * 1024 * 1024 + 1)));
    await expect(inspectGoogleSheet(url)).rejects.toMatchObject({
      status: 413,
    });
  });
  it("respects the column count of a small converted workbook", async () => {
    const small = {
      ...metadata,
      sheets: [
        {
          properties: {
            sheetId: 7,
            title: "Productos",
            sheetType: "GRID",
            gridProperties: { rowCount: 2, columnCount: 8 },
          },
        },
      ],
    };
    fetchMock.mockResolvedValueOnce(Response.json(small)).mockResolvedValueOnce(
      Response.json({
        values: [
          importHeaders,
          ["FIG-001", "Figura", "FIGURE", 54990, 42000, 8, "Descripción"],
        ],
      }),
    );
    expect((await readGoogleSheet(url, 7)).matrix).toHaveLength(2);
    expect(
      decodeURIComponent(new URL(fetchMock.mock.calls[1][0]).pathname),
    ).toContain("'Productos'!A:H");
  });
});
