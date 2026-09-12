export type ProductType = "VIDEO_GAME" | "FIGURE" | "COLLECTIBLE" | "BUNDLE";

export type PreOrderState =
  | "ANNOUNCED"
  | "PREORDER_OPEN"
  | "MANUFACTURING"
  | "IN_TRANSIT_CUSTOMS"
  | "WAREHOUSE_RECEIVED"
  | "FULFILLED";

export type GamePlatform = "PS5" | "XBOX_SERIES" | "NINTENDO_SWITCH" | "PC";
export type GameEdition = "STANDARD" | "DELUXE" | "COLLECTORS";

export type FigureScale =
  | "SCALE_1_7"
  | "SCALE_1_4"
  | "SCALE_1_8"
  | "NENDOROID"
  | "POP_UP_PARADE"
  | "ACTION_FIGURE";

export type FigureManufacturer =
  | "GOOD_SMILE_COMPANY"
  | "BANPRESTO"
  | "KOTOBUKIYA"
  | "ALTER"
  | "MEGAHOUSE"
  | "MAX_FACTORY"
  | "BANDAI_SPIRITS";

export type CollectibleCategory = "TCG" | "REPLICA" | "STATUE" | "MEMORABILIA";
export type CollectibleCondition = "GEM_MINT_10" | "MINT_9" | "NEAR_MINT_8" | "EXCELLENT_7";
export type Authenticator = "PSA" | "BGS" | "CGC" | "NONE";

export type PreOrderDepositStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "BALANCE_DUE"
  | "PAID_IN_FULL"
  | "FORFEITED";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED";

export interface GameMetadata {
  id: string;
  productId: string;
  platform: GamePlatform;
  edition: GameEdition;
  isDigital: boolean;
  publisher: string;
  audioLanguages?: string;
  subtitleLanguages?: string;
  players?: string;
  fileSize?: string;
  resolution?: string;
}

export interface FigureMetadata {
  id: string;
  productId: string;
  scale: FigureScale;
  manufacturer: FigureManufacturer;
  estimatedArrivalDate: string; // ISO string
  allowsPartialDeposit: boolean;
  minimumDepositPercent: number; // e.g. 0.20 or 0.30
  material?: string;
  dimensions?: string;
  sculptor?: string;
  boxCondition?: string;
}

export interface CollectibleMetadata {
  id: string;
  productId: string;
  category: CollectibleCategory;
  condition: CollectibleCondition;
  cardLanguage?: string;
  authenticationBody: Authenticator;
  serialNumber?: string;
  gradeScore?: string;
  slabType?: string;
}

export interface BundleItemDefinition {
  componentProductId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  availableStock: number;
}

export interface ProductDomainEntity {
  id: string;
  sku: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  originalPrice?: number;
  costPrice: number;
  stockAvailable: number;
  stockReserved: number;
  isPreOrder: boolean;
  preOrderState?: PreOrderState;
  gameMetadata?: GameMetadata;
  figureMetadata?: FigureMetadata;
  collectibleMetadata?: CollectibleMetadata;
  bundleComponents?: BundleItemDefinition[];
  images?: string[];
  imageUrl?: string;
  trailerUrl?: string;
  ageRating?: string;
  genres?: string[];
  contentGallery?: string[];
  calculatedAvailableStock?: number;
  aggregateMarginPercent?: number;
  nominalSumOfItems?: number;
  bundleDetails?: any;
  createdAt?: string;
}

export interface PreOrderDepositEntity {
  id: string;
  orderId: string;
  productId: string;
  userId: string;
  totalProductPrice: number;
  depositAmountPaid: number;
  remainingBalance: number;
  status: PreOrderDepositStatus;
  dueDate?: string;
  warehouseArrivalNotifiedAt?: string;
}

export interface StockReservationEntity {
  id: string;
  cartSessionId: string;
  productId: string;
  quantity: number;
  expiresAt: string; // ISO string
  status: ReservationStatus;
  createdAt: string;
}

export interface BundleAvailability {
  bundleId: string;
  bundleSku: string;
  bundleName: string;
  bundlePrice: number;
  calculatedAvailableStock: number;
  totalComponentCost: number;
  nominalSumOfItems: number;
  bundleDiscountPercent: number;
  aggregateGrossProfit: number;
  aggregateMarginPercent: number;
  isViable: boolean;
  components: Array<{
    sku: string;
    name: string;
    requiredQtyPerBundle: number;
    currentAvailableStock: number;
    maxBundlesSupported: number;
    unitCost: number;
  }>;
}

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
  isPartialDeposit?: boolean;
}

export interface ShippingAddressInfo {
  fullName: string;
  email: string;
  phone: string;
  rut?: string;
  region: string;
  comuna: string;
  address: string;
  apartment?: string;
  notes?: string;
}

export interface ConfirmedOrderEntity {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt?: string;
  status: "CONFIRMED" | "PAID" | "PENDING" | "PREPARING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  customer: ShippingAddressInfo;
  shippingMethod: {
    name: string;
    cost: number;
    estimatedDelivery: string;
    trackingNumber: string;
  };
  paymentMethod: string;
  paymentId?: string;
  paymentStatus?: string;
  adminNotes?: string;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    isPreOrder: boolean;
    isPartialDeposit: boolean;
    unitDeposit: number;
    remainingBalancePerUnit: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingCost: number;
  totalChargedNow: number;
  remainingBalanceLater: number;
  reservationIds: string[];
  balancePaid?: boolean;
  balancePaidAt?: string;
  balancePaymentTransactionId?: string;
  preOrderWarehouseArrivalNotified?: boolean;
  preOrderWarehouseNotifiedAt?: string;
  deliveredAt?: string;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  totalAmountChargedNow: number;
  remainingBalanceLater: number;
  reservationIds: string[];
  expiresAt: string;
  trackingNumber?: string;
  order?: ConfirmedOrderEntity;
}
