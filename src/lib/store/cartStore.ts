import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ProductType } from "@/lib/types/domain";

export interface CartItem {
  id: string; // Composite key: `${productId}-${isPartialDeposit ? 'dep' : 'full'}`
  productId: string;
  sku: string;
  name: string;
  type: ProductType;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isPreOrder: boolean;
  isPartialDeposit: boolean;
  depositPercent: number; // e.g. 0.20 or 0.30
  unitDeposit: number; // Rounded CLP deposit
  remainingBalancePerUnit: number; // Rounded CLP remaining balance
  badge?: string;
  imageUrl?: string;
  metadataSummary?: string;
}

export interface CouponDiscount {
  code: string;
  description: string;
  type: "FIXED" | "PERCENT" | "FREE_SHIPPING";
  value: number; // amount in CLP or percent (0.10)
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  isFreeShipping: boolean;
  totalDueToday: number;
  totalDeferredDueLater: number;
  totalNominalOrderValue: number;
  totalItemCount: number;
}

export interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  appliedCoupon: CouponDiscount | null;
  isOpen: boolean;

  // Actions
  addItem: (
    itemParam: Omit<CartItem, "id" | "unitDeposit" | "remainingBalancePerUnit"> & {
      customDepositPercent?: number;
    }
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleDepositMode: (id: string) => void;
  moveToWishlist: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSavedItem: (id: string) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Selectors
  getTotals: () => CartTotals;
}

export const computeItemFinance = (
  unitPrice: number,
  isPartialDeposit: boolean,
  depositPercent: number
): { unitDeposit: number; remainingBalancePerUnit: number } => {
  if (!isPartialDeposit) {
    return {
      unitDeposit: Math.round(unitPrice),
      remainingBalancePerUnit: 0,
    };
  }

  const unitDeposit = Math.round(unitPrice * depositPercent);
  const remainingBalancePerUnit = Math.round(unitPrice - unitDeposit);

  return { unitDeposit, remainingBalancePerUnit };
};

// Available coupons
export const VALID_COUPONS: Record<string, CouponDiscount> = {
  COLECCIONISTA5K: {
    code: "COLECCIONISTA5K",
    description: "Cupón de bienvenida Club del Coleccionista (-$5.000 CLP)",
    type: "FIXED",
    value: 5000,
  },
  CHILE10: {
    code: "CHILE10",
    description: "10% de descuento en tu orden",
    type: "PERCENT",
    value: 0.1,
  },
  MINTFREE: {
    code: "MINTFREE",
    description: "Despacho prioritario 100% Bonificado",
    type: "FREE_SHIPPING",
    value: 0,
  },
};

