// types/dashboard.ts

export type DashboardResponse = {
  statusCode: number;
  data: DashboardData;
  message: string;
  success: boolean;
};

export type DashboardData = {
  farmerId: string;
  fullName: string;
  email: string;
  username: string;
  role?: "FARMER" | "ADMIN" | string;
  tenantId?: string;
  phoneNumber: string;
  address: string;

  carts: Cart[];
  fields: Field[];
  orders: Order[];

  // Optional wallet (added in later versions)
  wallet?: Wallet;
};

// Backwards-compat alias used across the app
export type FarmerDashboard = DashboardData;

export type WalletTxType = "CREDIT" | "DEBIT" | string;

export type WalletTransaction = {
  txId: string;
  walletId: string;
  type: WalletTxType;
  amount: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
};

export type Wallet = {
  walletId: string;
  balance: string;
  transactions?: WalletTransaction[];
};

export type CartStatus = "ACTIVE" | "CHECKED_OUT";

export type Cart = {
  cartId: string;
  farmerId: string;
  status: CartStatus;
  createdAt: string;
  updatedAt: string;

  items: CartItem[];
};

export type CartItem = {
  cartItemId: string;
  cartId: string;
  productId: string;
  qty: number;
  unitPrice: string;
  fieldId: string | null;

  // optional (if joined later)
  product?: {
    name: string;
    image?: string;
  };

  createdAt: string;
  updatedAt: string;
};

// These enums come from the backend at runtime via /api/v1/enum.
// Keep them as string unions for IntelliSense, but allow any string to avoid build breaks
// if backend adds new values.
export type LandType = "AGRICULTURAL" | "RESIDENTIAL" | "COMMERCIAL" | string;
export type SoilType =
  | "SANDY"
  | "CLAY"
  | "SILT"
  | "PEAT"
  | "CHALK"
  | "LOAM"
  | "OTHER"
  | string;
export type IrrigationType =
  | "NONE"
  | "DRIP"
  | "SPRINKLER"
  | "CANAL"
  | "BOREWELL"
  | string;

export type Field = {
  fieldId: string;
  farmerId: string;
  landImage: string | null;
  landType: LandType;
  currentCropId: string | null;
  soilType: SoilType;
  surveyNumber: number;
  acres: string; // comes as string in API
  irrigationType: IrrigationType;
  region: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  crops: Crop[];

  // Present only on first field in your response; keep optional for TS safety
  fieldSeasonPlan?: FieldSeasonPlan[] | undefined;
  fieldSnapchat?: FieldSnapshot[];
  // Backend uses `leases` relation (array)
  leases?: Lease[];
};

export type CropCategory =
  | "VEGETABLE"
  | "FRUIT"
  | "GRAIN"
  | "PULSE"
  | "OILSEED"
  | string;

export type Crop = {
  cropId: string;
  name: string;
  category: CropCategory;
  defaultYieldPerAcre: string;
  defaultCostPerAcre: string;
  durationDays: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type FieldPlanStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | string;
export type CropStatus =
  | "SOWN"
  | "GROWING"
  | "FLOWERING"
  | "HARVESTED"
  | "DAMAGED"
  | string;

export type FieldSeasonPlan = {
  planId: string;
  fieldId: string;
  seasonId: string;
  cropId: string;

  expectedYield: string | null;
  expectedCost: string | null;

  status: FieldPlanStatus;
  cropStatus: CropStatus;

  sowingDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;

  createdAt: string; // ISO
  updatedAt: string; // ISO

  season: Season;
};

export type SeasonName = "RABI";

export type Season = {
  seasonId: string;
  name: SeasonName;
  startDate: string; // ISO
  endDate: string; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type FieldSnapshotQuality = "GOOD";

export type FieldSnapshot = {
  snapshotId: string;
  fieldId: string;
  at: string; // ISO

  soilMoisture: number | null;
  avgMoisture: number | null;

  lastPh: number | null;
  soilPH: number | null;

  soilTemp: number | null;

  nitrogenLevel: number | null;
  phosphorusLevel: number | null;
  potassiumLevel: number | null;

  notes: string | null;
  quality: FieldSnapshotQuality | null;

  createdAt: string; // ISO
  updatedAt: string; // ISO
};

// Lease
export type LeaseStatus =
  | "PENDING"
  | "ACTIVE"
  | "TERMINATED"
  | "EXPIRED"
  | "CANCELLED"
  | string;
export type LeaseApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | string;
export type LeaseModelType = "STANDARD" | "HYBRID" | string;

export type Lease = {
  leaseId: string;
  fieldId: Field;
  ownerFarmerId: string;
  status: LeaseStatus;
  approvalStatus?: LeaseApprovalStatus;
  modelType: LeaseModelType;
  rentAmount: string; // Decimal -> string
  profitSharePct: number | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
};

export type LeaseCreateBody = {
  fieldId: string;
  modelType: LeaseModelType;
  rentAmount: string;
  profitSharePct: number | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
};

// Backend enums
export type OrderStatus =
  | "PENDING"
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "UPI"
  | "WALLET"
  | "NETBANKING"
  | null;

export type PaymentStatus = "INITIATED" | "PAID" | "FAILED" | "REFUNDED";

export type Order = {
  orderId: string;
  farmerId: string;
  cartId: string | null;
  status: OrderStatus;
  total: string; // Prisma Decimal -> string in JSON
  placedAt: string; // ISO date string
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type OrderItem = {
  orderItemId: string;
  orderId: string;
  productId: string;
  qty: number;
  unitPrice: string; // Decimal -> string
  fieldId: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
};

export type Product = {
  productId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  price: string; // Decimal -> string
  stock?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SeasonPlan = {
  planId: string;
  fieldId: string;
  seasonId: string;
  cropId: string;
  expectedYield: string | null;
  expectedCost: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | string;
  cropStatus: "SOWN" | "HARVESTED" | "GROWING" | string;
  sowingDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  createdAt: string;
  updatedAt: string;

  crop: Crop;
  season: Season;
};
export type SeasonPlanResponse = {
  statusCode: number;
  data: SeasonPlan[];
  message: string;
  success: boolean;
};

export type FarmerProfile = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string | null;
};
