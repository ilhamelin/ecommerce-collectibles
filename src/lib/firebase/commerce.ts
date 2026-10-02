import { doc, runTransaction } from "firebase/firestore";
import { adminDb } from "./admin";
import { db, isFirebaseConfigured } from "./config";
import { ConfirmedOrderEntity } from "../types/domain";
import { IdempotencyConflictError, InsufficientStockError, NotFoundError, ValidationError } from "../errors/DomainErrors";

export interface CommerceTransaction {
  read(path: string): Promise<Record<string, unknown> | null>;
  update(path: string, data: Record<string, unknown>): void;
  set(path: string, data: Record<string, unknown>): void;
  delete(path: string): void;
}

/** Adapt both existing SDKs without mixing reads and writes inside a transaction. */
async function withCommerceTransaction<T>(operation: (transaction: CommerceTransaction) => Promise<T>): Promise<T | undefined> {
  if (adminDb) {
    const database = adminDb;
    return database.runTransaction(async (transaction) => operation({
      read: async (path) => { const snapshot = await transaction.get(database.doc(path)); return snapshot.exists ? snapshot.data() || null : null; },
      delete: (path) => { transaction.delete(database.doc(path)); },
      update: (path, data) => { transaction.update(database.doc(path), data); },
      set: (path, data) => { transaction.set(database.doc(path), data); },
    }));
  }
  if (db && isFirebaseConfigured()) {
    const database = db;
    return runTransaction(database, async (transaction) => operation({
      read: async (path) => { const snapshot = await transaction.get(doc(database, path)); return snapshot.exists() ? snapshot.data() : null; },
      delete: (path) => { transaction.delete(doc(database, path)); },
      update: (path, data) => { transaction.update(doc(database, path), data); },
      set: (path, data) => { transaction.set(doc(database, path), data); },
    }));
  }
  if (isFirebaseConfigured()) throw new Error("La conexión a Firestore no está disponible.");
  return undefined; // Explicit local portfolio mode.
}

/** Read the complete bundle graph and aggregate quantities before scheduling any write. */
export async function planStockChanges(transaction: CommerceTransaction, items: { productId: string; quantity: number }[], direction: -1 | 1) {
  const documents = new Map<string, Record<string, unknown>>();
  const quantities = new Map<string, number>();
  const expand = async (productId: string, quantity: number, ancestors: Set<string>): Promise<void> => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || typeof productId !== "string" || !productId || productId.includes("/")) {
      throw new ValidationError("Producto o cantidad de inventario inválidos.");
    }
    if (ancestors.has(productId)) throw new Error("El bundle contiene una referencia circular.");
    let product = documents.get(productId);
    if (!product) {
      product = await transaction.read(`products/${productId}`) || undefined;
      if (!product) throw new NotFoundError(`Producto '${productId}' no encontrado en Firestore.`);
      documents.set(productId, product);
    }
    if (product.type === "BUNDLE") {
      const components = product.bundleComponents;
      if (!Array.isArray(components) || !components.length) throw new Error("Bundle sin componentes.");
      const chain = new Set(ancestors).add(productId);
      for (const component of components as { componentProductId: string; quantity: number }[]) {
        await expand(component.componentProductId, component.quantity * quantity, chain);
      }
    } else {
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }
  };
  for (const item of items) await expand(item.productId, item.quantity, new Set());
  return Array.from(quantities, ([productId, quantity]) => {
    const product = documents.get(productId)!;
    const stock = product.stockAvailable ?? product.stock;
    if (typeof stock !== "number" || !Number.isSafeInteger(stock) || stock < 0) throw new Error("Stock almacenado inválido.");
    const next = stock + direction * quantity;
    if (!Number.isSafeInteger(next) || next < 0) throw new InsufficientStockError(`Stock insuficiente para '${productId}'.`);
    return { path: `products/${productId}`, data: {
      stockAvailable: next,
      ...(product.stock !== undefined ? { stock: next } : {}),
      updatedAt: new Date().toISOString(),
    } };
  });
}

export async function changePersistedStock(items: { productId: string; quantity: number }[], direction: -1 | 1): Promise<void> {
  await withCommerceTransaction(async (transaction) => {
    const changes = await planStockChanges(transaction, items, direction);
    for (const change of changes) transaction.update(change.path, change.data);
  });
}

/** Persist one order and its stock movement atomically; order ID identifies retries across instances. */
export async function commitOrderTransaction(transaction: CommerceTransaction, order: ConfirmedOrderEntity): Promise<ConfirmedOrderEntity> {
  const path = `orders/${order.id}`;
  const existing = await transaction.read(path);
  if (existing) {
    if (existing.checkoutRequestHash !== order.checkoutRequestHash) throw new IdempotencyConflictError(order.id);
    return existing as unknown as ConfirmedOrderEntity;
  }
  const changes = await planStockChanges(transaction, order.items, -1);
  const committed = { ...order, stockDeducted: true };
  const clean: Record<string, unknown> = JSON.parse(JSON.stringify(committed));
  for (const change of changes) transaction.update(change.path, change.data);
  transaction.set(path, clean);
  return committed;
}

export async function commitOrderAndStock(order: ConfirmedOrderEntity): Promise<ConfirmedOrderEntity> {
  return await withCommerceTransaction((transaction) => commitOrderTransaction(transaction, order)) || { ...order, stockDeducted: true };
}

/** Cancel/delete and return inventory in the same transaction, at most once. */
export async function cancelOrderTransaction(transaction: CommerceTransaction, orderId: string, remove = false, updates: Record<string, unknown> = {}): Promise<void> {
  const path = `orders/${orderId}`;
  const order = await transaction.read(path);
  if (!order) return;
  const changes = order.stockDeducted === true
    ? await planStockChanges(transaction, (order as unknown as ConfirmedOrderEntity).items, 1) : [];
  for (const change of changes) transaction.update(change.path, change.data);
  if (remove) transaction.delete(path);
  else transaction.update(path, { ...updates, status: "CANCELLED", stockDeducted: false, updatedAt: new Date().toISOString() });
}

export async function cancelOrderAndRestoreStock(orderId: string, remove = false, updates: Record<string, unknown> = {}): Promise<void> {
  await withCommerceTransaction((transaction) => cancelOrderTransaction(transaction, orderId, remove, updates));
}
