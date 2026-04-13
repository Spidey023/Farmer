import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import {
  CartStatus,
  CropCategory,
  CropStatus,
  FieldPlanStatus,
  FieldQuality,
  IrrigationType,
  LandType,
  LeaseModelType,
  LeaseStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductCategory,
  RecommendationSource,
  SeasonType,
  SoilType,
  UserRole,
  LeaseApprovalStatus,
  WalletTxType,
  PaymentProvider,
} from "@prisma/client";

const getEnum = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json({
      landTypes: Object.values(LandType),
      irrigationTypes: Object.values(IrrigationType),
      soilTypes: Object.values(SoilType),
      fieldPlanStatus: Object.values(FieldPlanStatus),
      orderStatus: Object.values(OrderStatus),
      leaseModelTypes: Object.values(LeaseModelType),
      cropCategories: Object.values(CropCategory),
      seasonTypes: Object.values(SeasonType),
      productCategories: Object.values(ProductCategory),
      leaseStatus: Object.values(LeaseStatus),
      fieldQuality: Object.values(FieldQuality),
      paymentMethods: Object.values(PaymentMethod),
      paymentStatus: Object.values(PaymentStatus),
      cropStatus: Object.values(CropStatus),
      recommendationSource: Object.values(RecommendationSource),
      cartStatus: Object.values(CartStatus),

      // Enterprise enums
      userRole: Object.values(UserRole),
      leaseApprovalStatus: Object.values(LeaseApprovalStatus),
      walletTxType: Object.values(WalletTxType),
      paymentProvider: Object.values(PaymentProvider),
    });
  }
);

export default getEnum;
