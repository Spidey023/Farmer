import { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { Prisma } from "@prisma/client";
import type { LeaseModelType, LeaseStatus } from "@prisma/client";

type CreateLeaseBody = {
  fieldId: string;
  modelType: LeaseModelType; // STANDARD | HYBRID
  rentAmount: string | number; // Decimal compatible
  profitSharePct?: string | number | null; // optional for HYBRID
  startDate: string; // ISO
  endDate?: string | null; // ISO
};

type UpdateLeaseBody = Partial<{
  modelType: LeaseModelType;
  rentAmount: string | number;
  profitSharePct: string | number | null;
  startDate: string;
  endDate: string | null;
  status: LeaseStatus;
}>;

const assertOwnsField = async (farmerId: string, fieldId: string) => {
  const field = await prisma.field.findUnique({
    where: { fieldId },
    select: { farmerId: true },
  });

  if (!field || field.farmerId !== farmerId) {
    throw new ApiError(404, "Field not found or does not belong to the farmer");
  }
};

/**
 * GET /lease
 * Returns all leases for the logged-in farmer (through their fields).
 */
const getLeasesForFarmer = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    if (!farmerId) throw new ApiError(401, "Unauthorized");

    const leases = await prisma.lease.findMany({
      where: { field: { farmerId } },
      include: {
        field: {
          select: {
            fieldId: true,
            surveyNumber: true,
            acres: true,
            landType: true,
            region: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, leases, "Leases retrieved successfully"));
  }
);

/**
 * POST /lease
 * Create a lease for a field owned by this farmer.
 */
const createLease = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    const tenantId =
      ((req as any).user?.tenantId as string | undefined) ?? "default";
    if (!farmerId) throw new ApiError(401, "Unauthorized");

    const body = req.body as CreateLeaseBody;
    const {
      fieldId,
      modelType,
      rentAmount,
      profitSharePct,
      startDate,
      endDate,
    } = body;

    if (!fieldId || !modelType || rentAmount === undefined || !startDate) {
      throw new ApiError(
        400,
        "fieldId, modelType, rentAmount, startDate are required"
      );
    }

    await assertOwnsField(farmerId, fieldId);

    // Ensure tenant exists (FK safety)
    await prisma.tenant.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId, name: "Default Tenant" },
    });

    // Business rule:
    // Allow lease HISTORY, but prevent multiple ACTIVE/PENDING leases for the same field.
    const activeOrPending = await prisma.lease.findFirst({
      where: {
        tenantId,
        fieldId,
        status: { in: ["PENDING", "ACTIVE"] },
      },
      select: { leaseId: true, status: true },
    });
    if (activeOrPending) {
      throw new ApiError(
        400,
        "A PENDING/ACTIVE lease already exists for this field. Please edit/cancel it instead."
      );
    }

    if (
      modelType === "HYBRID" &&
      (profitSharePct === undefined || profitSharePct === null)
    ) {
      throw new ApiError(400, "profitSharePct is required for HYBRID lease");
    }

    // Normalize types for Prisma
    const rent = new Prisma.Decimal(String(rentAmount));
    const pct =
      profitSharePct === undefined
        ? undefined
        : profitSharePct === null
          ? null
          : new Prisma.Decimal(String(profitSharePct));

    const sd = new Date(startDate);
    if (Number.isNaN(sd.getTime()))
      throw new ApiError(400, "Invalid startDate");
    const ed = endDate ? new Date(endDate) : null;
    if (ed && Number.isNaN(ed.getTime()))
      throw new ApiError(400, "Invalid endDate");

    const lease = await prisma.lease.create({
      data: {
        tenantId,
        fieldId,
        // approval flow
        status: "PENDING",
        approvalStatus: "PENDING",
        modelType,
        rentAmount: rent,
        profitSharePct: pct,
        startDate: sd,
        endDate: ed,
        // default is PENDING + approvalStatus PENDING in schema
      },
      include: { field: true },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, lease, "Lease created successfully"));
  }
);

/**
 * PATCH /lease/:leaseId
 * Update lease fields (farmer must own the field)
 */
const updateLease = asyncHandler(async (req: Request, res: Response) => {
  const farmerId = (req as any).user?.id as string | undefined;
  const { leaseId } = req.params;

  if (!farmerId) throw new ApiError(401, "Unauthorized");
  if (!leaseId) throw new ApiError(400, "leaseId is required");

  const lease = await prisma.lease.findUnique({
    where: { leaseId },
    include: { field: { select: { farmerId: true } } },
  });

  if (!lease || lease.field.farmerId !== farmerId) {
    throw new ApiError(404, "Lease not found or does not belong to the farmer");
  }

  // Farmer can only edit lease while PENDING
  if (lease.status !== "PENDING") {
    throw new ApiError(400, "Lease can only be edited while status is PENDING");
  }

  const body = req.body as UpdateLeaseBody;

  const nextModelType = body.modelType ?? lease.modelType;

  if (nextModelType === "HYBRID") {
    const nextPct = body.profitSharePct ?? lease.profitSharePct;
    if (nextPct === null) {
      throw new ApiError(400, "profitSharePct cannot be null for HYBRID lease");
    }
  }

  const updated = await prisma.lease.update({
    where: { leaseId },
    data: {
      ...(body.modelType !== undefined && { modelType: body.modelType }),
      ...(body.rentAmount !== undefined && {
        rentAmount: String(body.rentAmount),
      }),
      ...(body.profitSharePct !== undefined && {
        profitSharePct:
          body.profitSharePct === null ? null : String(body.profitSharePct),
      }),
      ...(body.startDate !== undefined && {
        startDate: new Date(body.startDate),
      }),
      ...(body.endDate !== undefined && {
        endDate: body.endDate ? new Date(body.endDate) : null,
      }),
    },
    include: { field: true },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Lease updated successfully"));
});

/**
 * DELETE /lease/:leaseId
 * Soft-delete a lease by cancelling it (status=CANCELLED) for a field owned by this farmer.
 */
const deleteLease = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    if (!farmerId) throw new ApiError(401, "Unauthorized");

    const { leaseId } = req.params;
    if (!leaseId) throw new ApiError(400, "leaseId is required");

    const lease = await prisma.lease.findUnique({
      where: { leaseId },
      include: { field: { select: { farmerId: true } } },
    });

    if (!lease || lease.field.farmerId !== farmerId) {
      throw new ApiError(
        404,
        "Lease not found or does not belong to the farmer"
      );
    }

    if (lease.status !== "PENDING") {
      throw new ApiError(400, "Only PENDING leases can be cancelled by farmer");
    }

    // Soft delete (cancel)
    await prisma.lease.update({
      where: { leaseId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        approvalStatus: "REJECTED",
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Lease cancelled successfully"));
  }
);

export { getLeasesForFarmer, createLease, updateLease, deleteLease };
