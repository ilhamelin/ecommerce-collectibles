import { NextRequest, NextResponse } from "next/server";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/validations/schemas";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { DomainError } from "@/lib/errors/DomainErrors";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { BundleItemDefinition } from "@/lib/types/domain";
import {
  getProductsFromFirestore,
  getProductByIdOrSkuFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skuOrSlug = searchParams.get("sku") || searchParams.get("slug");
    const repo = CatalogRepository.getInstance();

    if (skuOrSlug) {
      // Check Firestore first if available, then fallback to local repo
      const firestoreProduct = await getProductByIdOrSkuFromFirestore(skuOrSlug);
      const product = firestoreProduct || repo.getBySlugOrSku(skuOrSlug);

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Producto no encontrado", code: "PRODUCT_NOT_FOUND" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: { product } });
    }

    // Try fetching products from Firestore; if empty or unconfigured, fallback to local repo
    const firestoreProducts = await getProductsFromFirestore();
    const products = (firestoreProducts && firestoreProducts.length > 0)
      ? firestoreProducts
      : repo.getAll();

    return NextResponse.json({
      success: true,
      data: {
        products,
        total: products.length,
        source: (firestoreProducts && firestoreProducts.length > 0) ? "FIRESTORE_CLOUD" : "LOCAL_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[API_PRODUCTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al obtener el catálogo", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren privilegios de administrador para crear productos.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const validationResult = CreateProductSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Los datos del producto no son válidos",
          code: "VALIDATION_FAILED",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const store = MemoryTransactionalStore.getInstance();
    const repo = CatalogRepository.getInstance();

    // If type is BUNDLE and components are provided, build BundleItemDefinition array
    let bundleComponents: BundleItemDefinition[] | undefined = undefined;
    if (data.type === "BUNDLE" && data.bundleComponents && data.bundleComponents.length > 0) {
      bundleComponents = [];
      for (const comp of data.bundleComponents) {
        const item = store.products.get(comp.componentProductId);
        if (!item) {
          return NextResponse.json(
            {
              success: false,
              error: `El componente con ID '${comp.componentProductId}' no existe en el catálogo.`,
              code: "BUNDLE_COMPONENT_NOT_FOUND",
            },
            { status: 400 }
          );
        }
        bundleComponents.push({
          componentProductId: item.id,
          sku: item.sku,
          name: item.name,
          quantity: comp.quantity,
          unitPrice: item.price,
          unitCost: item.costPrice,
          availableStock: Math.max(0, item.stockAvailable - item.stockReserved),
        });
      }
    }

    // Verify SKU uniqueness against Firestore
    const existingInFirestore = await getProductByIdOrSkuFromFirestore(data.sku);
    if (existingInFirestore) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe un producto con el SKU '${data.sku.toUpperCase()}' en la base de datos de Cloud Firestore.`,
          code: "DUPLICATE_SKU",
        },
        { status: 409 }
      );
    }

    // Prepare domain entity fields
    const newProduct = repo.addProduct({
      sku: data.sku,
      name: data.name,
      description: data.description,
      type: data.type,
      price: data.price,
      originalPrice: data.originalPrice,
      costPrice: data.costPrice,
      stockAvailable: data.stockAvailable,
      isPreOrder: data.isPreOrder,
      preOrderState: data.isPreOrder ? (data.preOrderState || "PREORDER_OPEN") : undefined,
      trailerUrl: data.trailerUrl,
      ageRating: data.ageRating,
      genres: data.genres,
      contentGallery: data.contentGallery,
      gameMetadata: data.gameMetadata ? {
        id: `meta-gm-${Date.now()}`,
        productId: "",
        ...data.gameMetadata,
      } : undefined,
      figureMetadata: data.figureMetadata ? {
        id: `meta-fig-${Date.now()}`,
        productId: "",
        ...data.figureMetadata,
      } : undefined,
      collectibleMetadata: data.collectibleMetadata ? {
        id: `meta-col-${Date.now()}`,
        productId: "",
        ...data.collectibleMetadata,
      } : undefined,
      bundleComponents,
      images: data.images,
      imageUrl: data.imageUrl || (data.images && data.images[0]),
    });

    // Save to Firestore if configured
    const savedInFirestore = await saveProductToFirestore(newProduct);
    if (!savedInFirestore) {
      repo.deleteProduct(newProduct.id);
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo guardar el producto en la base de datos de Cloud Firestore.",
          code: "FIRESTORE_WRITE_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Producto ${newProduct.sku} creado exitosamente en Cloud Firestore`,
        data: { product: newProduct },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.errorCode,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    console.error("[API_PRODUCTS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al crear el producto", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren privilegios de administrador para modificar productos.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    const validationResult = UpdateProductSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Los datos de actualización no son válidos",
          code: "VALIDATION_FAILED",
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const repo = CatalogRepository.getInstance();

    const updated = repo.updateProduct(data.id, {
      ...(data.sku && { sku: data.sku }),
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.originalPrice !== undefined && { originalPrice: data.originalPrice }),
      ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
      ...(data.stockAvailable !== undefined && { stockAvailable: data.stockAvailable }),
      ...(data.isPreOrder !== undefined && { isPreOrder: data.isPreOrder }),
      ...(data.preOrderState !== undefined && { preOrderState: data.preOrderState }),
      ...(data.trailerUrl !== undefined && { trailerUrl: data.trailerUrl }),
      ...(data.ageRating !== undefined && { ageRating: data.ageRating }),
      ...(data.genres !== undefined && { genres: data.genres }),
      ...(data.contentGallery !== undefined && { contentGallery: data.contentGallery }),
      ...(data.images !== undefined && {
        images: data.images,
        imageUrl: data.imageUrl || (data.images.length > 0 ? data.images[0] : undefined),
      }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.gameMetadata !== undefined && {
        gameMetadata: {
          id: `meta-gm-${Date.now()}`,
          productId: data.id,
          ...data.gameMetadata,
        },
      }),
      ...(data.figureMetadata !== undefined && {
        figureMetadata: {
          id: `meta-fig-${Date.now()}`,
          productId: data.id,
          ...data.figureMetadata,
        },
      }),
      ...(data.collectibleMetadata !== undefined && {
        collectibleMetadata: {
          id: `meta-col-${Date.now()}`,
          productId: data.id,
          ...data.collectibleMetadata,
        },
      }),
    });

    // Update in Firestore if configured
    await saveProductToFirestore(updated);

    return NextResponse.json({
      success: true,
      message: `Producto ${updated.sku} actualizado exitosamente`,
      data: { product: updated },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.errorCode,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    console.error("[API_PRODUCTS_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al actualizar el producto", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = verifyAdminAuthorization(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso denegado: Se requieren privilegios de administrador para eliminar productos.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("sku");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Identificador de producto (id o sku) requerido.", code: "MISSING_ID" },
        { status: 400 }
      );
    }

    // 1. Delete from Firestore
    await deleteProductFromFirestore(id);

    // 2. Delete from local repository
    const repo = CatalogRepository.getInstance();
    repo.deleteProduct(id);

    return NextResponse.json({
      success: true,
      message: `Producto '${id}' eliminado exitosamente de Cloud Firestore y del catálogo.`,
      data: { id },
    });
  } catch (error) {
    console.error("[API_PRODUCTS_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al eliminar el producto", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

