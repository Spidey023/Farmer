import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import { prisma } from "../db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CropStatus, FieldPlanStatus, Prisma } from "@prisma/client";

const getSeasonPlansByFieldId = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
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
      // Normalize + type-cast incoming values (HTML forms send strings)
      const {
        seasonId,
        cropId,
        status,
        cropStatus,
        sowingDate,
        expectedEndDate,
        actualEndDate,
        expectedYield,
        expectedCost,
        actualYield,
        actualCost,
      } = planData as any;

      
      const seasonIdStr = String(seasonId);
      const cropIdOrName = String(cropId);

      // Validate season exists
      const seasonExists = await pms.season.findUnique({
        where: { seasonId: seasonIdStr },
        select: { seasonId: true },
      });
      if (!seasonExists) {
        throw new ApiError(400, `Invalid seasonId: ${seasonIdStr}`);
      }

      // ✅ Enforce ONE active plan per field
      const activeExisting = await pms.fieldSeasonPlan.findFirst({
        where: { fieldId, status: FieldPlanStatus.ACTIVE },
        select: { planId: true },
      });
      if (activeExisting) {
        throw new ApiError(400, "This field already has an ACTIVE crop plan. Harvest/complete it before adding a new crop.");
      }


      // Resolve crop: must exist (admin controlled) and be ACTIVE
      const cropRow = await pms.crop.findUnique({
        where: { cropId: cropIdOrName },
        select: { cropId: true, isActive: true },
      });
      if (!cropRow) {
        throw new ApiError(400, `Invalid cropId: ${cropIdOrName}`);
      }
      if (!cropRow.isActive) {
        throw new ApiError(400, "Selected crop is disabled by admin");
      }
      const resolvedCropId: string = cropRow.cropId;
      // ✅ Always CREATE a new plan (enables crop history + add crop after harvest)
      // NOTE: We do NOT rely on a unique(fieldId, seasonId) anymore.
      const newPlan = await pms.fieldSeasonPlan.create({
        data: {
          // Default to PLANNED unless the client explicitly sends a status.
          // (UI supports creating PLANNED plans.)
          status: (status as FieldPlanStatus) ?? FieldPlanStatus.PLANNED,
          cropStatus: (cropStatus as CropStatus) ?? CropStatus.SOWN,
          sowingDate: sowingDate ? new Date(String(sowingDate)) : undefined,
          expectedEndDate: expectedEndDate ? new Date(String(expectedEndDate)) : undefined,
          actualEndDate: actualEndDate ? new Date(String(actualEndDate)) : undefined,
          expectedYield:
            expectedYield === undefined || expectedYield === null || expectedYield === ""
              ? undefined
              : new Prisma.Decimal(String(expectedYield)),
          expectedCost:
            expectedCost === undefined || expectedCost === null || expectedCost === ""
              ? undefined
              : new Prisma.Decimal(String(expectedCost)),
          actualYield:
            actualYield === undefined || actualYield === null || actualYield === ""
              ? undefined
              : new Prisma.Decimal(String(actualYield)),
          actualCost:
            actualCost === undefined || actualCost === null || actualCost === ""
              ? undefined
              : new Prisma.Decimal(String(actualCost)),
          field: { connect: { fieldId } },
          season: { connect: { seasonId: seasonIdStr } },
          crop: { connect: { cropId: resolvedCropId! } },
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
        await pms.field.update({
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
        await pms.field.update({
          where: { fieldId },
          data: {
            currentCrop: { disconnect: true },
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

// const updateFieldSeasonPlan = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const farmerId = (req as any).user.id;
//     const planId = req.params.planId;

//     if (!farmerId || !planId) {
//       throw new ApiError(400, "User or Plan not found");
//     }

//     // Fetch the plan to verify ownership via field
//     const existingPlan = await prisma.fieldSeasonPlan.findUnique({
//       where: { planId: planId },
//       include: { field: true },
//     });

//     if (!existingPlan || existingPlan.field.farmerId !== farmerId) {
//       throw new ApiError(
//         404,
//         "Plan not found or does not belong to the farmer"
//       );
//     }

//     const updatedPlan = await prisma.fieldSeasonPlan.update({
//       where: { planId: planId },
//       data: { ...req.body },
//     });

//     if (!updatedPlan) {
//       throw new ApiError(500, "Failed to update field season plan");
//     }

//     // Update currentCrop in Field if necessary
//     if (
//       !(
//         updatedPlan.cropStatus === "HARVESTED" ||
//         updatedPlan.cropStatus === "DAMAGED"
//       )
//     ) {
//       await prisma.field.update({
//         where: { fieldId: updatedPlan.fieldId },
//         data: {
//           currentCrop: {
//             connect: { cropId: updatedPlan.cropId },
//           },
//         },
//       });
//     }

//     if (
//       updatedPlan.cropStatus === "HARVESTED" ||
//       updatedPlan.cropStatus === "DAMAGED"
//     ) {
//       await prisma.field.update({
//         where: { fieldId: updatedPlan.fieldId },
//         data: {
//           currentCrop: { disconnect: true },
//         },
//       });
//     }

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           updatedPlan,
//           "Field season plan updated successfully"
//         )
//       );
//   }
// );

type UpdateSeasonPlanBody = Partial<{
  // relation keys coming from client:
  cropId: string;
  seasonId: string;

  expectedYield: string | null;
  expectedCost: string | null;
  actualYield: string | null;
  actualCost: string | null;

  status: FieldPlanStatus;
  cropStatus: CropStatus;

  sowingDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
}>;

const isEndedCropStatus = (cs?: CropStatus | null) =>
  cs === "HARVESTED" || cs === "DAMAGED";

const mapCropStatusToPlanStatus = (cropStatus: CropStatus) => {
  if (cropStatus === "HARVESTED") return "COMPLETED" as const;
  if (cropStatus === "DAMAGED") return "COMPLETED" as const; // or "CANCELLED"
  return "ACTIVE" as const;
};

const updateFieldSeasonPlan = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    const planId = req.params.planId as string | undefined;

    if (!farmerId || !planId) {
      throw new ApiError(400, "User or Plan not found");
    }

    // Verify ownership
    const existingPlan = await prisma.fieldSeasonPlan.findUnique({
      where: { planId },
      include: { field: true },
    });

    if (!existingPlan || existingPlan.field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Plan not found or does not belong to the farmer"
      );
    }

    const body = req.body as UpdateSeasonPlanBody;

    // ✅ Lock COMPLETED/CANCELLED plans (recommended)
    if (existingPlan.status === "COMPLETED") {
      throw new ApiError(400, "Completed/Cancelled plans cannot be modified");
    }

    // ✅ If ACTIVE: disallow changing crop/season (recommended)
    if (existingPlan.status === "ACTIVE") {
      if (body.cropId) {
        throw new ApiError(400, "Cannot change crop while plan is ACTIVE");
      }
      if (body.seasonId) {
        throw new ApiError(400, "Cannot change season while plan is ACTIVE");
      }
    }

    // ✅ If plan already ended by cropStatus (extra guard)
    if (
      isEndedCropStatus(existingPlan.cropStatus) &&
      (body.cropStatus ||
        body.cropId ||
        body.seasonId ||
        body.sowingDate ||
        body.expectedEndDate ||
        body.actualEndDate)
    ) {
      throw new ApiError(
        400,
        "Cannot change crop/season/status/dates after plan ended"
      );
    }

    // ✅ Decide next status: derive from cropStatus if provided; else keep current
    let nextStatus: FieldPlanStatus | undefined;

    if (body.cropStatus) {
      nextStatus = mapCropStatusToPlanStatus(body.cropStatus);
      // ✅ Harvest should automatically COMPLETE the plan and set actualEndDate if missing
      if (body.cropStatus === "HARVESTED" && body.actualEndDate === undefined) {
        body.actualEndDate = new Date();
      }
    } else if (body.status) {
      // Optional: allow manual status updates with rule
      if (
        body.status === "COMPLETED" &&
        !isEndedCropStatus(existingPlan.cropStatus)
      ) {
        throw new ApiError(
          400,
          "Cannot mark plan COMPLETED unless cropStatus is HARVESTED or DAMAGED"
        );
      }
      nextStatus = body.status;
    }

    // ✅ Build Prisma update data safely (no spreading req.body)
    // IMPORTANT: update relations via connect (NOT seasonId/cropId directly)
    const data: Prisma.FieldSeasonPlanUpdateInput = {
      ...(body.expectedYield !== undefined
        ? { expectedYield: body.expectedYield }
        : {}),
      ...(body.expectedCost !== undefined
        ? { expectedCost: body.expectedCost }
        : {}),
      ...(body.actualYield !== undefined
        ? { actualYield: body.actualYield }
        : {}),
      ...(body.actualCost !== undefined
        ? { actualCost: body.actualCost }
        : {}),
      ...(body.sowingDate !== undefined ? { sowingDate: body.sowingDate } : {}),
      ...(body.expectedEndDate !== undefined
        ? { expectedEndDate: body.expectedEndDate }
        : {}),
      ...(body.actualEndDate !== undefined
        ? { actualEndDate: body.actualEndDate }
        : {}),
      ...(body.cropStatus !== undefined ? { cropStatus: body.cropStatus } : {}),

      ...(nextStatus ? { status: nextStatus } : {}),

      // Only allowed when PLANNED due to guards above
      ...(body.seasonId
        ? { season: { connect: { seasonId: body.seasonId } } }
        : {}),
      ...(body.cropId ? { crop: { connect: { cropId: body.cropId } } } : {}),
    };

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.fieldSeasonPlan.update({
        where: { planId },
        data,
      });

      const ended = isEndedCropStatus(plan.cropStatus);

      // ✅ Keep Field.currentCrop synced
      if (!ended) {
        // When plan is active/in-progress, keep current crop connected
        await tx.field.update({
          where: { fieldId: plan.fieldId },
          data: { currentCrop: { connect: { cropId: plan.cropId } } },
        });
      } else {
        // When plan ends, remove current crop from field
        await tx.field.update({
          where: { fieldId: plan.fieldId },
          data: { currentCrop: { disconnect: true } },
        });
      }

      return plan;
    });

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
