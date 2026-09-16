import { z } from "zod";

export const ProductTypeEnum = z.enum(["VIDEO_GAME", "FIGURE", "COLLECTIBLE", "BUNDLE", "CONSOLE", "HARDWARE", "OTHER"]).or(z.string());
export const PreOrderStateEnum = z.enum([
  "ANNOUNCED",
  "PREORDER_OPEN",
  "MANUFACTURING",
  "IN_TRANSIT_CUSTOMS",
  "WAREHOUSE_RECEIVED",
  "FULFILLED",
]);

export const GamePlatformEnum = z.enum(["PS5", "XBOX_SERIES", "NINTENDO_SWITCH", "PC"]);
export const GameEditionEnum = z.enum(["STANDARD", "DELUXE", "COLLECTORS"]);

export const FigureScaleEnum = z.enum([
  "SCALE_1_7",
  "SCALE_1_4",
  "SCALE_1_6",
  "SCALE_1_8",
  "SCALE_1_12",
  "NON_SCALE",
  "NENDOROID",
  "POP_UP_PARADE",
  "ACTION_FIGURE",
]);
export const FigureManufacturerEnum = z.enum([
  "GOOD_SMILE_COMPANY",
  "BANPRESTO",
  "BANDAI_SPIRITS",
  "KOTOBUKIYA",
  "ALTER",
  "MEGAHOUSE",
  "MAX_FACTORY",
  "FREEING",
  "ANIPLEX",
  "SEGA",
  "TAITO",
  "FURYU",
  "OTHER",
]);

export const CollectibleCategoryEnum = z.enum(["TCG", "REPLICA", "STATUE", "MEMORABILIA"]);
export const CollectibleConditionEnum = z.enum(["GEM_MINT_10", "MINT_9", "NEAR_MINT_8", "EXCELLENT_7"]);
export const AuthenticatorEnum = z.enum(["PSA", "BGS", "CGC", "NONE"]);

// Bundle Component Schema
export const BundleComponentSchema = z.object({
  componentProductId: z.string().min(1, "Component product ID is required"),
  quantity: z.number().int().positive("Component quantity must be at least 1"),
});

export const CreateBundleSchema = z.object({
  sku: z.string().min(3).regex(/^[A-Z0-9_-]+$/, "SKU must contain only uppercase letters, numbers, dashes and underscores"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Bundle price must be positive"),
  components: z.array(BundleComponentSchema).min(2, "A bundle must contain at least 2 distinct components"),
  customDiscountPercent: z.number().min(0).max(80).optional(),
});

// Checkout item schema with discriminated partial deposit flag
export const CheckoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  isPartialDeposit: z.boolean().default(false),
  customDepositPercent: z.number().min(0.1).max(0.99).optional(),
});

export const CheckoutCustomerSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  rut: z.string().optional(),
});

export const CheckoutShippingAddressSchema = z.object({
  region: z.string().min(1, "Región requerida"),
  comuna: z.string().min(1, "Comuna requerida"),
  address: z.string().min(3, "Dirección requerida"),
  apartment: z.string().optional(),
  notes: z.string().optional(),
});

export const CheckoutShippingMethodSchema = z.object({
  carrier: z.string().default("STARKEN"),
  name: z.string().default("Starken Express"),
  cost: z.number().min(0).default(0),
});

export const CheckoutRequestSchema = z.object({
  cartSessionId: z.string().uuid("Invalid cart session ID format").or(z.string().min(5)),
  userId: z.string().min(1, "User ID is required"),
  items: z.array(CheckoutItemSchema).min(1, "At least one item is required for checkout"),
  idempotencyKey: z.string().min(8, "Idempotency-Key must be at least 8 characters"),
  paymentMethod: z.enum(["STRIPE", "MERCADO_PAGO", "WEBPAY", "BANK_TRANSFER"]),
  customerInfo: CheckoutCustomerSchema.optional(),
  shippingAddress: CheckoutShippingAddressSchema.optional(),
  shippingMethod: CheckoutShippingMethodSchema.optional(),
  couponCode: z.string().optional(),
});

export const PreOrderTransitionSchema = z.object({
  productId: z.string().min(1),
  newState: PreOrderStateEnum,
  notes: z.string().optional(),
});

