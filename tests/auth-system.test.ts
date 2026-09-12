import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore, DEFAULT_USERS } from "../src/lib/store/authStore";
import { ConfirmedOrderEntity } from "../src/lib/types/domain";

describe("OmniCollector Account & Authentication System", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  });

  describe("1. Role Differentiation (Customer vs Admin)", () => {
    it("logs in successfully as a regular customer with role CUSTOMER and isAdmin false", () => {
      const store = useAuthStore.getState();
      const res = store.login("cliente@omnicollector.cl", "cliente123");

      expect(res.success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isAdmin).toBe(false);
      expect(state.currentUser?.role).toBe("CUSTOMER");
      expect(state.currentUser?.email).toBe("cliente@omnicollector.cl");
      expect(state.currentUser?.fullName).toBe("Rodrigo Valenzuela");
    });

    it("logs in successfully as an administrator with role ADMIN and isAdmin true", () => {
      const store = useAuthStore.getState();
      const res = store.login("admin@omnicollector.cl", "admin123");

      expect(res.success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isAdmin).toBe(true);
      expect(state.currentUser?.role).toBe("ADMIN");
      expect(state.currentUser?.email).toBe("admin@omnicollector.cl");
      expect(state.currentUser?.fullName).toBe("Administrador OmniCollector");
    });

    it("rejects login with invalid credentials", () => {
      const store = useAuthStore.getState();
      const res = store.login("cliente@omnicollector.cl", "clave_incorrecta");

      expect(res.success).toBe(false);
      expect(res.message).toContain("incorrecta");
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it("logs out and clears authentication status and role flags", () => {
      const store = useAuthStore.getState();
      store.login("admin@omnicollector.cl", "admin123");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      store.logout();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isAdmin).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it("allows Google OAuth simulation as a CUSTOMER", () => {
      const store = useAuthStore.getState();
      const res = store.loginWithGoogle();
      expect(res.success).toBe(true);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isAdmin).toBe(false);
      expect(state.currentUser?.role).toBe("CUSTOMER");
      expect(state.currentUser?.email).toContain("@gmail.com");
    });
  });

  describe("2. User Registration Lifecycle", () => {
    it("registers a new customer successfully with CUSTOMER role", () => {
      const store = useAuthStore.getState();
      const email = `test-nuevo-${Date.now()}@coleccionista.cl`;
      const res = store.register({
        fullName: "Camila Arancibia",
        email,
        password: "passwordSegura2026",
        phone: "+56 9 9876 5432",
        rut: "19.345.678-9",
      });

      expect(res.success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isAdmin).toBe(false);
      expect(state.currentUser?.role).toBe("CUSTOMER");
      expect(state.currentUser?.fullName).toBe("Camila Arancibia");
      expect(state.currentUser?.email).toBe(email);
      expect(state.currentUser?.rut).toBe("19.345.678-9");
    });

    it("prevents registration with duplicate email", () => {
      const store = useAuthStore.getState();
      const res = store.register({
        fullName: "Duplicado",
        email: "cliente@omnicollector.cl",
        password: "password123",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("Ya existe una cuenta");
    });

    it("enforces minimum password length", () => {
      const store = useAuthStore.getState();
      const res = store.register({
        fullName: "Test Corta",
        email: "corta@test.cl",
        password: "123",
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain("al menos 6 caracteres");
    });
  });

  describe("3. Address Book Management (Chilean Addresses)", () => {
    beforeEach(() => {
      useAuthStore.getState().login("cliente@omnicollector.cl", "cliente123");
    });

    it("adds a new shipping address to the user account", () => {
      const store = useAuthStore.getState();
      const initialCount = store.currentUser?.addresses.length || 0;

      store.addAddress({
        label: "Departamento Trabajo",
        fullName: "Sebastián Valenzuela",
        phone: "+56 9 8765 4321",
        region: "Región de Valparaíso",
        comuna: "Viña del Mar",
        address: "Av. Libertad 450",
        apartment: "Oficina 802",
        isDefault: false,
      });

      const updated = useAuthStore.getState().currentUser;
      expect(updated?.addresses.length).toBe(initialCount + 1);
      const added = updated?.addresses.find((a) => a.comuna === "Viña del Mar");
      expect(added).toBeDefined();
      expect(added?.label).toBe("Departamento Trabajo");
      expect(added?.apartment).toBe("Oficina 802");
    });

    it("toggling a new default address marks previous defaults as non-default", () => {
      const store = useAuthStore.getState();
      store.addAddress({
        label: "Casa Playa",
        fullName: "Sebastián Valenzuela",
        phone: "+56 9 8765 4321",
        region: "Región de Valparaíso",
        comuna: "Concón",
        address: "Costa de Montemar 100",
        isDefault: true,
      });

      const addresses = useAuthStore.getState().currentUser?.addresses || [];
      const defaultAddresses = addresses.filter((a) => a.isDefault);
      expect(defaultAddresses.length).toBe(1);
      expect(defaultAddresses[0].label).toBe("Casa Playa");
    });

    it("deletes an address by id", () => {
      const store = useAuthStore.getState();
      const addresses = store.currentUser?.addresses || [];
      expect(addresses.length).toBeGreaterThan(0);
      const targetId = addresses[0].id;

      store.deleteAddress(targetId);

      const updated = useAuthStore.getState().currentUser?.addresses || [];
      expect(updated.some((a) => a.id === targetId)).toBe(false);
    });
  });

  describe("4. Order History and Tracking Linking", () => {
    beforeEach(() => {
      useAuthStore.getState().login("cliente@omnicollector.cl", "cliente123");
    });

    it("links a newly confirmed checkout order to customer order history", () => {
      const store = useAuthStore.getState();
      const initialOrdersCount = store.currentUser?.orders.length || 0;

      const mockOrder: ConfirmedOrderEntity = {
        id: `ord-test-${Date.now()}`,
        orderNumber: "OMNI-2026-9999",
        createdAt: new Date().toISOString(),
        status: "CONFIRMED",
        customer: {
          fullName: "Sebastián Valenzuela",
          email: "cliente@omnicollector.cl",
          phone: "+56 9 8765 4321",
          rut: "18.420.915-K",
          region: "Región Metropolitana de Santiago",
          comuna: "Providencia",
          address: "Av. Pedro de Valdivia 1234",
        },
        shippingMethod: {
          name: "Starken Express",
          cost: 4990,
          estimatedDelivery: "2 días hábiles",
          trackingNumber: "STK-CHL-99887766",
        },
        paymentMethod: "WEBPAY",
        items: [
          {
            productId: "prod-figure-01",
            sku: "FIG-EVA01-001",
            name: "Evangelion Test Type-01 Metal Build",
            price: 289990,
            quantity: 1,
            isPartialDeposit: false,
            chargedAmount: 289990,
            remainingBalance: 0,
          },
        ],
        subtotal: 289990,
        discountAmount: 0,
        shippingCost: 4990,
        totalChargedNow: 294980,
        remainingBalanceLater: 0,
        reservationIds: ["res-test-1"],
      };

      store.addUserOrder(mockOrder);

      const updatedUser = useAuthStore.getState().currentUser;
      expect(updatedUser?.orders.length).toBe(initialOrdersCount + 1);
      const addedOrder = updatedUser?.orders[0];
      expect(addedOrder?.orderNumber).toBe("OMNI-2026-9999");
      expect(addedOrder?.shippingMethod.trackingNumber).toBe("STK-CHL-99887766");
      expect(addedOrder?.totalChargedNow).toBe(294980);
    });
  });

  describe("5. Password Recovery Simulation", () => {
    it("returns instructions for known customer email", () => {
      const store = useAuthStore.getState();
      const res = store.requestPasswordReset("cliente@omnicollector.cl");
      expect(res.success).toBe(true);
      expect(res.message).toContain("código de recuperación");
    });

    it("informs when email is not registered", () => {
      const store = useAuthStore.getState();
      const res = store.requestPasswordReset("noexiste@omnicollector.cl");
      expect(res.success).toBe(false);
      expect(res.message).toContain("No encontramos");
    });
  });
});
