export type ProductType = "VIDEO_GAME" | "FIGURE" | "COLLECTIBLE" | "BUNDLE" | "CONSOLE" | "HARDWARE" | "OTHER" | (string & {});

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
  | "SCALE_1_6"
  | "SCALE_1_8"
  | "SCALE_1_12"
  | "NON_SCALE"
  | "NENDOROID"
  | "POP_UP_PARADE"
  | "ACTION_FIGURE";

export type FigureManufacturer =
  | "GOOD_SMILE_COMPANY"
  | "BANPRESTO"
  | "BANDAI_SPIRITS"
  | "KOTOBUKIYA"
  | "ALTER"
  | "MEGAHOUSE"
  | "MAX_FACTORY"
  | "FREEING"
  | "ANIPLEX"
  | "SEGA"
  | "TAITO"
  | "FURYU"
  | "OTHER";

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

export type VideoGameType = "CONSOLE" | "PC";

export interface GameMetadata {
  id: string;
  productId: string;
  platform: GamePlatform | string;
  edition: GameEdition | string;
  isDigital: boolean;
  publisher?: string;
  audioLanguages?: string;
  subtitleLanguages?: string;
  players?: string;
  fileSize?: string;
  resolution?: string;
  gameType?: VideoGameType;
  // Información General
  title?: string;
  developer?: string;
  releaseYear?: string;
  genre?: string;
  gameModes?: string;
  // Aspectos de Software y Desarrollo
  gameEngine?: string;
  supportedPlatforms?: string;
  ageRating?: string;
  // Rendimiento en Consola
  displayModes?: string;
  xboxSeriesSOptimization?: string;
  hardwareFeatures?: string;
  // Requisitos de Hardware para PC
  pcOs?: string;
  pcProcessor?: string;
  pcRam?: string;
  pcGpu?: string;
  pcStorage?: string;
}

export interface FigureMetadata {
  id: string;
  productId: string;
  scale: FigureScale | string;
  manufacturer: FigureManufacturer | string;
  estimatedArrivalDate?: string; // ISO string
  allowsPartialDeposit: boolean;
  minimumDepositPercent: number; // e.g. 0.20 or 0.30
  material?: string;
  dimensions?: string;
  sculptor?: string;
  boxCondition?: string;

  // Información General del Producto
  productName?: string;
  franchise?: string;
  productLine?: string;
  releaseDate?: string;
  licenseStatus?: string;

  // Especificaciones Físicas y Dimensiones
  height?: string;
  width?: string;
  weight?: string;
  base?: string;

  // Materiales y Fabricación
  materials?: string;
  paintTechnique?: string;
  articulation?: string;

  // Contenido de la Caja y Accesorio
  interchangeableParts?: string;
  accessories?: string;
  certificate?: string;

  // Seguridad y Logística
  ageRecommendation?: string;
  boxDimensions?: string;
  shippingWeight?: string;
}

export interface CollectibleMetadata {
  id: string;
  productId: string;
  category: CollectibleCategory | string;
  condition: CollectibleCondition | string;
  cardLanguage?: string;
  authenticationBody?: Authenticator | string;
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
  customCategoryLabel?: string;
  customSpecifications?: CustomCategorySpecifications;
  authenticityPassport?: DigitalAuthenticityPassport;
  marketPriceGuide?: TcgMarketPriceGuide;
}

export interface ProvenanceMilestone {
  stepNumber: number;
  title: string;
  timestamp: string;
  actor: string;
  location: string;
  description: string;
  status: "VERIFIED" | "PENDING";
  verificationProofHash: string;
}

export interface DigitalAuthenticityPassport {
  passportId: string;
  verificationHash: string;
  issuedAt: string;
  issuer: string;
  antiBootlegScore: number;
  batchSerialNumber: string;
  originCountry: string;
  manufacturerOrPublisher: string;
  provenanceMilestones: ProvenanceMilestone[];
  tamperProofQrUrl: string;
  nfcTagUid?: string;
  mintBoxWarranty: string;
}

export interface TcgPriceHistoryPoint {
  date: string;
  label: string;
  priceClp: number;
  volume: number;
}

export interface TcgGradeComparison {
  grade: string;
  label: string;
  estimatedPriceClp: number;
  isCurrentItem: boolean;
  multiplierVsRaw: number;
}

export interface TcgBenchmarkSale {
  date: string;
  platform: string;
  grade: string;
  priceClp: number;
  verified: boolean;
}

