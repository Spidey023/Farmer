import { NextFunction, Request, Response } from "express";

import { prisma } from "../db";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

// GET /api/v1/crops
// Used by frontend dropdowns (e.g., optional currentCropId while creating a Field)
export const listCrops = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    let crops = await prisma.crop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        cropId: true,
        name: true,
        category: true,
        isActive: true,
        defaultYieldPerAcre: true,
        defaultCostPerAcre: true,
        durationDays: true,
      },
    });

    // If DB is fresh and no crops are seeded, create a small default set
    // so dropdowns work out-of-the-box.
    if (!crops || crops.length === 0) {
      await prisma.tenant.upsert({
        where: { tenantId: "default" },
        update: {},
        create: { tenantId: "default", name: "Default Tenant" },
      });

      await prisma.crop.createMany({
        data: [
          { tenantId: "default", name: "WHEAT", category: "CEREAL", isActive: true },
          { tenantId: "default", name: "RICE", category: "CEREAL", isActive: true },
          { tenantId: "default", name: "MAIZE", category: "CEREAL", isActive: true },
          { tenantId: "default", name: "TOMATO", category: "VEGETABLE", isActive: true },
        ],
        skipDuplicates: true,
      });

      crops = await prisma.crop.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          cropId: true,
          name: true,
          category: true,
          isActive: true,
          defaultYieldPerAcre: true,
          defaultCostPerAcre: true,
          durationDays: true,
        },
      });
    }

    return res.status(200).json(new ApiResponse(200, crops, "Crops fetched"));
  }
);