export const PaymentWebhookPayloadSchema = z.object({
  provider: z.enum(["STRIPE", "MERCADO_PAGO", "WEBPAY"]),
  eventId: z.string().min(1),
  transactionId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.number().positive(),
  status: z.enum(["succeeded", "failed", "pending"]),
  timestamp: z.number().or(z.string()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CreateProductSchema = z.object({
  sku: z
    .string()
    .min(3, "El SKU debe tener al menos 3 caracteres")
    .regex(/^[A-Za-z0-9_-]+$/, "El SKU solo puede contener letras, números, guiones y guiones bajos")
    .transform((val) => val.toUpperCase().trim()),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  type: ProductTypeEnum,
  price: z.number().int().positive("El precio debe ser un número entero mayor a 0 CLP"),
  originalPrice: z.number().int().min(0).optional(),
  costPrice: z.number().int().min(0, "El costo debe ser un número entero mayor o igual a 0 CLP"),
  stockAvailable: z.number().int().min(0, "El stock no puede ser negativo"),
  isPreOrder: z.boolean().default(false),
  preOrderState: PreOrderStateEnum.optional(),
  trailerUrl: z.string().optional(),
  ageRating: z.string().optional(),
  genres: z.array(z.string()).optional(),
  contentGallery: z.array(z.string()).optional(),
  gameMetadata: z
    .object({
      platform: GamePlatformEnum.or(z.string()),
      edition: GameEditionEnum.or(z.string()),
      isDigital: z.boolean().default(false),
      publisher: z.string().min(1, "La distribuidora es requerida").or(z.string().optional()),
      audioLanguages: z.string().optional(),
      subtitleLanguages: z.string().optional(),
      players: z.string().optional(),
      fileSize: z.string().optional(),
      resolution: z.string().optional(),
      gameType: z.enum(["CONSOLE", "PC"]).optional(),
      title: z.string().optional(),
      developer: z.string().optional(),
      releaseYear: z.string().optional(),
      genre: z.string().optional(),
      gameModes: z.string().optional(),
      gameEngine: z.string().optional(),
      supportedPlatforms: z.string().optional(),
      ageRating: z.string().optional(),
      displayModes: z.string().optional(),
      xboxSeriesSOptimization: z.string().optional(),
      hardwareFeatures: z.string().optional(),
      pcOs: z.string().optional(),
      pcProcessor: z.string().optional(),
      pcRam: z.string().optional(),
      pcGpu: z.string().optional(),
      pcStorage: z.string().optional(),
    })
    .optional(),
  figureMetadata: z
    .object({
      scale: FigureScaleEnum,
      manufacturer: FigureManufacturerEnum,
      estimatedArrivalDate: z.string().optional().or(z.literal("")).default("Inmediata"),
      allowsPartialDeposit: z.boolean().default(true),
      minimumDepositPercent: z.number().min(0.05).max(1.0).default(0.2),
      material: z.string().optional(),
      dimensions: z.string().optional(),
      sculptor: z.string().optional(),
      boxCondition: z.string().optional(),
    })
    .optional(),
  collectibleMetadata: z
    .object({
      category: CollectibleCategoryEnum,
      condition: CollectibleConditionEnum,
      cardLanguage: z.string().optional(),
      authenticationBody: AuthenticatorEnum,
      serialNumber: z.string().optional(),
      gradeScore: z.string().optional(),
      slabType: z.string().optional(),
    })
    .optional(),
  bundleComponents: z
    .array(
      z.object({
        componentProductId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
  images: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  customCategoryLabel: z.string().optional(),
  customSpecifications: z.record(z.any()).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().min(1, "El ID del producto es requerido para actualizar"),
});

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;
export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;
export type CreateBundleDTO = z.infer<typeof CreateBundleSchema>;
export type CheckoutItemDTO = z.infer<typeof CheckoutItemSchema>;
export type CheckoutRequestDTO = z.infer<typeof CheckoutRequestSchema>;
export type PreOrderTransitionDTO = z.infer<typeof PreOrderTransitionSchema>;
export type PaymentWebhookPayloadDTO = z.infer<typeof PaymentWebhookPayloadSchema>;