export interface TcgMarketPriceGuide {
  estimatedFmvClp: number;
  estimatedFmvUsd: number;
  change30dPercent: number;
  change90dPercent: number;
  change1yPercent: number;
  liquidityRating: "ALTA" | "MEDIA" | "EXTREMA";
  priceHistory: TcgPriceHistoryPoint[];
  gradesComparison: TcgGradeComparison[];
  recentBenchmarkSales: TcgBenchmarkSale[];
  lastUpdated: string;
}

export interface ConsoleSpecifications {
  baseModel: string;
  capacity: string;
  format: string;
  controllersIncluded: string;
  bundleIncluded?: string;
  ports: string;
  gameCompatibility: string;
  featuredHighlights: string;
}

export interface MouseSpecifications {
  brand: string;
  tracking: string;
  buttonCount: string | number;
  maxDpi: string | number;
  wiring: string;
  weight: string;
  dimensions?: string;
  adjustableDpi?: string;
  color?: string;
  pollingRate?: string;
  adjustableWeight?: string;
  handedness?: string;
  technology?: string;
  lighting?: string;
  powerSource?: string;
}

export interface KeyboardSpecifications {
  brand: string;
  partNumber?: string;
  type: string;
  category: string;
  backlight?: string;
  switchType?: string;
  wiring?: string;
  connectionTechnology?: string;
  macroKeys?: string;
  hasWristRest?: string;
  hasMediaKeys?: string;
}

export interface HeadsetSpecifications {
  type: string;
  microphone?: string;
  frequencyResponse?: string;
  color?: string;
  lighting?: string;
  connectivity?: string;
  activeNoiseCancelling?: string;
  inLineControls?: string;
  driverSize?: string;
  impedance?: string;
  cableLength?: string;
}

export interface ControllerSpecifications {
  // Especificaciones Básicas
  brand: string;
  platformCompatibility: string;
  connectionType: string;
  feedbackHaptic?: string;
  weight?: string;
  color?: string;
  layout?: string;
  // Especificaciones Avanzadas
  batteryLife?: string;
  rechargeableBattery?: string;
  programmableBackPaddles?: string;
  triggerStops?: string;
  audioJack?: string;
  hallEffectSticks?: string;
  lighting?: string;
  softwareCustomization?: string;
}

export interface GamingAccessorySpecifications {
  accessoryType: "MOUSE" | "KEYBOARD" | "HEADSET" | "CONTROLLER" | string;
  mouse?: MouseSpecifications;
  keyboard?: KeyboardSpecifications;
  headset?: HeadsetSpecifications;
  controller?: ControllerSpecifications;
}

export interface ApparelSpecifications {
  size?: string;
  gender?: string;
  material?: string;
  apparelType?: string;
  careInstructions?: string;
  license?: string;
}

export interface BookSpecifications {
  publisher?: string;
  language?: string;
  pages?: number | string;
  binding?: string;
  dimensions?: string;
  hasColorPages?: string;
  isbn?: string;
}

export interface MerchSpecifications {
  itemType?: string;
  material?: string;
  dimensions?: string;
  franchise?: string;
}

export interface AudioSpecifications {
  format?: string;
  discCount?: number | string;
  recordLabel?: string;
  includesArtbook?: string;
  featuredTracks?: string;
}

// ==========================================
// HARDWARE SUB-TYPES SPECIFICATIONS
// ==========================================

export interface GpuSpecifications {
  // Básicas
  manufacturer: string; // Fabricante (ej. ASUS, MSI, Gigabyte, EVGA)
  gpu: string; // GPU (ej. NVIDIA GeForce RTX 5070 / AMD Radeon RX 7800 XT)
  memory: string; // Memoria (ej. 12 GB GDDR6 / 16 GB GDDR6X)
  bus: string; // Bus (ej. 192-bit / 256-bit)
  coreClocks: string; // Frecuencias core (base / boost / OC) (ej. Base 2160 MHz / Boost 2550 MHz)
  memoryClock: string; // Frecuencia memorias (ej. 21 Gbps / 2000 MHz)
  // Avanzadas
  coreName?: string; // Núcleo (ej. GB205 / AD104)
  profile?: string; // Perfil (ej. Estándar / Low Profile)
  cooling?: string; // Refrigeración (ej. Dual Fan / Triple Fan / Waterblock)
  slots?: string; // Slots (ej. 2 Slots / 2.5 Slots / 3 Slots)
  length?: string; // Largo (ej. 242 mm / 300 mm)
  lighting?: string; // Iluminación (ej. ARGB Aura Sync / Mystic Light / Sin RGB)
  hasBackplate?: string; // ¿Backplate? (ej. Sí, de aluminio reforzado)
  powerConnectors?: string; // Conectores de poder (ej. 1x 16-pin 12V-2x6 / 2x 8-pin)
  videoPorts?: string; // Puertos de video (ej. 3x DisplayPort 1.4a, 1x HDMI 2.1a)
}

