import { NextRequest, NextResponse } from "next/server";
import { productRequestService } from "@/lib/services/productRequestService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
  } catch (error: any) {
    console.error("[Product Requests POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al registrar la solicitud de producto" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const requests = await productRequestService.getAllRequests();
    return NextResponse.json({
      success: true,
      data: {
        requests,
        total: requests.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener solicitudes" },
      { status: 500 }
    );
  }
}
