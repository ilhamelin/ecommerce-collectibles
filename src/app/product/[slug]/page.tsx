import type { Metadata } from "next";
import { CatalogRepository } from "@/lib/services/CatalogRepository";
import { MemoryTransactionalStore } from "@/lib/db/memory-db";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: { slug: string };
}

/**
 * Server-side metadata generator for deep SEO & OpenGraph card sharing
 * (WhatsApp, Twitter/X, Discord, Facebook, Google Rich Snippets).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = (params?.slug || "").toLowerCase().trim();

  // Ensure catalog data is loaded from Firestore / memory
  await MemoryTransactionalStore.getInstance().syncAllFromFirestore();
  const repo = CatalogRepository.getInstance();
  const product = repo.getBySlugOrSku(slug);

  if (!product) {
    return {
      title: "Coleccionable no encontrado | OmniCollector Chile",
      description: "El artículo o preventa que buscas no existe o su enlace ha cambiado en OmniCollector Chile.",
    };
  }

  const title = `${product.name} | OmniCollector Chile`;
  const description =
    product.description?.replace(/(\r\n|\n|\r)/gm, " ").slice(0, 160) ||
    `Compra ${product.name} con garantía de autenticidad en OmniCollector Chile. Preventas con 20% de pie y despacho seguro a todo Chile.`;

  const imageUrl =
    product.imageUrl ||
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80";

  return {
    title,
    description,
    alternates: {
      canonical: `https://ecommerce-collectibles.vercel.app/product/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://ecommerce-collectibles.vercel.app/product/${slug}`,
      siteName: "OmniCollector Chile",
      locale: "es_CL",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * Server Component container for Product Detail.
 * Injects Schema.org JSON-LD and passes initial product state to client interactivity.
 */
export default async function ProductPage({ params }: PageProps) {
  const slug = (params?.slug || "").toLowerCase().trim();

  // Sync and fetch directly in server memory/Firestore
  await MemoryTransactionalStore.getInstance().syncAllFromFirestore();
  const repo = CatalogRepository.getInstance();
  const product = repo.getBySlugOrSku(slug);

  // Schema.org Product structured data for Google Shopping / SEO Rich Snippets
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.imageUrl || product.images?.[0],
        description: product.description?.slice(0, 250),
        sku: product.sku,
        offers: {
          "@type": "Offer",
          priceCurrency: "CLP",
          price: product.price,
          availability:
            product.stockAvailable > 0
              ? "https://schema.org/InStock"
              : product.isPreOrder
              ? "https://schema.org/PreOrder"
              : "https://schema.org/OutOfStock",
          itemCondition:
            product.collectibleMetadata?.condition === "GEM_MINT_10"
              ? "https://schema.org/NewCondition"
              : "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "OmniCollector Chile",
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient initialProduct={product} slug={slug} />
    </>
  );
}
