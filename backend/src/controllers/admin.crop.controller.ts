import { NextFunction, Request, Response } from "express";

import { prisma } from "../db";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

// ADMIN: Full crop CRUD
// Base: /api/v1/admin/crops

export const adminListCrops = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const crops = await prisma.crop.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(new ApiResponse(200, crops, "Crops fetched"));
  }
);

export const adminCreateCrop = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { name, category, defaultYieldPerAcre, defaultCostPerAcre, durationDays, marketPricePerUnit, isActive } =
      req.body ?? {};

    if (!name || String(name).trim().length === 0) {
      throw new ApiError(400, "Crop name is required");
    }

    const crop = await prisma.crop.create({
      data: {
        tenantId: "default",
        name: String(name).trim().toUpperCase(),
        ...(category ? { category } : {}),
        ...(defaultYieldPerAcre !== undefined && defaultYieldPerAcre !== null
          ? { defaultYieldPerAcre: String(defaultYieldPerAcre) }
          : {}),
        ...(defaultCostPerAcre !== undefined && defaultCostPerAcre !== null
          ? { defaultCostPerAcre: String(defaultCostPerAcre) }
          : {}),
        ...(marketPricePerUnit !== undefined && marketPricePerUnit !== null
          ? { marketPricePerUnit: String(marketPricePerUnit) }
          : {}),
        ...(durationDays !== undefined && durationDays !== null
          ? { durationDays: Number(durationDays) }
          : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return res.status(201).json(new ApiResponse(201, crop, "Crop created"));
  }
);

export const adminUpdateCrop = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { cropId } = req.params;
    if (!cropId) throw new ApiError(400, "cropId is required");

    const { name, category, defaultYieldPerAcre, defaultCostPerAcre, durationDays, marketPricePerUnit, isActive } =
      req.body ?? {};

    const crop = await prisma.crop.update({
      where: { cropId },
      data: {
        ...(name !== undefined ? { name: String(name).trim().toUpperCase() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(defaultYieldPerAcre !== undefined
          ? { defaultYieldPerAcre: defaultYieldPerAcre === null ? null : String(defaultYieldPerAcre) }
          : {}),
        ...(defaultCostPerAcre !== undefined
          ? { defaultCostPerAcre: defaultCostPerAcre === null ? null : String(defaultCostPerAcre) }
          : {}),
        ...(marketPricePerUnit !== undefined
          ? { marketPricePerUnit: marketPricePerUnit === null ? null : String(marketPricePerUnit) }
          : {}),
        ...(durationDays !== undefined
          ? { durationDays: durationDays === null ? null : Number(durationDays) }
          : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return res.status(200).json(new ApiResponse(200, crop, "Crop updated"));
  }
);

export const adminDeleteCrop = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { cropId } = req.params;
    if (!cropId) throw new ApiError(400, "cropId is required");

    // prevent deletion if referenced by any plan (history integrity)
    const used = await prisma.fieldSeasonPlan.findFirst({
      where: { cropId },
      select: { planId: true },
    });
    if (used) {
      throw new ApiError(
        400,
        "Crop is already used in season plans. Disable it instead of deleting."
      );
    }

    await prisma.crop.delete({ where: { cropId } });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Crop deleted"));
  }
);
