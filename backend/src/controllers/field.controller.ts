import { NextFunction, Request, Response } from "express";

import { asyncHandler } from "../utils/ayncHnadler";
import { prisma } from "../db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

const addField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    console.log("id", farmerId);

    if (!farmerId) {
      throw new ApiError(400, "User not found");
    }

    const {
      landImage,
      landType,
      currentCrop,
      soilType,
      surveyNumber,
      acres,
      irrigationType,
    } = req.body;

    const newField = await prisma.field.create({
      data: {
        farmerId,
        landImage,
        landType,
        currentCrop,
        soilType,
        surveyNumber,
        acres,
        irrigationType,
      },
    });

    if (!newField) {
      throw new ApiError(500, "Failed to add field");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, newField, "Field added successfully"));
  }
);

const getFieldsByFarmerId = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;

    if (!farmerId) {
      throw new ApiError(400, "User not found");
    }

    const fields = await prisma.field.findMany({
      where: { farmerId },
    });

    if (!fields || fields.length === 0) {
      throw new ApiError(404, "No fields found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, fields, "Fields retrieved successfully"));
  }
);

const deleteField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const fieldId = req.params?.fieldId;
    console.log("id", fieldId);

    if (!farmerId || !fieldId) {
      throw new ApiError(400, "UserId or FieldId not found");
    }

    const field = await prisma.field.findUnique({
      where: { fieldId: fieldId },
    });

    if (!field) {
      throw new ApiError(404, "Field not found");
    }

    if (field.farmerId !== farmerId) {
      throw new ApiError(403, "Forbidden: You cannot delete this field");
    }

    const deleteField = await prisma.field.delete({
      where: { fieldId: fieldId },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, deleteField, "Field deleted successfully"));
  }
);

const updateField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const fieldId = req.params.fieldId;

    if (!farmerId || !fieldId) {
      throw new ApiError(400, "User or Field not found");
    }
    // Check if field exists and belongs to the farmer
    const field = await prisma.field.findUnique({
      where: { fieldId: fieldId },
    });

    if (!field || field.farmerId !== farmerId) {
      throw new ApiError(404, "Field not found not belongs to the farmer");
    }

    const updatedField = await prisma.field.update({
      where: { fieldId: fieldId },
      data: { farmerId, ...req.body },
    });

    if (!updatedField) {
      throw new ApiError(500, "Failed to update field");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedField, "Field updated successfully"));
  }
);

const getFieldById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const fieldId = req.params.fieldId;

    if (!farmerId || !fieldId) {
      throw new ApiError(400, "User or Field not found");
    }

    const field = await prisma.field.findUnique({
      where: { fieldId: fieldId },
      include: {
        plans: {
          // 👇 nested includes inside plans
          include: {
            crop: true, // crop details
            season: true, // season details
          },
        },
        recommendations: {
          include: {
            recommendedCrop: true, // which crop was recommended
            season: true, // season context
          },
        },
        snapshots: { orderBy: { createdAt: "desc" }, take: 5 },
        leases: true, // lease contracts
      },
    });

    if (!field || field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Field not found or does not belong to the farmer"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, field, "Field retrieved successfully"));
  }
);

const getRecomandationsByFieldId = asyncHandler(
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

    if (!field) {
      throw new ApiError(404, "Field not found");
    }
    const recommendations = await prisma.recommendation.findMany({
      where: { fieldId: fieldId },
      orderBy: { createdAt: "desc" },
      include: {
        recommendedCrop: true,
        season: true,
      },
    });

    if (!recommendations || recommendations.length === 0) {
      throw new ApiError(404, "No recommendations found for this field");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          recommendations,
          "Recommendations retrieved successfully"
        )
      );
  }
);

export {
  addField,
  getFieldsByFarmerId,
  deleteField,
  updateField,
  getFieldById,
  getRecomandationsByFieldId,
};
