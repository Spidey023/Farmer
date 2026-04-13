import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import { prisma } from "../db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

const createFieldSnapshot = asyncHandler(
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

    const {
      soilMoisture,
      soilPH,
      nitrogenLevel,
      phosphorusLevel,
      potassiumLevel,
    } = req.body;

    const newSnapshot = await prisma.fieldSnapshot.create({
      data: {
        fieldId,
        soilMoisture,
        soilPH,
        nitrogenLevel,
        phosphorusLevel,
        potassiumLevel,
      },
    });

    if (!newSnapshot) {
      throw new ApiError(500, "Failed to create field snapshot");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, newSnapshot, "Field snapshot created successfully")
      );
  }
);

const getSnapshotsByFieldId = asyncHandler(
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

    const snapshots = await prisma.fieldSnapshot.findMany({
      where: { fieldId: fieldId },
      orderBy: { createdAt: "desc" },
    });

    if (!snapshots || snapshots.length === 0) {
      throw new ApiError(404, "No snapshots found for this field");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, snapshots, "Snapshots retrieved successfully")
      );
  }
);

export { createFieldSnapshot, getSnapshotsByFieldId };
