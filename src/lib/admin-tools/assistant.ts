import { z } from "zod";
import type { ProductDomainEntity } from "@/lib/types/domain";
export const assistantPlan = z
  .object({
    filter: z.enum([
      "ALL",
      "NO_IMAGE",
      "NO_DESCRIPTION",
      "NO_STOCK",
      "NO_MANUFACTURER",
    ]),
    query: z.string().max(150),
    introduction: z.string().max(1500),
  })
  .strict();
export type AssistantPlan = z.infer<typeof assistantPlan>;
export function filterAssistantProducts(
  products: ProductDomainEntity[],
  plan: AssistantPlan,
) {
  const aliases: Record<string, string> = {
    figura: "FIGURE",
    figuras: "FIGURE",
    videojuego: "VIDEO_GAME",
    videojuegos: "VIDEO_GAME",
    consolas: "CONSOLE",
    consola: "CONSOLE",
  };
  const query = (
    aliases[plan.query.toLocaleLowerCase().trim()] || plan.query
  ).toLocaleLowerCase();
  return products
    .filter(
      (product) =>
        (!query ||
          [product.name, product.sku, product.type]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query)) &&
        (plan.filter === "ALL" ||
          (plan.filter === "NO_IMAGE" &&
            !product.imageUrl &&
            !product.images?.length) ||
          (plan.filter === "NO_DESCRIPTION" && !product.description?.trim()) ||
          (plan.filter === "NO_STOCK" &&
            product.stockAvailable - (product.stockReserved || 0) <= 0) ||
          (plan.filter === "NO_MANUFACTURER" &&
            product.type === "FIGURE" &&
            !product.figureMetadata?.manufacturer)),
    )
    .slice(0, 100);
}
