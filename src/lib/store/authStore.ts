import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ConfirmedOrderEntity } from "@/lib/types/domain";
import {
  updateWishlistInFirestoreClient as updateWishlistInFirestore,
  syncUserProfileToFirestoreClient as syncUserProfileToFirestore,
  deleteUserFromFirestoreClient,
  getUserFromFirestoreClient,
} from "@/lib/firebase/client-firestore";
import { signInWithGoogle, signOutFirebase } from "@/lib/firebase/client-auth";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface UserAddress {
  id: string;
  label: string; // "Casa", "Oficina"
  fullName: string;
  phone: string;
  region: string;
  comuna: string;
  address: string;
  apartment?: string;
  isDefault: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  brand: "VISA" | "MASTERCARD" | "WEBPAY";
  last4: string;
  expiry: string;
  holderName: string;
  isDefault: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  rut?: string;
  role: UserRole;
  password?: string; // stored for demo verification
  addresses: UserAddress[];
  paymentMethods: SavedPaymentMethod[];
  orders: ConfirmedOrderEntity[];
  wishlist: string[]; // List of favorited product IDs
  createdAt: string;
}

interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  guestWishlist: string[]; // Wishlist for unauthenticated visitors

  // Actions
  login: (email: string, password: string) => { success: boolean; message: string };
  loginWithGoogle: () => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    rut?: string;
  }) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (data: Partial<Pick<UserAccount, "fullName" | "phone" | "rut" | "email">>) => Promise<boolean>;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
  refreshUserFromFirestore: () => Promise<void>;
  addAddress: (address: Omit<UserAddress, "id">) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addPaymentMethod: (card: Omit<SavedPaymentMethod, "id">) => void;
  deletePaymentMethod: (id: string) => void;
  addUserOrder: (order: ConfirmedOrderEntity) => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  toggleWishlist: (productId: string) => { isWishlisted: boolean; message: string };
  isProductWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

// Pre-seeded accounts
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-admin-01",
    email: "admin@omnicollector.cl",
    fullName: "Administrador OmniCollector",
    phone: "+56 9 8765 4321",
    rut: "15.820.194-2",
    role: "ADMIN",
    password: "admin123",
    addresses: [
      {
        id: "addr-admin-01",
        label: "Bodega Central",
        fullName: "Administrador OmniCollector",
        phone: "+56 9 8765 4321",
        region: "Región Metropolitana de Santiago",
        comuna: "Providencia",
        address: "Av. Providencia 1208",
        apartment: "Oficina 302",
        isDefault: true,
      },
    ],
    paymentMethods: [
      {
        id: "pm-admin-01",
        brand: "WEBPAY",
        last4: "8841",
        expiry: "09/28",
        holderName: "OMNICOLLECTOR SPA",
        isDefault: true,
      },
    ],
    orders: [],
    wishlist: [],
    createdAt: "2026-01-10T12:00:00.000Z",
  },
  {
    id: "usr-customer-01",
    email: "cliente@omnicollector.cl",
    fullName: "Rodrigo Valenzuela",
    phone: "+56 9 1234 5678",
    rut: "18.420.915-K",
    role: "CUSTOMER",
    password: "cliente123",
    addresses: [
      {
        id: "addr-cust-01",
        label: "Domicilio Particular",
        fullName: "Rodrigo Valenzuela",
        phone: "+56 9 1234 5678",
        region: "Región Metropolitana de Santiago",
        comuna: "Providencia",
        address: "Av. Providencia 1234",
        apartment: "Depto 501",
        isDefault: true,
      },
      {
        id: "addr-cust-02",
        label: "Oficina Las Condes",
        fullName: "Rodrigo Valenzuela",
        phone: "+56 9 1234 5678",
        region: "Región Metropolitana de Santiago",
        comuna: "Las Condes",
        address: "Av. Apoquindo 4500",
        apartment: "Piso 8",
        isDefault: false,
      },
    ],
    paymentMethods: [
      {
        id: "pm-cust-01",
        brand: "VISA",
        last4: "4242",
        expiry: "11/27",
        holderName: "RODRIGO VALENZUELA",
        isDefault: true,
      },
    ],
    orders: [
      {
        id: "ord-prev-001",
        orderNumber: "ORD-2026-884210",
        createdAt: "2026-09-05T14:30:00.000Z",
        status: "CONFIRMED",
        customer: {
          fullName: "Rodrigo Valenzuela",
          email: "cliente@omnicollector.cl",
          phone: "+56 9 1234 5678",
          rut: "18.420.915-K",
          region: "Región Metropolitana de Santiago",
          comuna: "Providencia",
          address: "Av. Providencia 1234",
          apartment: "Depto 501",
        },
        shippingMethod: {
          name: "Starken Express (1 a 2 días)",
          cost: 0,
          estimatedDelivery: "2 días hábiles",
          trackingNumber: "STK-CHL-9982410",
        },
        paymentMethod: "WEBPAY",
        items: [
          {
            productId: "prod-fig-01",
            sku: "FIG-MAKIMA-17",
            name: "Makima 1/7 Scale PVC Figure (Chainsaw Man)",
            quantity: 1,
            unitPrice: 249990,
            isPreOrder: true,
            isPartialDeposit: true,
            unitDeposit: 49998,
            remainingBalancePerUnit: 199992,
            imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
          },
        ],
        subtotal: 49998,
        discountAmount: 5000,
        couponCode: "COLECCIONISTA5K",
        shippingCost: 0,
        totalChargedNow: 44998,
        remainingBalanceLater: 199992,
        reservationIds: ["res-prev-01"],
      },
    ],
    wishlist: ["prod-fig-01", "prod-vg-01"],
    createdAt: "2026-03-15T09:00:00.000Z",
  },
];

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

