import { MemoryTransactionalStore } from "../db/memory-db";
import { ProductDomainEntity } from "../types/domain";
import { BundleService } from "./BundleService";
import { ValidationError, NotFoundError } from "../errors/DomainErrors";

export class CatalogRepository {
  private static instance: CatalogRepository;
  private store: MemoryTransactionalStore;
  private bundleService: BundleService;

  private constructor() {
    this.store = MemoryTransactionalStore.getInstance();
    this.bundleService = new BundleService(this.store);
  }

  public static getInstance(): CatalogRepository {
    if (!CatalogRepository.instance) {
      CatalogRepository.instance = new CatalogRepository();
    }
    return CatalogRepository.instance;
  }

  public getAll(): ProductDomainEntity[] {
    const products = Array.from(this.store.products.values());

    return products.map((prod) => {
      if (prod.type === "BUNDLE") {
        try {
          const info = this.bundleService.getBundleAvailability(prod.id);
          return {
            ...prod,
            calculatedAvailableStock: info.calculatedAvailableStock,
            aggregateMarginPercent: info.aggregateMarginPercent,
            nominalSumOfItems: info.nominalSumOfItems,
          };
        } catch {
          return prod;
        }
      }
      return prod;
    });
  }

  public getById(id: string): ProductDomainEntity | null {
    const product = this.store.products.get(id);
    if (!product) return null;
    return this.enrichIfBundle(product);
  }

  public getBySlugOrSku(slugOrSku: string): ProductDomainEntity | null {
    const clean = slugOrSku.toLowerCase().trim();
    const product = Array.from(this.store.products.values()).find((p) => {
      const skuMatch = p.sku.toLowerCase() === clean;
      const idMatch = p.id.toLowerCase() === clean;
      const slugMatch = p.sku.toLowerCase().replace(/_/g, "-") === clean;
      return skuMatch || idMatch || slugMatch;
    });

    if (!product) return null;
    return this.enrichIfBundle(product);
  }

  private enrichIfBundle(product: ProductDomainEntity): ProductDomainEntity {
    if (product.type === "BUNDLE") {
      try {
        const info = this.bundleService.getBundleAvailability(product.id);
        return {
          ...product,
          calculatedAvailableStock: info.calculatedAvailableStock,
          aggregateMarginPercent: info.aggregateMarginPercent,
          nominalSumOfItems: info.nominalSumOfItems,
        };
      } catch {
        return product;
      }
    }
    return product;
  }

  public addProduct(productData: Omit<ProductDomainEntity, "id" | "stockReserved"> & { id?: string }): ProductDomainEntity {
    // Verify SKU uniqueness
    const existing = Array.from(this.store.products.values()).find(
      (p) => p.sku.toUpperCase() === productData.sku.toUpperCase()
    );

    if (existing) {
      throw new ValidationError(`Ya existe un producto registrado con el SKU '${productData.sku}'.`);
    }

    const id = productData.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newProduct: ProductDomainEntity = {
      ...productData,
      id,
      sku: productData.sku.toUpperCase().trim(),
      stockReserved: 0,
      price: Math.round(productData.price),
      costPrice: Math.round(productData.costPrice),
      createdAt: productData.createdAt || new Date().toISOString(),
    };

    this.store.products.set(id, newProduct);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<ProductDomainEntity>): ProductDomainEntity {
    const existing = this.store.products.get(id);
    if (!existing) {
      throw new NotFoundError(`Producto con ID '${id}' no encontrado.`);
    }

    if (updates.sku && updates.sku.toUpperCase().trim() !== existing.sku.toUpperCase()) {
      const duplicateSku = Array.from(this.store.products.values()).find(
        (p) => p.id !== id && p.sku.toUpperCase() === updates.sku!.toUpperCase().trim()
      );
      if (duplicateSku) {
        throw new ValidationError(`Ya existe otro producto con el SKU '${updates.sku}'.`);
      }
    }

    const updatedProduct: ProductDomainEntity = {
      ...existing,
      ...updates,
      id: existing.id,
      sku: updates.sku ? updates.sku.toUpperCase().trim() : existing.sku,
      price: updates.price !== undefined ? Math.round(updates.price) : existing.price,
      originalPrice: updates.originalPrice !== undefined ? Math.round(updates.originalPrice) : existing.originalPrice,
      costPrice: updates.costPrice !== undefined ? Math.round(updates.costPrice) : existing.costPrice,
      stockAvailable: updates.stockAvailable !== undefined ? Math.max(0, updates.stockAvailable) : existing.stockAvailable,
      stockReserved: existing.stockReserved,
    };

    this.store.products.set(id, updatedProduct);
    return this.enrichIfBundle(updatedProduct);
  }

  public deleteProduct(id: string): boolean {
    const existing = this.store.products.get(id);
    if (!existing) {
      // Also try finding by SKU or slug if id wasn't the direct key
      const found = Array.from(this.store.products.values()).find(
        (p) => p.id === id || p.sku.toLowerCase() === id.toLowerCase()
      );
      if (found) {
        return this.store.products.delete(found.id);
      }
      return false;
    }
    return this.store.products.delete(id);
  }
}
