import { NextRequest, NextResponse } from "next/server";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/validations/schemas";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { DomainError } from "@/lib/errors/DomainErrors";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import { BundleItemDefinition, ProductDomainEntity } from "@/lib/types/domain";
import {
  getProductsFromFirestore,
  getProductByIdOrSkuFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
} from "@/lib/firebase/firestore";
import { verifyAdminAuthorization } from "@/lib/auth/security";

function sanitizeProductData(prod: ProductDomainEntity): ProductDomainEntity {
  const p = { ...prod };
  const nameUpper = (p.name || "").toUpperCase();

  // 1. Fix incorrect FIG- prefix on non-figures
  if (p.type === "VIDEO_GAME" && p.sku && p.sku.startsWith("FIG-")) {
    p.sku = "VG-" + p.sku.slice(4);
  } else if (p.type === "COLLECTIBLE" && p.sku && p.sku.startsWith("FIG-")) {
    p.sku = "TCG-" + p.sku.slice(4);
  }

  // 2. Specific incoherences
  if (nameUpper.includes("MAGIC") && nameUpper.includes("BLACK LOTUS")) {
    p.type = "COLLECTIBLE";
    if (p.sku && p.sku.startsWith("FIG-")) {
      p.sku = "TCG-" + p.sku.slice(4);
    }
  }
  if (nameUpper.includes("FINAL FANTASY VII") && (p.type === "FIGURE" || (p.sku && p.sku.startsWith("FIG-"))) && !p.figureMetadata) {
    p.type = "VIDEO_GAME";
    if (p.sku && p.sku.startsWith("FIG-")) {
      p.sku = "VG-" + p.sku.slice(4);
    }
  }
  if (nameUpper.includes("FORZA HORIZON") && p.sku && p.sku.startsWith("FIG-")) {
    p.sku = "VG-" + p.sku.slice(4);
    p.type = "VIDEO_GAME";
  }

  // 3. Fix grading condition matching
  if (p.collectibleMetadata) {
    p.collectibleMetadata = { ...p.collectibleMetadata };
    if (nameUpper.includes("PSA 10") || (p.sku && p.sku.includes("PSA10")) || nameUpper.includes("GEM MINT 10")) {
      p.collectibleMetadata.condition = "GEM_MINT_10";
      p.collectibleMetadata.gradeScore = "10";
    } else if (nameUpper.includes("PSA 9") || (p.sku && p.sku.includes("PSA9")) || nameUpper.includes("MINT 9")) {
      p.collectibleMetadata.condition = "MINT_9";
      p.collectibleMetadata.gradeScore = "9";
    }
  }

  // 4. Normalize Consoles and Hardware separation
  const catLabel = (p.customCategoryLabel || "").toUpperCase();
  const skuUpper = (p.sku || "").toUpperCase();
  const isConsole = catLabel.includes("CONSOLA") || 
                    skuUpper.startsWith("CON-") || 
                    nameUpper.includes("NINTENDO SWITCH") || 
                    nameUpper.includes("PLAYSTATION") || 
                    nameUpper.includes("PS5") || 
                    nameUpper.includes("XBOX") || 
                    nameUpper.includes("CONSOLA");

  if (isConsole) {
    if (catLabel.includes("HARDWARE") || catLabel === "CONSOLA / HARDWARE" || p.type === "OTHER" || !p.customCategoryLabel) {
      p.customCategoryLabel = "Consolas";
    }
    if (p.customSpecifications) {
      p.customSpecifications = {
        ...p.customSpecifications,
        categoryType: "CONSOLE",
      };
    }
  } else if (catLabel.includes("HARDWARE") || catLabel.includes("COMPONENTES") || (p.customSpecifications?.categoryType === "HARDWARE")) {
    p.customCategoryLabel = "Hardware & Componentes";
    if (p.customSpecifications) {
      p.customSpecifications = {
        ...p.customSpecifications,
        categoryType: "HARDWARE",
      };
    }
  }

  return p;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skuOrSlug = searchParams.get("sku") || searchParams.get("slug");
    const repo = CatalogRepository.getInstance();

    if (skuOrSlug) {
      // Check Firestore first if available, then fallback to local repo
      let firestoreProduct = await getProductByIdOrSkuFromFirestore(skuOrSlug);
      if (!firestoreProduct && skuOrSlug.startsWith("vg-")) {
        firestoreProduct = await getProductByIdOrSkuFromFirestore("fig-" + skuOrSlug.slice(3));
      } else if (!firestoreProduct && skuOrSlug.startsWith("tcg-")) {
        firestoreProduct = await getProductByIdOrSkuFromFirestore("fig-" + skuOrSlug.slice(4));
      }

      let product = firestoreProduct || repo.getBySlugOrSku(skuOrSlug);
      if (!product && skuOrSlug.startsWith("vg-")) {
        product = repo.getBySlugOrSku("fig-" + skuOrSlug.slice(3));
      } else if (!product && skuOrSlug.startsWith("tcg-")) {
        product = repo.getBySlugOrSku("fig-" + skuOrSlug.slice(4));
      }

      if (!product) {
        return NextResponse.json(
          { success: false, error: "Producto no encontrado", code: "PRODUCT_NOT_FOUND" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: { product: sanitizeProductData(product) } });
    }

    // Try fetching products from Firestore; if empty or unconfigured, fallback to local repo
    const fresh = searchParams.get("fresh") === "true" || searchParams.get("admin") === "true";
    const firestoreProducts = await getProductsFromFirestore(fresh);

    // If Firestore has products, sync the local repository so fallbacks never show deleted zombie items
    if (firestoreProducts && firestoreProducts.length > 0) {
      repo.syncWithFirestore(firestoreProducts.map(sanitizeProductData));
    }

    const rawProducts = (firestoreProducts && firestoreProducts.length > 0)
      ? firestoreProducts
      : repo.getAll();

    const products = rawProducts.map(sanitizeProductData);

    const response = NextResponse.json({
      success: true,
      data: {
        products,
        total: products.length,
        source: (firestoreProducts && firestoreProducts.length > 0) ? "FIRESTORE_CLOUD" : "LOCAL_FALLBACK",
      },
    });

    // Disable caching to guarantee instant synchronization and prevent stale/deleted products from reappearing
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
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
      customCategoryLabel: data.customCategoryLabel,
      customSpecifications: data.customSpecifications,
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
        publisher: data.gameMetadata.publisher || "Publisher Oficial",
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
    let savedInFirestore = false;
    try {
      savedInFirestore = await saveProductToFirestore(newProduct);
    } catch (fsErr) {
      console.warn("[API_PRODUCTS_POST] Cloud Firestore write error:", fsErr);
    }

    if (!savedInFirestore) {
      console.warn(
        `[API_PRODUCTS_POST] Product '${newProduct.sku}' saved to catalog, but could not be directly synced to Cloud Firestore from serverless runtime.`
      );
      return NextResponse.json(
        {
          success: true,
          message: `Producto ${newProduct.sku} creado y activado exitosamente en el catálogo.`,
          warning:
            "El producto fue activado en el catálogo. Si desea sincronizar con Cloud Firestore en Vercel, asegúrese de configurar las credenciales de Firebase Admin SDK.",
          data: { product: newProduct, syncedToFirestore: false },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Producto ${newProduct.sku} creado exitosamente en Cloud Firestore`,
        data: { product: newProduct, syncedToFirestore: true },
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
      ...(data.customCategoryLabel !== undefined && { customCategoryLabel: data.customCategoryLabel }),
      ...(data.customSpecifications !== undefined && { customSpecifications: data.customSpecifications }),
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
          publisher: data.gameMetadata.publisher || "Publisher Oficial",
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
    const deletedInFirestore = await deleteProductFromFirestore(id);

    // 2. Delete from local repository
    const repo = CatalogRepository.getInstance();
    repo.deleteProduct(id);

    // 3. Immediately re-sync local repo with fresh Firestore state if available
    const freshProducts = await getProductsFromFirestore(true);
    if (freshProducts && freshProducts.length > 0) {
      repo.syncWithFirestore(freshProducts);
    }

    return NextResponse.json({
      success: true,
      message: `Producto '${id}' eliminado exitosamente de Cloud Firestore y del catálogo.`,
      data: { id, deletedInFirestore },
    });
  } catch (error) {
    console.error("[API_PRODUCTS_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Error interno al eliminar el producto", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

