import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PROMO_SLIDES, PromoSlideData } from "@/lib/constants/sliderDefaults";
import {
  getSliderSettingsFromFirestore,
  saveSliderSettingsToFirestore,
  getProductsFromFirestore,
} from "@/lib/firebase/firestore";
import { formatCLP } from "@/lib/utils/currency";
import { verifyAdminAuthorization } from "@/lib/auth/security";

// In-memory fallback cache to ensure instant reactivity even if Firestore is offline
let inMemorySlides: PromoSlideData[] = [...DEFAULT_PROMO_SLIDES];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminView = searchParams.get("admin") === "true";

    const [firestoreSlides, firestoreProducts] = await Promise.all([
      getSliderSettingsFromFirestore(),
      getProductsFromFirestore(true),
    ]);

    // Raw candidate slides from DB or default
    const candidateSlides: PromoSlideData[] =
      firestoreSlides && Array.isArray(firestoreSlides) && firestoreSlides.length > 0
        ? (firestoreSlides as PromoSlideData[])
        : inMemorySlides;

    // If Firestore products are accessible
    if (firestoreProducts !== null) {
      // If 0 products exist in the store:
      if (firestoreProducts.length === 0) {
        if (!isAdminView) {
          return NextResponse.json({
            success: true,
            data: {
              slides: [],
              total: 0,
              source: "FIRESTORE_EMPTY_CATALOG",
            },
          });
        }
      }

      // Synchronize slides against real products:
      // Filter out any slide whose linked product or /product/ link does NOT exist in the database!
      const validSlides = candidateSlides.filter((slide) => {
        // 1. If slide explicitly links to a SKU/ID:
        if (slide.linkedProductSku) {
          const skuLower = slide.linkedProductSku.toLowerCase().trim();
          return firestoreProducts.some(
            (p) => p.sku.toLowerCase().trim() === skuLower || p.id.toLowerCase().trim() === skuLower
          );
        }

        // 2. If slide CTA points to /product/xxx:
        if (slide.primaryCtaHref && slide.primaryCtaHref.startsWith("/product/")) {
          const pathTarget = slide.primaryCtaHref.replace("/product/", "").split("?")[0].toLowerCase().trim();
          return firestoreProducts.some(
            (p) =>
              p.sku.toLowerCase().trim() === pathTarget ||
              p.id.toLowerCase().trim() === pathTarget ||
              p.sku.toLowerCase().replace(/_/g, "-") === pathTarget
          );
        }

        // 3. If it's a generic slide (e.g. /catalog) without a specific product link:
        // Only keep if the store actually has products!
        if (firestoreProducts.length === 0) {
          return false;
        }
        return true;
      }).map((slide) => {
        // Live sync of product details (price, badge, image) if linked product exists
        if (slide.linkedProductSku) {
          const skuLower = slide.linkedProductSku.toLowerCase().trim();
          const p = firestoreProducts.find(
            (prod) => prod.sku.toLowerCase().trim() === skuLower || prod.id.toLowerCase().trim() === skuLower
          );
          if (p) {
            let formattedPrice = formatCLP(p.price);
            if (p.isPreOrder) {
              const depositRate = p.figureMetadata?.minimumDepositPercent || 0.2;
              formattedPrice = `Pie Inicial: ${formatCLP(Math.round(p.price * depositRate))}`;
            }
            return {
              ...slide,
              productBadge: slide.productBadge || p.name,
              productPrice: formattedPrice,
              image: p.imageUrl || (p.images && p.images[0]) || slide.image,
              primaryCtaHref: `/product/${p.sku.toLowerCase()}`,
            };
          }
        }
        return slide;
      });

      return NextResponse.json({
        success: true,
        data: {
          slides: validSlides,
          total: validSlides.length,
          source: "FIRESTORE_VERIFIED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        slides: candidateSlides,
        total: candidateSlides.length,
        source: "DEFAULT_FALLBACK",
      },
    });
  } catch (error) {
    console.error("[SLIDER_GET_ERROR]", error);
    return NextResponse.json({
      success: true,
      data: {
        slides: [],
        total: 0,
        source: "IN_MEMORY_FALLBACK",
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
          error: "Acceso denegado: Se requieren privilegios de administrador para modificar el slider.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if reset action requested
    if (body.action === "RESET") {
      inMemorySlides = [...DEFAULT_PROMO_SLIDES];
      await saveSliderSettingsToFirestore(DEFAULT_PROMO_SLIDES);
      return NextResponse.json({
        success: true,
        message: "Slider restablecido a los valores por defecto con éxito",
        data: {
          slides: DEFAULT_PROMO_SLIDES,
        },
      });
    }

    const { slides } = body;
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes enviar un arreglo válido de slides",
          code: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    // Clean & normalize slide fields
    const sanitizedSlides: PromoSlideData[] = slides.map((slide, idx) => ({
      id: slide.id || `slide-${idx + 1}`,
      tag: slide.tag || "DESTACADO • OMNICOLLECTOR",
      tagIcon: slide.tagIcon || "Sparkles",
      title: slide.title || "",
      titleHighlight: slide.titleHighlight || "",
      description: slide.description || "",
      primaryCtaText: slide.primaryCtaText || "Ver Catálogo",
      primaryCtaHref: slide.primaryCtaHref || "/catalog",
      secondaryCtaText: slide.secondaryCtaText || "Explorar Todo",
      secondaryCtaHref: slide.secondaryCtaHref || "/catalog",
      productBadge: slide.productBadge || "",
      productPrice: slide.productPrice || "",
      image: slide.image || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80",
      imageFit: slide.imageFit === "cover" || slide.imageFit === "showcase" ? slide.imageFit : "contain",
      imagePosition: slide.imagePosition === "top" || slide.imagePosition === "bottom" ? slide.imagePosition : "center",
      imageBg: slide.imageBg || "ambient-radial",
      imageScale: typeof slide.imageScale === "number" ? Math.min(115, Math.max(75, slide.imageScale)) : 95,
      highlights: Array.isArray(slide.highlights) ? slide.highlights.filter(Boolean) : [],
      gradient: slide.gradient || "from-[#FF6B35]/20 via-[#1F3A5F]/20 to-[#1F3A5F]",
      linkedProductSku: slide.linkedProductSku || undefined,
    }));

    inMemorySlides = sanitizedSlides;
    const firestoreSuccess = await saveSliderSettingsToFirestore(sanitizedSlides);

    return NextResponse.json({
      success: true,
      message: "Configuración del slider del inicio guardada exitosamente",
      data: {
        slides: sanitizedSlides,
        persistedInFirestore: firestoreSuccess,
      },
    });
  } catch (error) {
    console.error("[SLIDER_POST_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al guardar los cambios del slider",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