const memoryStorageMap = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStorageMap.get(key) ?? null;
      }
    }
    return memoryStorageMap.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {}
    }
    memoryStorageMap.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {}
    }
    memoryStorageMap.delete(key);
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      appliedCoupon: null,
      isOpen: false,

      addItem: (itemParam) => {
        const isPartial = Boolean(itemParam.isPreOrder && itemParam.isPartialDeposit);
        const depositPercent = isPartial
          ? itemParam.customDepositPercent ?? itemParam.depositPercent ?? 0.2
          : 1.0;
        const { unitDeposit, remainingBalancePerUnit } = computeItemFinance(
          itemParam.unitPrice,
          isPartial,
          depositPercent
        );

        const id = `${itemParam.productId}-${isPartial ? "dep" : "full"}`;

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === id);

          if (existingIndex > -1) {
            const updated = [...state.items];
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              quantity: existing.quantity + itemParam.quantity,
            };
            return { items: updated, isOpen: true };
          }

          const newItem: CartItem = {
            id,
            productId: itemParam.productId,
            sku: itemParam.sku,
            name: itemParam.name,
            type: itemParam.type,
            quantity: itemParam.quantity,
            unitPrice: Math.round(itemParam.unitPrice),
            unitCost: Math.round(itemParam.unitCost),
            isPreOrder: itemParam.isPreOrder,
            isPartialDeposit: isPartial,
            depositPercent,
            unitDeposit,
            remainingBalancePerUnit,
            badge: itemParam.badge,
            imageUrl: itemParam.imageUrl,
            metadataSummary: itemParam.metadataSummary,
          };

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          };
        });
      },

      toggleDepositMode: (id) => {
        set((state) => {
          const target = state.items.find((i) => i.id === id);
          if (!target || !target.isPreOrder) return state;

          const newIsPartial = !target.isPartialDeposit;
          const newPercent = newIsPartial
            ? target.depositPercent === 1.0
              ? 0.2
              : target.depositPercent
            : 1.0;
          const { unitDeposit, remainingBalancePerUnit } = computeItemFinance(
            target.unitPrice,
            newIsPartial,
            newPercent
          );

          const newId = `${target.productId}-${newIsPartial ? "dep" : "full"}`;
          const otherExists = state.items.find((i) => i.id === newId && i.id !== id);

          if (otherExists) {
            return {
              items: state.items
                .filter((i) => i.id !== id)
                .map((i) =>
                  i.id === newId ? { ...i, quantity: i.quantity + target.quantity } : i
                ),
            };
          }

          return {
            items: state.items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    id: newId,
                    isPartialDeposit: newIsPartial,
                    depositPercent: newPercent,
                    unitDeposit,
                    remainingBalancePerUnit,
                  }
                : item
            ),
          };
        });
      },

      moveToWishlist: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;
          return {
            items: state.items.filter((i) => i.id !== id),
            savedForLater: [
              ...state.savedForLater.filter((i) => i.id !== id),
              item,
            ],
          };
        });
      },

      moveToCart: (id) => {
        set((state) => {
          const item = state.savedForLater.find((i) => i.id === id);
          if (!item) return state;
          return {
            savedForLater: state.savedForLater.filter((i) => i.id !== id),
            items: [...state.items.filter((i) => i.id !== id), item],
          };
        });
      },

      removeSavedItem: (id) => {
        set((state) => ({
          savedForLater: state.savedForLater.filter((item) => item.id !== id),
        }));
      },

      applyCoupon: (codeRaw) => {
        const code = codeRaw.trim().toUpperCase();
        const found = VALID_COUPONS[code];
        if (!found) {
          return {
            success: false,
            message: `El cupón '${code}' no es válido o ha expirado.`,
          };
        }
        set({ appliedCoupon: found });
        return {
          success: true,
          message: `¡Cupón '${found.code}' aplicado correctamente!`,
        };
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      clearCart: () => set({ items: [], appliedCoupon: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotals: () => {
        const { items, appliedCoupon } = get();

        let subtotalDueToday = 0;
        let totalDeferredDueLater = 0;
        let totalNominalOrderValue = 0;
        let totalItemCount = 0;

        for (const item of items) {
          const chargePerUnit = item.isPartialDeposit
            ? item.unitDeposit
            : item.unitPrice;
          subtotalDueToday += chargePerUnit * item.quantity;
          totalDeferredDueLater +=
            (item.isPartialDeposit ? item.remainingBalancePerUnit : 0) * item.quantity;
          totalNominalOrderValue += item.unitPrice * item.quantity;
          totalItemCount += item.quantity;
        }

        // Calculate discount
        let discountAmount = 0;
        if (appliedCoupon) {
          if (appliedCoupon.type === "FIXED") {
            discountAmount = Math.min(subtotalDueToday, appliedCoupon.value);
          } else if (appliedCoupon.type === "PERCENT") {
            discountAmount = Math.round(subtotalDueToday * appliedCoupon.value);
          }
        }

        // Free shipping policy (> $50.000 CLP or coupon)
        const isFreeShipping =
          subtotalDueToday >= 50000 ||
          (appliedCoupon && appliedCoupon.type === "FREE_SHIPPING") ||
          subtotalDueToday === 0;

        const shippingFee = isFreeShipping ? 0 : 4990;
        const totalDueToday = Math.max(
          0,
          Math.round(subtotalDueToday - discountAmount)
        );

        return {
          subtotal: Math.round(subtotalDueToday),
          discountAmount: Math.round(discountAmount),
          shippingFee,
          isFreeShipping,
          totalDueToday,
          totalDeferredDueLater: Math.round(totalDeferredDueLater),
          totalNominalOrderValue: Math.round(totalNominalOrderValue),
          totalItemCount,
        };
      },
    }),
    {
      name: "omnicollector-cart-session",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        items: state.items,
        savedForLater: state.savedForLater,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
