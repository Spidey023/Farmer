import { NextFunction, Request, Response } from "express";

import { asyncHandler } from "../utils/ayncHnadler";
import { prisma } from "../db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { deleteFromCloudinary, uploadeOnCloudinary } from "../utils/cloudinary";
import { Prisma } from "@prisma/client";

const addField = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
    console.log("id", farmerId);

    if (!farmerId) {
      throw new ApiError(400, "User not found");
    }

    // const file = req.file as
    //   | { [fieldname: string]: Express.Multer.File[] }
    //   | undefined;

    // land image is OPTIONAL.
    // Accept either a multipart upload (req.file / req.files) OR a URL in req.body.landImage.
    const landImagePath =
      (req as any).file?.path || (req as any).files?.landImage?.[0]?.path;

    let landImageUrl: string | null =
      typeof (req.body as any).landImage === "string" &&
      String((req.body as any).landImage).trim().length > 0
        ? String((req.body as any).landImage).trim()
        : null;

    if (landImagePath) {
      try {
        landImageUrl = await uploadeOnCloudinary(landImagePath);
        if (!landImageUrl) {
          throw new ApiError(500, "Failed to upload land image");
        }
      } catch (error) {
        console.log("error uploading land image", error);
        throw new ApiError(500, "failed to upload land image");
      }
    }

    const {
      landType,
      currentCropId, // optional
      // optional season plan
      seasonId,
      planCropId,
      soilType,
      surveyNumber,
      acres,
      irrigationType,
      region,
      // optional inline lease create
      leaseModelType,
      rentAmount,
      profitSharePct,
      leaseStartDate,
      leaseEndDate,
    } = req.body;

    const surveyNumberNum = Number(surveyNumber);
    const acresNum = Number(acres);

    // Validation
    if (isNaN(surveyNumberNum))
      throw new ApiError(400, "Survey number must be a number");
    if (isNaN(acresNum)) throw new ApiError(400, "Acres must be a number");
    let newField;
    try {
      newField = await prisma.$transaction(async (tx) => {
        const field = await tx.field.create({
          data: {
            tenantId,
            farmerId,
            landImage: landImageUrl,
            landType,
            soilType,
            surveyNumber: surveyNumberNum,
            acres: acresNum,
            irrigationType,
            region: region ?? null,
            ...(currentCropId
              ? { currentCrop: { connect: { cropId: String(currentCropId) } } }
              : {}),
          },
        });

        // OPTIONAL: create a season plan for this field
        if (seasonId && planCropId) {
          await tx.fieldSeasonPlan.create({
            data: {
              tenantId,
              fieldId: field.fieldId,
              seasonId: String(seasonId),
              cropId: String(planCropId),
              status: "PENDING",
              cropStatus: "SOWN",
            },
          });
        }

        // OPTIONAL: create a lease for this field if leaseModelType is provided
        if (leaseModelType) {
          const mt = String(leaseModelType);
          if (mt !== "STANDARD" && mt !== "HYBRID") {
            throw new ApiError(400, "Invalid leaseModelType");
          }
          const rentAmountStr = String(rentAmount || "").trim();
          if (!rentAmountStr) {
            throw new ApiError(
              400,
              "rentAmount is required when creating a lease"
            );
          }

          await tx.lease.create({
            data: {
              tenantId,
              fieldId: field.fieldId,
              modelType: mt,
              status: "PENDING",
              rentAmount: rentAmountStr,
              profitSharePct: profitSharePct ? String(profitSharePct) : null,
              startDate: leaseStartDate ? new Date(leaseStartDate) : new Date(),
              endDate: leaseEndDate ? new Date(leaseEndDate) : null,
            },
          });
        }

        return field;
      });
    } catch (err: any) {
      // Handle unique constraint on surveyNumber
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError(400, "Survey number already exists for this farmer");
      }
      throw err;
    }

    if (!newField) {
      if (landImagePath) await deleteFromCloudinary(landImagePath);
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
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    const fieldId = req.params?.fieldId as string | undefined;

    if (!farmerId || !fieldId) {
      throw new ApiError(400, "farmerId or fieldId not found");
    }

    const field = await prisma.field.findUnique({
      where: { fieldId },
      select: { fieldId: true, farmerId: true },
    });

    if (!field) throw new ApiError(404, "Field not found");
    if (field.farmerId !== farmerId) {
      throw new ApiError(403, "Forbidden: You cannot delete this field");
    }

    // Cannot delete if there is an ACTIVE lease on this field
    const activeLease = await prisma.lease.findFirst({
      where: { fieldId, status: "ACTIVE" },
      select: { leaseId: true },
    });
    if (activeLease) {
      throw new ApiError(400, "Cannot delete field while there is an ACTIVE lease");
    }

    // Safe cascade cleanup (keep order history by nulling fieldId)
    await prisma.$transaction(async (tx) => {
      // Orders/cart history: keep records by nulling the fieldId reference
      await tx.orderItem.updateMany({
        where: { fieldId },
        data: { fieldId: null },
      });

      await tx.cartItem.updateMany({
        where: { fieldId },
        data: { fieldId: null },
      });

      // Remove dependent analytics/recommendations/snapshots
      await tx.recommendation.deleteMany({ where: { fieldId } });
      await tx.fieldSnapshot.deleteMany({ where: { fieldId } });

      await tx.fieldSeasonPlan.deleteMany({ where: { fieldId } });

      // Delete non-active leases for this field (PENDING/CANCELLED/TERMINATED/COMPLETED etc.)
      await tx.lease.deleteMany({
        where: { fieldId, status: { not: "ACTIVE" } },
      });

      // Disconnect current crop (in case relation is set)
      await tx.field.update({ where: { fieldId }, data: { currentCrop: { disconnect: true } } }).catch(() => {});

      await tx.field.delete({ where: { fieldId } });
    });

    return res.status(200).json(new ApiResponse(200, null, "Field deleted successfully"));
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

    // NOTE: HTML form inputs arrive as strings; Prisma expects correct types.
    // surveyNumber: Int, acres: Decimal.
    const { surveyNumber, acres, ...rest } = req.body as any;

    const updatedField = await prisma.field.update({
      where: { fieldId: fieldId },
      data: {
        farmerId,
        ...rest,
        surveyNumber:
          surveyNumber === undefined || surveyNumber === null || surveyNumber === ""
            ? undefined
            : Number.parseInt(String(surveyNumber), 10),
        acres:
          acres === undefined || acres === null || acres === ""
            ? undefined
            : new Prisma.Decimal(String(acres)),
      },
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
          orderBy: { createdAt: "desc" },
        },
        recommendations: {
          include: {
            recommendedCrop: true, // which crop was recommended
            season: true, // season context
          },
        },
        snapshots: { orderBy: { createdAt: "desc" }, take: 10 },
        leases: { orderBy: { createdAt: "desc" } }, // latest lease first
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