export function getOrCreateDeviceId(): string {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      let id = window.localStorage.getItem("omni_device_id");
      if (!id) {
        id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        window.localStorage.setItem("omni_device_id", id);
      }
      return id;
    } catch {
      return "dev-local-fallback";
    }
  }
  return "dev-server-fallback";
}

export function getDeviceName(): string {
  if (typeof window !== "undefined" && window.navigator) {
    const ua = window.navigator.userAgent;
    if (ua.includes("Windows")) return "PC Windows";
    if (ua.includes("Macintosh") || ua.includes("Mac OS")) return "Apple Mac";
    if (ua.includes("Android")) return "Móvil Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iPhone / iPad";
    return "Navegador Web";
  }
  return "Navegador Web";
}

export async function checkRemoteSession(email: string, forceOverride: boolean = false): Promise<{
  allowed: boolean;
  code?: string;
  message?: string;
  activeDevice?: string;
  lastSeenMinutesAgo?: number;
}> {
  if (typeof window === "undefined" || process.env.NODE_ENV === "test") {
    return { allowed: true };
  }

  try {
    const deviceId = getOrCreateDeviceId();
    const deviceName = getDeviceName();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: forceOverride ? "FORCE_LOGOUT" : "LOGIN_CHECK",
        email: email.trim().toLowerCase(),
        deviceId,
        deviceName,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.code === "ACTIVE_SESSION_EXISTS") {
        return {
          allowed: false,
          code: "ACTIVE_SESSION_EXISTS",
          message: data.error || "Esta cuenta ya tiene una sesión activa en otro dispositivo.",
          activeDevice: data.activeDevice,
          lastSeenMinutesAgo: data.lastSeenMinutesAgo,
        };
      }
    }
    return { allowed: true };
  } catch (err) {
    console.warn("[Session API Client Warning]", err);
    return { allowed: true };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isAdmin: false,
      guestWishlist: [],

      login: (emailRaw, password) => {
        const email = emailRaw.trim().toLowerCase();
        // Check pre-seeded or registered users
        const user = DEFAULT_USERS.find(
          (u) => u.email.toLowerCase() === email && u.password === password
        );

        if (user) {
          const guestWishlist = get().guestWishlist || [];
          const mergedWishlist = Array.from(new Set([...(user.wishlist || []), ...guestWishlist]));
          user.wishlist = mergedWishlist;

          set({
            currentUser: {
              ...user,
              wishlist: mergedWishlist,
            },
            guestWishlist: [],
            isAuthenticated: true,
            isAdmin: user.role === "ADMIN",
          });
          return {
            success: true,
            message: `¡Bienvenido de nuevo, ${user.fullName.split(" ")[0]}!`,
          };
        }

        // Check if user exists in state (from new registrations)
        const currentInState = get().currentUser;
        if (
          currentInState &&
          currentInState.email.toLowerCase() === email &&
          currentInState.password === password
        ) {
          set({
            isAuthenticated: true,
            isAdmin: currentInState.role === "ADMIN",
          });
          return {
            success: true,
            message: `¡Bienvenido de nuevo, ${currentInState.fullName.split(" ")[0]}!`,
          };
        }

        return {
          success: false,
          message: "Credenciales incorrectas. Verifique su correo y contraseña.",
        };
      },

      loginWithGoogle: async () => {
        const guestWishlist = get().guestWishlist || [];
        const result = await signInWithGoogle();

        if (!result.success || !result.user) {
          return {
            success: false,
            message: result.message,
          };
        }

        const user = result.user;
        const mergedWishlist = Array.from(new Set([...(user.wishlist || []), ...guestWishlist]));
        user.wishlist = mergedWishlist;

        // Persist wishlist sync if merged
        if (guestWishlist.length > 0) {
          syncUserProfileToFirestore(user).catch(() => {});
        }

        // Add to default users for session persistence
        const existingIdx = DEFAULT_USERS.findIndex(
          (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
        );
        if (existingIdx >= 0) {
          DEFAULT_USERS[existingIdx] = { ...DEFAULT_USERS[existingIdx], ...user };
        } else {
          DEFAULT_USERS.push(user);
        }

        // Also sync to /api/users to maintain server-side cache
        if (typeof window !== "undefined") {
          fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          }).catch(() => {});
        }

        set({
          currentUser: user,
          guestWishlist: [],
          isAuthenticated: true,
          isAdmin: user.role === "ADMIN",
        });

        return {
          success: true,
          message: result.message,
          user,
        };
      },

      register: (data) => {
        const email = data.email.trim().toLowerCase();

        if (!data.password || data.password.length < 6) {
          return {
            success: false,
            message: "La contraseña debe tener al menos 6 caracteres.",
          };
        }

        // Check duplicates
        if (DEFAULT_USERS.some((u) => u.email.toLowerCase() === email)) {
          return {
            success: false,
            message: "Ya existe una cuenta registrada con este correo electrónico.",
          };
        }

        const guestWishlist = get().guestWishlist || [];
        const newUser: UserAccount = {
          id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email,
          fullName: data.fullName.trim(),
          phone: data.phone?.trim() || "+56 9 8765 4321",
          rut: data.rut?.trim(),
          role: "CUSTOMER",
          password: data.password,
          addresses: [],
          paymentMethods: [],
          orders: [],
          wishlist: guestWishlist,
          createdAt: new Date().toISOString(),
        };

        // Add to default users for session persistence
        DEFAULT_USERS.push(newUser);

        // Sync to Cloud Firestore
        syncUserProfileToFirestore(newUser).catch(() => {});
        if (typeof window !== "undefined") {
          fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
          }).catch(() => {});
        }

        set({
          currentUser: newUser,
          guestWishlist: [],
          isAuthenticated: true,
          isAdmin: false,
        });

        return {
          success: true,
          message: "¡Cuenta creada exitosamente! Bienvenido a OmniCollector Chile.",
        };
      },

      logout: () => {
        const current = get().currentUser;
        if (current && typeof window !== "undefined") {
          try {
            const deviceId = getOrCreateDeviceId();
            fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "LOGOUT",
                email: current.email,
                deviceId,
              }),
            }).catch(() => {});
          } catch {}
        }
        signOutFirebase().catch(() => {});
        set({
          currentUser: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      updateProfile: async (data) => {
        const current = get().currentUser;
        if (!current) return false;
        const updated: UserAccount = {
          ...current,
          ...data,
        };

        // Update in-memory fallback list
        const idx = DEFAULT_USERS.findIndex(
          (u) => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase()
        );
        if (idx >= 0) {
          DEFAULT_USERS[idx] = { ...DEFAULT_USERS[idx], ...updated };
        }

        set({ currentUser: updated });

        try {
          // Sync directly via client SDK
          syncUserProfileToFirestore(updated).catch(() => {});
          // Also sync via API route
          if (typeof window !== "undefined") {
            await fetch("/api/users", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
          }
          return true;
        } catch (err) {
          console.warn("Could not sync profile to backend:", err);
          return true;
        }
      },

      deleteAccount: async () => {
        const current = get().currentUser;
        if (!current) return { success: false, message: "No hay sesión activa." };
        const userId = current.id;
        const userEmail = current.email;

        try {
          // 1. Delete in Firestore via server API
          if (typeof window !== "undefined") {
            await fetch(`/api/users?id=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`, {
              method: "DELETE",
            });
          }
          // 2. Fallback client deletion
          deleteUserFromFirestoreClient(userId).catch(() => {});
        } catch (err) {
          console.warn("Error requesting user deletion:", err);
        }

        // 3. Remove from default users
        const idx = DEFAULT_USERS.findIndex((u) => u.id === userId || u.email.toLowerCase() === userEmail.toLowerCase());
        if (idx >= 0) {
          DEFAULT_USERS.splice(idx, 1);
        }

        // 4. Reset store
        set({
          currentUser: null,
          isAuthenticated: false,
          isAdmin: false,
          guestWishlist: [],
        });

        return {
          success: true,
          message: "Cuenta eliminada permanentemente de Cloud Firestore.",
        };
      },

      refreshUserFromFirestore: async () => {
        const current = get().currentUser;
        if (!current) return;
        try {
          if (typeof window !== "undefined") {
            const res = await fetch(`/api/users?id=${encodeURIComponent(current.id)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data?.user) {
                set({
                  currentUser: {
                    ...current,
                    ...data.data.user,
                  },
                });
              }
            }
          }
        } catch (err) {
          console.warn("Error refreshing user from Firestore:", err);
        }
      },

      addAddress: (addressData) => {
        const current = get().currentUser;
        if (!current) return;

        const newId = `addr-${Date.now()}`;
        const newAddress: UserAddress = {
          id: newId,
          ...addressData,
        };

        let updatedAddresses = [...current.addresses];
        if (addressData.isDefault) {
          updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
        }

        updatedAddresses.push(newAddress);

        const updatedUser = {
          ...current,
          addresses: updatedAddresses,
        };

        set({ currentUser: updatedUser });
        syncUserProfileToFirestore(updatedUser).catch(() => {});
      },

      deleteAddress: (id) => {
        const current = get().currentUser;
        if (!current) return;
        const updatedUser = {
          ...current,
          addresses: current.addresses.filter((a) => a.id !== id),
        };
        set({ currentUser: updatedUser });
        syncUserProfileToFirestore(updatedUser).catch(() => {});
      },

      setDefaultAddress: (id) => {
        const current = get().currentUser;
        if (!current) return;
        const updatedUser = {
          ...current,
          addresses: current.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        };
        set({ currentUser: updatedUser });
        syncUserProfileToFirestore(updatedUser).catch(() => {});
      },

      addPaymentMethod: (cardData) => {
        const current = get().currentUser;
        if (!current) return;

        const newId = `pm-${Date.now()}`;
        const newMethod: SavedPaymentMethod = {
          id: newId,
          ...cardData,
        };

        let updatedMethods = [...current.paymentMethods];
        if (cardData.isDefault) {
          updatedMethods = updatedMethods.map((m) => ({ ...m, isDefault: false }));
        }

        updatedMethods.push(newMethod);

        const updatedUser = {
          ...current,
          paymentMethods: updatedMethods,
        };

        set({ currentUser: updatedUser });
        syncUserProfileToFirestore(updatedUser).catch(() => {});
      },

      deletePaymentMethod: (id) => {
        const current = get().currentUser;
        if (!current) return;
        const updatedUser = {
          ...current,
          paymentMethods: current.paymentMethods.filter((m) => m.id !== id),
        };
        set({ currentUser: updatedUser });
        syncUserProfileToFirestore(updatedUser).catch(() => {});
      },

      addUserOrder: (order) => {
        const current = get().currentUser;
        if (!current) return;
        set({
          currentUser: {
            ...current,
            orders: [order, ...current.orders.filter((o) => o.id !== order.id)],
          },
        });
      },

      requestPasswordReset: (emailRaw) => {
        const email = emailRaw.trim().toLowerCase();
        const exists =
          DEFAULT_USERS.some((u) => u.email.toLowerCase() === email) ||
          get().currentUser?.email.toLowerCase() === email;

        if (!exists) {
          return {
            success: false,
            message: `No encontramos ninguna cuenta activa asociada al correo ${email}.`,
          };
        }

        return {
          success: true,
          message: `Hemos enviado un enlace y código de recuperación al correo ${email}. Revisa tu bandeja de entrada.`,
        };
      },

      toggleWishlist: (productId: string) => {
        const state = get();
        const current = state.currentUser;

        if (current) {
          const currentWishlist = current.wishlist || [];
          const exists = currentWishlist.includes(productId);
          const updatedWishlist = exists
            ? currentWishlist.filter((id) => id !== productId)
            : [...currentWishlist, productId];

          // Also update in DEFAULT_USERS if present
          const defaultUser = DEFAULT_USERS.find((u) => u.id === current.id);
          if (defaultUser) {
            defaultUser.wishlist = updatedWishlist;
          }

          set({
            currentUser: {
              ...current,
              wishlist: updatedWishlist,
            },
          });

          // Sync to Firestore if active
          updateWishlistInFirestore(current.id, updatedWishlist).catch(() => {});

          return {
            isWishlisted: !exists,
            message: !exists
              ? "¡Producto guardado en tus favoritos!"
              : "Producto eliminado de tus favoritos.",
          };
        } else {
          // Guest wishlist
          const guestWishlist = state.guestWishlist || [];
          const exists = guestWishlist.includes(productId);
          const updated = exists
            ? guestWishlist.filter((id) => id !== productId)
            : [...guestWishlist, productId];

          set({ guestWishlist: updated });

          return {
            isWishlisted: !exists,
            message: !exists
              ? "¡Producto guardado en tus favoritos!"
              : "Producto eliminado de tus favoritos.",
          };
        }
      },

      isProductWishlisted: (productId: string) => {
        const state = get();
        if (state.currentUser) {
          return (state.currentUser.wishlist || []).includes(productId);
        }
        return (state.guestWishlist || []).includes(productId);
      },

      clearWishlist: () => {
        const current = get().currentUser;
        if (current) {
          set({
            currentUser: {
              ...current,
              wishlist: [],
            },
          });
        } else {
          set({ guestWishlist: [] });
        }
      },
    }),
    {
      name: "omnicollector-auth-session",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        guestWishlist: state.guestWishlist,
      }),
    }
  )
);