export interface CpuSpecifications {
  // Básicas
  frequency: string; // Frecuencia (ej. 3.8 GHz)
  turboFrequency: string; // Frecuencia turbo máxima (ej. 5.4 GHz)
  coresThreads: string; // Núcleos / hilos (ej. 8 núcleos / 16 hilos)
  cache: string; // Caché (ej. 32 MB L3 + 8 MB L2)
  socket: string; // Socket (ej. AM5 / LGA1700 / LGA1851)
  // Avanzadas
  coreName?: string; // Núcleo (ej. Zen 4 / Raptor Lake Refresh)
  manufacturingProcess?: string; // Proceso de manufactura (ej. 5 nm TSMC / Intel 7)
  tdp?: string; // TDP (ej. 65W / 125W / 170W)
  cooler?: string; // Cooler (ej. Incluido Wraith Stealth / No incluido)
  integratedGraphics?: string; // Gráficos integrados (ej. AMD Radeon Graphics 2 CUs / Intel UHD 770 / No posee)
}

export interface MotherboardSpecifications {
  // Básicas
  manufacturer: string; // Fabricante (ej. ASUS ROG / MSI / Gigabyte / ASRock)
  socket: string; // Socket (ej. Socket AM5 / LGA1700)
  chipset: string; // Chipset (ej. AMD B650 / Intel Z790)
  memorySlots: string; // Slots memorias (ej. 4x DDR5 DIMM)
  memoryChannels: string; // Canales memoria (ej. Dual Channel)
  format: string; // Formato (ej. ATX / Micro-ATX / Mini-ITX)
  rgbSupport?: string; // Soporte RGB (ej. ARGB Gen 2 + Aura Sync)
  videoPorts?: string; // Puertos de video (ej. 1x HDMI 2.1, 1x DisplayPort 1.4)
  powerPorts?: string; // Puertos de energía (ej. 1x 24-pin ATX, 2x 8-pin EPS 12V)
  // Avanzadas
  sliSupport?: string; // Soporte SLI (ej. No compatible)
  crossfireSupport?: string; // Soporte CrossFire (ej. Sí / No)
  raidSupport?: string; // Soporte RAID (ej. RAID 0, 1, 10 para NVMe)
  connectors?: string; // Conectores (ej. 4x SATA III, 3x M.2 PCIe 5.0/4.0)
  ports?: string; // Puertos (ej. 1x USB 3.2 Gen 2x2 Type-C, 4x USB 3.2 Gen 2)
  expansions?: string; // Expansiones (ej. 1x PCIe 5.0 x16, 2x PCIe 4.0 x1)
}

export interface RamSpecifications {
  // Básicas
  capacity: string; // Capacidad (ej. 32 GB (2x16GB))
  type: string; // Tipo (ej. DDR5 / DDR4)
  speed: string; // Velocidad (ej. 6000 MT/s / 3600 MHz)
  format: string; // Formato (ej. DIMM de 288 pines / SO-DIMM)
  // Avanzadas
  voltage?: string; // Voltaje (ej. 1.35 V)
  latencyClCas?: string; // Latencia Cl (CAS) (ej. CL30 / CL36)
  latencyTrcd?: string; // Latencia Trcd (ej. 36)
  latencyTrp?: string; // Latencia Trp (ej. 36)
  latencyTras?: string; // Latencia Tras (ej. 76)
  eccSupport?: string; // Soporte ECC (ej. On-Die ECC / No ECC)
  fullBufferedSupport?: string; // Soporte full buffered (ej. Unbuffered)
}

export interface HddSpecifications {
  // Básicas
  type: string; // Tipo (ej. HDD Interno 3.5" / Externo 2.5")
  line: string; // Línea (ej. Seagate Barracuda / WD Blue / WD Purple / Toshiba P300)
  capacity: string; // Capacidad (ej. 2 TB / 4 TB / 8 TB)
  rpm: string; // RPM (ej. 7200 RPM / 5400 RPM)
  size: string; // Tamaño (ej. 3.5 pulgadas / 2.5 pulgadas)
  bus: string; // Bus (ej. SATA III 6.0 Gb/s)
  buffer: string; // Búfer (ej. 256 MB Caché / 64 MB Caché)
}

