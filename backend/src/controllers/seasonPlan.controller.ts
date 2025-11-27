import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import { prisma } from "../db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

const getSeasonPlansByFieldId = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const fieldId = req.params.fieldId;

    if (!farmerId || !fieldId) {
      throw new ApiError(400, "User or Field not found");
    }
    // Verify field ownership
    const field = await prisma.field.findUnique({
      where: { fieldId: fieldId },
    });
    if (!field || field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Field not found or does not belong to the farmer"
      );
    }
    const plans = await prisma.fieldSeasonPlan.findMany({
      where: { fieldId: fieldId },
      orderBy: { createdAt: "desc" },
      include: {
        crop: true,
        season: true,
      },
    });
    if (!plans || plans.length === 0) {
      throw new ApiError(404, "No season plans found for this field");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, plans, "Season plans retrieved successfully"));
  }
);

const createFiedSeasonPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const fieldId = req.params.fieldId;

    if (!farmerId || !fieldId) {
      throw new ApiError(400, "User or Field not found");
    }

    // Verify field ownership
    const field = await prisma.field.findUnique({
      where: { fieldId: fieldId },
    });

    if (!field || field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Field not found or does not belong to the farmer"
      );
    }

    // Implementation for creating season plan goes here
    const planData = req.body;

    const plan = await prisma.$transaction(async (pms) => {
      const newPlan = await pms.fieldSeasonPlan.create({
        data: {
          fieldId,
          ...planData,
        },
      });

      if (!newPlan) {
        throw new ApiError(500, "Failed to create field season plan");
      }

      if (
        !(
          newPlan.cropStatus === "HARVESTED" || newPlan.cropStatus === "DAMAGED"
        )
      ) {
        await prisma.field.update({
          where: { fieldId },
          data: {
            currentCrop: {
              connect: { cropId: newPlan.cropId }, // use your actual unique key name
            },
          },
        });
      }

      if (
        newPlan.cropStatus === "HARVESTED" ||
        newPlan.cropStatus === "DAMAGED"
      ) {
        await prisma.field.update({
          where: { fieldId },
          data: {
            currentCrop: undefined,
          },
        });
      }
      return newPlan;
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, plan, "Field season plan created successfully")
      );
  }
);

const updateFieldSeasonPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const planId = req.params.planId;

    if (!farmerId || !planId) {
      throw new ApiError(400, "User or Plan not found");
    }

    // Fetch the plan to verify ownership via field
    const existingPlan = await prisma.fieldSeasonPlan.findUnique({
      where: { planId: planId },
      include: { field: true },
    });

    if (!existingPlan || existingPlan.field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Plan not found or does not belong to the farmer"
      );
    }

    const updatedPlan = await prisma.fieldSeasonPlan.update({
      where: { planId: planId },
      data: { ...req.body },
    });

    if (!updatedPlan) {
      throw new ApiError(500, "Failed to update field season plan");
    }

    // Update currentCrop in Field if necessary
    if (
      !(
        updatedPlan.cropStatus === "HARVESTED" ||
        updatedPlan.cropStatus === "DAMAGED"
      )
    ) {
      await prisma.field.update({
        where: { fieldId: updatedPlan.fieldId },
        data: {
          currentCrop: {
            connect: { cropId: updatedPlan.cropId },
          },
        },
      });
    }

    if (
      updatedPlan.cropStatus === "HARVESTED" ||
      updatedPlan.cropStatus === "DAMAGED"
    ) {
      await prisma.field.update({
        where: { fieldId: updatedPlan.fieldId },
        data: {
          currentCrop: { disconnect: true },
        },
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlan,
          "Field season plan updated successfully"
        )
      );
  }
);

const deleteFieldSeasonPlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const planId = req.params.planId;

    if (!farmerId || !planId) {
      throw new ApiError(400, "User or Plan not found");
    }

    // Fetch the plan to verify ownership via field
    const existingPlan = await prisma.fieldSeasonPlan.findUnique({
      where: { planId: planId },
      include: { field: true },
    });

    if (!existingPlan || existingPlan.field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Plan not found or does not belong to the farmer"
      );
    }

    await prisma.fieldSeasonPlan.delete({
      where: { planId: planId },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Field season plan deleted successfully")
      );
  }
);

export {
  createFiedSeasonPlan,
  getSeasonPlansByFieldId,
  updateFieldSeasonPlan,
  deleteFieldSeasonPlan,
};
