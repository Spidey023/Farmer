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
  phoneNumber: string;
  address: string;

  carts: Cart[];
  fields: Field[];
  orders: Order[];
};

export type CartStatus = "ACTIVE" | "CHECKED_OUT";

export type Cart = {
  cartId: string;
  farmerId: string;
  status: CartStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  cartItems: CartItem[];
};

export type CartItem = {
  cartItemId: string;
  cartId: string;
  productId: string;
  qty: number;
  unitPrice: string; // comes as "45" from API
  fieldId: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type LandType = "AGRICULTURAL";
export type SoilType = "OTHER";
export type IrrigationType = "NONE";

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
  lease?: Lease[];
};

export type CropCategory = "VEGETABLE";

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

export type FieldPlanStatus = "PLANNED"; // add more if your enum supports
export type CropStatus = "SOWN"; // add more if your enum supports

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

export type Lease = Record<string, never>; // your response shows [] but no fields; replace when you have Lease shape

export type OrderStatus = string; // replace with exact union if you want
export type PaymentMethod = string | null;
export type PaymentStatus = string;

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
