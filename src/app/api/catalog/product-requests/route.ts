import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestIdentity } from "@/lib/auth/requestIdentity";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import { productRequestService } from "@/lib/services/productRequestService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const schema = z.object({ title: z.string().trim().min(1).max(250), franchise: z.string().max(250).optional(), category: z.string().max(100).optional(), userEmail: z.string().email().max(254), userName: z.string().max(150).optional(), userId: z.string().max(150).nullable().optional(), imageUrl: z.string().max(2000000).optional(), aiSummary: z.string().max(5000).optional(), confidenceScore: z.number().min(0).max(1).optional(), userNotes: z.string().max(2000).optional() });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Datos de solicitud inválidos." }, { status: 400 });
    const identity = await requestIdentity(req);
    if (req.headers.has("authorization") && (!identity || !identity.email)) return NextResponse.json({ success: false, error: "Identidad o correo no verificados." }, { status: 401 });
    const body = { ...parsed.data, userId: identity?.uid || null, userEmail: identity?.email || parsed.data.userEmail };
    const {
      title,
      franchise,
      category,
      userEmail,
      userName,
      userId,
      imageUrl,
      aiSummary,
      confidenceScore,
      userNotes,
    } = body;

    if (!title || !userEmail || !userEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Debes proporcionar un título de producto y un correo electrónico válido." },
        { status: 400 }
      );
    }

    const isGuest = !userId;
    const newRecord = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: String(title).trim(),
      franchise: franchise ? String(franchise).trim() : undefined,
      category: category || "OTHER",
      userEmail: String(userEmail).toLowerCase().trim(),
      userName: userName ? String(userName).trim() : (isGuest ? "Invitado Web" : String(userEmail).split("@")[0]),
      userId: userId || null,
      isGuest,
      imageUrl: imageUrl || undefined,
      aiSummary: aiSummary || undefined,
      confidenceScore: typeof confidenceScore === "number" ? confidenceScore : 0.95,
      userNotes: userNotes ? String(userNotes).trim() : undefined,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      active: true,
    };

    const saved = await productRequestService.saveRequest(newRecord);

    return NextResponse.json({
      success: true,
      message: "¡Tu solicitud para agregar este producto fue registrada exitosamente!",
      data: saved,
    });
  } catch (error: unknown) {
    console.error("[Product Requests POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar la solicitud de producto" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminAuthorization(req);
    const identity = await requestIdentity(req);
    if (!admin.authorized && !identity?.email) return NextResponse.json({ success: false, error: "Sesión verificada requerida." }, { status: 401 });
    const records = await productRequestService.getAllRequests();
    const requests = admin.authorized ? records : records.filter(item => !item.isGuest && (item.userId ? item.userId === identity?.uid : item.userEmail.toLowerCase() === identity?.email));
    return NextResponse.json({
      success: true,
      data: {
        requests,
        total: requests.length,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}