export interface SsdSpecifications {
  // Básicas
  line: string; // Línea (ej. Samsung 990 PRO / Kingston KC3000 / Crucial T500)
  capacity: string; // Capacidad (ej. 1 TB / 2 TB / 4 TB)
  format: string; // Formato (ej. M.2 2280 / 2.5" SATA)
  bus: string; // Bus (ej. PCIe 4.0 x4 NVMe 2.0 / PCIe 5.0 x4)
  hasDram: string; // ¿Posee DRAM? (ej. Sí, 2 GB LPDDR4 / Sin DRAM con HMB)
  nandType: string; // Tipo memoria NAND (ej. 3D TLC V-NAND / QLC)
  controller: string; // Controladora (ej. Samsung Pascal / Phison E18 / InnoGrit)
  sequentialRead: string; // Lectura secuencial (según fabricante) (ej. 7.450 MB/s)
  sequentialWrite: string; // Escritura secuencial (según fabricante) (ej. 6.900 MB/s)
}

export interface PowerSupplySpecifications {
  // Básicas
  power: string; // Potencia (ej. 750W / 850W / 1000W)
  certification: string; // Certificación (ej. 80 Plus Gold / Platinum / Cybenetics Platinum)
  size: string; // Tamaño (ej. ATX 150 x 86 x 140 mm / SFX / SFX-L)
  activePfc: string; // PFC activo (ej. Sí, PFC Activo >0.99)
  modular: string; // Modular (ej. Full Modular / Semi-Modular / No Modular)
  // Avanzadas
  rail12vCurrent?: string; // Corriente en la línea de 12 V (ej. 70.8 A)
  rail5vCurrent?: string; // Corriente en la línea de 5 V (ej. 20 A)
  rail33vCurrent?: string; // Corriente en la línea de 3.3 V (ej. 20 A)
  powerConnectors?: string; // Conectores de energía (ej. 1x 12V-2x6 (PCIe 5.1 600W), 4x PCIe 6+2 pin, 2x EPS 8-pin, 8x SATA)
}

export interface CoolerCpuSpecifications {
  // Básicas
  brand: string; // Marca (ej. DeepCool / Thermalright / Noctua / Corsair / NZXT)
  type: string; // Tipo (ej. Refrigeración Líquida AIO 360mm / Torre de Aire Dual)
  weight: string; // Peso (ej. 1.250 g)
  rpm: string; // RPM (ej. 500 - 2.100 RPM ±10%)
  noise: string; // Ruido (ej. 19 - 31.6 dBA)
  airflow: string; // Flujo de aire (ej. 72.8 CFM)
  height: string; // Altura (ej. 157 mm / Radiador 27 mm)
  fanSize: string; // Tamaño ventilador (ej. 3x 120 mm / 2x 140 mm)
  hasHeatpipes: string; // ¿Heatpipes? (ej. 6x heatpipes de cobre de 6mm / No aplica (AIO))
  compatibleSockets: string; // Sockets compatibles (ej. Intel LGA1700/1851/1200, AMD AM5/AM4)
}

export interface CabinetSpecifications {
  format?: string;
  motherboardSupport?: string;
  sidePanel?: string;
  gpuMaxDimensions?: string;
  cpuCoolerMaxHeight?: string;
}

export interface FanSpecifications {
  brand?: string;
  size?: string;
  rpm?: string;
  noise?: string;
  airflow?: string;
  bearingType?: string;
  lighting?: string;
  connector?: string;
}

export type HardwareSubtype =
  | "TARJETA_DE_VIDEO"
  | "PROCESADORES"
  | "PLACA_MADRE"
  | "RAM"
  | "DISCO_DURO"
  | "SSD"
  | "GABINETE"
  | "FUENTE_DE_PODER"
  | "COOLER_CPU"
  | "VENTILADORES"
  | string;

export interface HardwareSpecifications {
  hardwareType?: HardwareSubtype;
  // Legacy / generic fields kept for compatibility
  componentType?: string;
  brand?: string;
  model?: string;
  interfaceOrSocket?: string;
  capacityOrSpeed?: string;
  formFactor?: string;
  powerConsumptionTdp?: string;
  warrantyYears?: string | number;
  featuredHighlights?: string;
  // Specialized subtypes
  gpu?: GpuSpecifications;
  cpu?: CpuSpecifications;
  motherboard?: MotherboardSpecifications;
  ram?: RamSpecifications;
  hdd?: HddSpecifications;
  ssd?: SsdSpecifications;
  powerSupply?: PowerSupplySpecifications;
  coolerCpu?: CoolerCpuSpecifications;
  cabinet?: CabinetSpecifications;
  fan?: FanSpecifications;
}

export interface CustomCategorySpecifications {
  categoryType?: string;
  console?: ConsoleSpecifications;
  hardware?: HardwareSpecifications;
  gamingAccessory?: GamingAccessorySpecifications;
  apparel?: ApparelSpecifications;
  book?: BookSpecifications;
  merch?: MerchSpecifications;
  audio?: AudioSpecifications;
  [key: string]: any;
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
