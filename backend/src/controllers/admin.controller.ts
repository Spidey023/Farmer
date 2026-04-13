import { Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

async function ensureWalletForFarmer(farmerId: string, tenantId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { farmerId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { farmerId, tenantId, balance: "0" } });
  }
  return wallet;
}

async function creditLeaseToFarmer(params: { farmerId: string; tenantId: string; amount: string; referenceId: string }) {
  const { farmerId, tenantId, amount, referenceId } = params;
  const wallet = await ensureWalletForFarmer(farmerId, tenantId);
  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { walletId: wallet.walletId },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.walletId,
        tenantId,
        type: "CREDIT",
        amount,
        referenceType: "LEASE_PAYMENT",
        referenceId,
      },
    });
  });
}

import { prisma } from "../db";

// GET /admin/dashboard
// Admin overview: platform stats + operational queues
export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";

  const [
    totalFarmers,
    totalProducts,
    activeLeases,
    pendingLeaseCount,
    totalOrders,
    revenueAgg,
    pendingLeases,
    recentOrders,
  ] = await Promise.all([
    prisma.farmer.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId } }),
    prisma.lease.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.lease.count({ where: { tenantId, status: "PENDING" } }),
    prisma.order.count({ where: { tenantId } }),
    prisma.order.aggregate({ where: { tenantId, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.lease.findMany({
      where: { tenantId, status: "PENDING" },
      include: {
        field: { include: { farmer: { select: { farmerId: true, username: true, email: true, fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.findMany({
      where: { tenantId },
      include: { farmer: { select: { farmerId: true, username: true, email: true, fullName: true } }, items: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const revenue = (revenueAgg._sum.total ?? 0) as any;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          totalFarmers,
          totalProducts,
          activeLeases,
          pendingLeases: pendingLeaseCount,
          totalOrders,
          revenue,
        },
        pendingLeases,
        recentOrders,
      },
      "Admin dashboard"
    )
  );
});

// GET /admin/leases/pending
export const getPendingLeases = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const leases = await prisma.lease.findMany({
    where: { tenantId, approvalStatus: "PENDING", status: "PENDING" },
    include: { field: { include: { farmer: { select: { farmerId: true, username: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, leases, "Pending leases"));
});

// POST /admin/leases/:leaseId/approve
export const approveLease = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { leaseId } = req.params;
  if (!leaseId) throw new ApiError(400, "leaseId is required");

  const lease = await prisma.lease.findFirst({ where: { leaseId, tenantId }, include: { field: true } });
  if (!lease) throw new ApiError(404, "Lease not found");
  if (lease.status === "CANCELLED") throw new ApiError(400, "Lease is cancelled");

  const updated = await prisma.lease.update({
    where: { leaseId },
    data: { approvalStatus: "APPROVED", approvedById: adminId, approvedAt: new Date(), status: "ACTIVE" },
    include: { field: true },
  });

  // Credit lease amount to the farmer wallet on first approval
  if (lease.status !== "ACTIVE") {
    const farmerId = lease.field?.farmerId as string | undefined;
    if (farmerId) {
      await creditLeaseToFarmer({
        farmerId,
        tenantId,
        amount: String(lease.rentAmount),
        referenceId: lease.leaseId,
      });
    }
  }

  return res.status(200).json(new ApiResponse(200, updated, "Lease approved"));
});

// POST /admin/leases/:leaseId/reject
export const rejectLease = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { leaseId } = req.params;
  if (!leaseId) throw new ApiError(400, "leaseId is required");

  const lease = await prisma.lease.findFirst({ where: { leaseId, tenantId } });
  if (!lease) throw new ApiError(404, "Lease not found");

  const updated = await prisma.lease.update({
    where: { leaseId },
    data: { approvalStatus: "REJECTED", approvedById: adminId, approvedAt: new Date(), status: "CANCELLED", cancelledAt: new Date() },
  });

  return res.status(200).json(new ApiResponse(200, updated, "Lease rejected"));
});


// GET /admin/leases/approved
export const getApprovedLeases = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const leases = await prisma.lease.findMany({
    where: { tenantId, approvalStatus: "APPROVED" },
    include: {
      field: {
        include: {
          farmer: { select: { farmerId: true, username: true, email: true, fullName: true } },
        },
      },
      approvedBy: { select: { farmerId: true, username: true, email: true } },
    },
    orderBy: { approvedAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, leases, "Approved leases"));
});

// ADMIN: GET /admin/leases (all leases)
export const getAllLeasesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const leases = await prisma.lease.findMany({
    where: { tenantId },
    include: {
      field: { include: { farmer: { select: { farmerId: true, username: true, email: true, fullName: true } } } },
      approvedBy: { select: { farmerId: true, username: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, leases, "All leases"));
});

// ADMIN: PATCH /admin/leases/:leaseId/status  { status }
export const updateLeaseStatusAdmin = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { leaseId } = req.params;
  const { status } = req.body as { status?: string };
  if (!leaseId || !status) throw new ApiError(400, "leaseId and status are required");

  const existing = await prisma.lease.findFirst({ where: { leaseId, tenantId } });
  if (!existing) throw new ApiError(404, "Lease not found");

  const data: any = { status };
  // Soft cancel tracking
  if (status === "CANCELLED") {
    data.cancelledAt = new Date();
    data.approvalStatus = existing.approvalStatus === "APPROVED" ? existing.approvalStatus : "REJECTED";
  }
  // Approving via status ACTIVE
  if (status === "ACTIVE") {
    data.approvalStatus = "APPROVED";
    data.approvedById = adminId;
    data.approvedAt = new Date();
  }

  const updated = await prisma.lease.update({
    where: { leaseId },
    data,
    include: { field: true },
  });


  // Credit lease amount when status transitions to ACTIVE (first time)
  if (status === "ACTIVE" && existing.status !== "ACTIVE") {
    const leaseWithField = await prisma.lease.findUnique({ where: { leaseId }, include: { field: true } });
    const farmerId = leaseWithField?.field?.farmerId;
    if (farmerId) {
      await creditLeaseToFarmer({
        farmerId,
        tenantId,
        amount: String(leaseWithField?.rentAmount ?? "0"),
        referenceId: leaseId,
      });
    }
  }


  return res.status(200).json(new ApiResponse(200, updated, "Lease status updated"));
});

// ADMIN: PUT /admin/leases/:leaseId (edit amounts/dates)
export const updateLeaseAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { leaseId } = req.params;
  if (!leaseId) throw new ApiError(400, "leaseId is required");

  const existing = await prisma.lease.findFirst({ where: { leaseId, tenantId } });
  if (!existing) throw new ApiError(404, "Lease not found");

  const { rentAmount, endDate, profitSharePct, modelType } = req.body as any;

  const updated = await prisma.lease.update({
    where: { leaseId },
    data: {
      ...(rentAmount !== undefined ? { rentAmount: rentAmount === null ? null : String(rentAmount) } : {}),
      ...(profitSharePct !== undefined ? { profitSharePct: profitSharePct === null ? null : String(profitSharePct) } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(String(endDate)) : null } : {}),
      ...(modelType !== undefined ? { modelType } : {}),
    },
  });

  return res.status(200).json(new ApiResponse(200, updated, "Lease updated"));
});

// ADMIN: DELETE /admin/leases/:leaseId
export const deleteLeaseAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { leaseId } = req.params;
  if (!leaseId) throw new ApiError(400, "leaseId is required");

  const existing = await prisma.lease.findFirst({ where: { leaseId, tenantId } });
  if (!existing) throw new ApiError(404, "Lease not found");

  await prisma.lease.delete({ where: { leaseId } });
  return res.status(200).json(new ApiResponse(200, null, "Lease deleted"));
});

// POST /admin/users/:farmerId/role { role }
export const setUserRole = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { farmerId } = req.params;
  const { role } = req.body as { role?: "FARMER" | "ADMIN" };
  if (!farmerId || !role) throw new ApiError(400, "farmerId and role required");

  const updated = await prisma.farmer.update({
    where: { farmerId },
    data: { role },
    select: { farmerId: true, username: true, email: true, role: true },
  });
  return res.status(200).json(new ApiResponse(200, updated, "Role updated"));
});

// POST /admin/tenants { name, tenantId? }
export const createTenant = asyncHandler(async (req: Request, res: Response) => {
  const { name, tenantId } = req.body as { name?: string; tenantId?: string };
  if (!name) throw new ApiError(400, "name is required");

  const t = await prisma.tenant.create({
    data: { name, tenantId: tenantId ?? undefined },
  });
  return res.status(201).json(new ApiResponse(201, t, "Tenant created"));
});