export type Field = {
  fieldId: string;
  farmerId: string;
  landImage: string | null;
  landType: string;
  currentCropId: string | null;
  soilType: string;
  surveyNumber: number;
  acres: string;
  irrigationType: string;
  region: string | null;
  createdAt: string;
  updatedAt: string;
  crops: Crop[];
};

export type Crop = {
  cropId: string;
  name: string;
  category: string;
  defaultYieldPerAcre: number;
  defaultCostPerAcre: number;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  orderId: string;
  farmerId: string;
  cartId: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | string;
  total: string; // comes as string in your JSON
  placedAt: string; // ISO date string
  paymentMethod: "CASH" | "CARD" | null | string;
  paymentStatus: "INITIATED" | "PAID" | "FAILED" | string;
  createdAt: string;
  updatedAt: string;
};

export type FarmerDashboard = {
  farmerId: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  fields: Field[];
  orders: Order[];
};

export type FarmerDashboardResponse = {
  statusCode: number;
  data: FarmerDashboard;
  message: string;
  success: boolean;
};
