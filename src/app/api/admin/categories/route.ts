import { NextRequest, NextResponse } from "next/server";
import {
  getCustomCategoriesFromFirestore,
  saveCustomCategoryToFirestore,
  getDeletedNativeCategoriesFromFirestore,
  saveDeletedNativeCategoriesToFirestore,
} from "@/lib/firebase/firestore";
import {
  readCategoriesFromDisk,
  saveCategoryToDisk,
  writeCategoriesToDisk,
  readDeletedNativeCategoriesFromDisk,
  writeDeletedNativeCategoriesToDisk,
} from "@/lib/services/categoryDiskService";
import { verifyAdminAuthorization } from "@/lib/auth/security";
import type { CustomCategoryEntity } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch custom categories and deleted native categories from Firestore
    const [firestoreCats, firestoreDeleted] = await Promise.all([
      getCustomCategoriesFromFirestore().catch((e) => {
        console.warn("[CATEGORIES_GET] Firestore categories read error:", e);
        return [] as CustomCategoryEntity[];
      }),
      getDeletedNativeCategoriesFromFirestore().catch((e) => {
        console.warn("[CATEGORIES_GET] Firestore deleted native read error:", e);
        return [] as string[];
      }),
    ]);

    const diskDeleted = readDeletedNativeCategoriesFromDisk();
    const diskCats = readCategoriesFromDisk();

    // Merge deleted categories with priority to persistent data
    const combinedDeleted = Array.from(new Set([...firestoreDeleted, ...diskDeleted]));
    if (combinedDeleted.length > 0) {
      writeDeletedNativeCategoriesToDisk(combinedDeleted);
    }

    const finalCategories = firestoreCats.length > 0 ? firestoreCats : diskCats;
    if (firestoreCats.length > 0) {
      writeCategoriesToDisk(firestoreCats);
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: finalCategories,
        deletedNativeCategories: combinedDeleted,
        source: firestoreCats.length > 0 ? "FIRESTORE" : "DISK_STORAGE",
      },
    });
  } catch (error) {
    console.error("[CATEGORIES_GET_ERROR]", error);
    const diskCategories = readCategoriesFromDisk();
    const deletedNativeCategories = readDeletedNativeCategoriesFromDisk();
    return NextResponse.json({
      success: true,
      data: {
        categories: diskCategories,
        deletedNativeCategories,
        source: "FALLBACK_DISK",
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren credenciales de administrador para crear categorías.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "El nombre de la categoría es obligatorio.",
        },
        { status: 400 }
      );
    }

    const trimmedName = body.name.trim();
    const slug =
      (body.slug && typeof body.slug === "string" && body.slug.trim())
        ? body.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-")
        : trimmedName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

    const categoryId = body.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newCategory: CustomCategoryEntity = {
      id: categoryId,
      name: trimmedName,
      slug,
      iconName: typeof body.iconName === "string" ? body.iconName : "Layers",
      description: typeof body.description === "string" ? body.description.trim() : "",
      availableSubtypes: Array.isArray(body.availableSubtypes)
        ? body.availableSubtypes.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [],
      basicSpecFields: Array.isArray(body.basicSpecFields)
        ? body.basicSpecFields
            .filter((f: any) => f && typeof f.name === "string" && f.name.trim())
            .map((f: any) => ({
              id: f.id || `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: f.name.trim(),
              placeholder: f.placeholder ? String(f.placeholder).trim() : "",
              defaultValue: f.defaultValue ? String(f.defaultValue).trim() : "",
              required: Boolean(f.required),
            }))
        : [],
      advancedSpecFields: Array.isArray(body.advancedSpecFields)
        ? body.advancedSpecFields
            .filter((f: any) => f && typeof f.name === "string" && f.name.trim())
            .map((f: any) => ({
              id: f.id || `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: f.name.trim(),
              placeholder: f.placeholder ? String(f.placeholder).trim() : "",
              defaultValue: f.defaultValue ? String(f.defaultValue).trim() : "",
              required: Boolean(f.required),
            }))
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist to disk and Firestore
    saveCategoryToDisk(newCategory);
    await saveCustomCategoryToFirestore(newCategory);

    return NextResponse.json({
      success: true,
      data: {
        category: newCategory,
      },
    });
  } catch (error) {
    console.error("[CATEGORIES_POST_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al procesar la categoría.",
      },
      { status: 500 }
    );
  }
}
