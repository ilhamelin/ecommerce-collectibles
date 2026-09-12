import { MemoryTransactionalStore } from "../db/memory-db";
import { BundleAvailability, ProductDomainEntity } from "../types/domain";
import { InsufficientStockError, NotFoundError, ValidationError } from "../errors/DomainErrors";

export class BundleService {
  private store: MemoryTransactionalStore;

  constructor(store: MemoryTransactionalStore = MemoryTransactionalStore.getInstance()) {
    this.store = store;
  }

  /**
   * Evaluates the availability, atomic component stock constraints, and real-time aggregate margin
   * of a composite bundle product in O(n) time complexity.
   */
  public getBundleAvailability(bundleIdOrSku: string): BundleAvailability {
    const bundle = Array.from(this.store.products.values()).find(
      (p) => p.id === bundleIdOrSku || p.sku === bundleIdOrSku
    );

    if (!bundle) {
      throw new NotFoundError(`Bundle with identifier '${bundleIdOrSku}' not found.`);
    }

    if (bundle.type !== "BUNDLE" || !bundle.bundleComponents || bundle.bundleComponents.length === 0) {
      throw new ValidationError(`Product '${bundle.sku}' is not configured as a composite bundle.`);
    }

    let nominalSumOfItems = 0;
    let totalComponentCost = 0;
    let minBundleStock = Number.MAX_SAFE_INTEGER;

    const analyzedComponents = bundle.bundleComponents.map((componentDef) => {
      const realComponent = this.store.products.get(componentDef.componentProductId);
      if (!realComponent) {
        throw new NotFoundError(`Atomic component '${componentDef.componentProductId}' does not exist in inventory.`);
      }

      const effectiveAvailable = Math.max(0, realComponent.stockAvailable - realComponent.stockReserved);
      const bundlesSupported = Math.floor(effectiveAvailable / componentDef.quantity);

      if (bundlesSupported < minBundleStock) {
        minBundleStock = bundlesSupported;
      }

      const itemCost = realComponent.costPrice * componentDef.quantity;
      const itemPrice = realComponent.price * componentDef.quantity;

      totalComponentCost += itemCost;
      nominalSumOfItems += itemPrice;

      return {
        sku: realComponent.sku,
        name: realComponent.name,
        requiredQtyPerBundle: componentDef.quantity,
        currentAvailableStock: effectiveAvailable,
        maxBundlesSupported: bundlesSupported,
        unitCost: realComponent.costPrice,
      };
    });

    const calculatedAvailableStock = minBundleStock === Number.MAX_SAFE_INTEGER ? 0 : minBundleStock;

    // Financial Metrics
    const bundlePrice = bundle.price;
    const discountAmount = Math.max(0, nominalSumOfItems - bundlePrice);
    const bundleDiscountPercent = nominalSumOfItems > 0 ? (discountAmount / nominalSumOfItems) * 100 : 0;
    const aggregateGrossProfit = bundlePrice - totalComponentCost;
    const aggregateMarginPercent = bundlePrice > 0 ? (aggregateGrossProfit / bundlePrice) * 100 : 0;

    return {
      bundleId: bundle.id,
      bundleSku: bundle.sku,
      bundleName: bundle.name,
      bundlePrice,
      calculatedAvailableStock,
      totalComponentCost,
      nominalSumOfItems,
      bundleDiscountPercent: Number(bundleDiscountPercent.toFixed(2)),
      aggregateGrossProfit: Number(aggregateGrossProfit.toFixed(2)),
      aggregateMarginPercent: Number(aggregateMarginPercent.toFixed(2)),
      isViable: aggregateGrossProfit > 0 && calculatedAvailableStock > 0,
      components: analyzedComponents,
    };
  }

  /**
   * Atomically validates stock across ALL bundle components before reservation.
   * Throws InsufficientStockError if any single SKU fails the requirement.
   */
  public validateBundleStock(bundle: ProductDomainEntity, requestedQuantity: number): void {
    if (!bundle.bundleComponents || bundle.bundleComponents.length === 0) {
      throw new ValidationError(`Bundle ${bundle.sku} has no component configuration.`);
    }

    for (const component of bundle.bundleComponents) {
      const realProduct = this.store.products.get(component.componentProductId);
      if (!realProduct) {
        throw new NotFoundError(`Component product '${component.componentProductId}' not found.`);
      }

      const requiredForOrder = component.quantity * requestedQuantity;
      const freeStock = realProduct.stockAvailable - realProduct.stockReserved;

      if (freeStock < requiredForOrder) {
        throw new InsufficientStockError(
          `Cannot assemble bundle '${bundle.name}': Component '${realProduct.name}' (${realProduct.sku}) has only ${freeStock} available units, but ${requiredForOrder} are required.`,
          {
            sku: bundle.sku,
            componentSku: realProduct.sku,
            requested: requiredForOrder,
            available: freeStock,
          }
        );
      }
    }
  }

  /**
   * Simulates adjusting a bundle's price dynamically to test margin compensation
   */
  public simulateParametricDiscount(
    bundleId: string,
    discountPercent: number
  ): { simulatedPrice: number; newGrossProfit: number; newMarginPercent: number; isViable: boolean } {
    const analysis = this.getBundleAvailability(bundleId);
    const simulatedPrice = analysis.nominalSumOfItems * (1 - discountPercent / 100);
    const newGrossProfit = simulatedPrice - analysis.totalComponentCost;
    const newMarginPercent = (newGrossProfit / simulatedPrice) * 100;

    return {
      simulatedPrice: Number(simulatedPrice.toFixed(2)),
      newGrossProfit: Number(newGrossProfit.toFixed(2)),
      newMarginPercent: Number(newMarginPercent.toFixed(2)),
      isViable: newGrossProfit > 0,
    };
  }
}
