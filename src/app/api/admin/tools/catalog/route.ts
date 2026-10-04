import { adminTool, json } from "@/lib/admin-tools/shared";
export const dynamic = "force-dynamic";
export const GET = adminTool(async (_request, db) => {
  const products = await db.collection("products").limit(1001).get();
  if (products.size > 1000)
    return json(
      {
        success: false,
        error:
          "El catálogo supera 1000 productos; utiliza las herramientas por lotes.",
      },
      409,
    );
  return json({
    success: true,
    data: products.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
  });
});
