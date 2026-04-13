import { Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { prisma } from "../db";

// GET /analytics/yield
// Returns yield summary per field and season.
export const getYieldSummary = asyncHandler(async (req: Request, res: Response) => {
  const farmerId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const plans = await prisma.fieldSeasonPlan.findMany({
    where: {
      tenantId,
      field: { farmerId },
    },
    include: {
      field: { select: { fieldId: true, surveyNumber: true, acres: true, region: true } },
      season: { select: { seasonId: true, name: true } },
      crop: { select: { cropId: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate expected/actual yields
  const rows = plans.map((p) => ({
    fieldId: p.fieldId,
    field: p.field,
    seasonId: p.seasonId,
    season: p.season,
    crop: p.crop,
    expectedYield: p.expectedYield ? Number(p.expectedYield) : 0,
    actualYield: p.actualYield ? Number(p.actualYield) : 0,
    cropStatus: p.cropStatus,
  }));

  return res.status(200).json(new ApiResponse(200, rows, "Yield analytics"));
});

// GET /analytics/profitability/:fieldId
export const getFieldProfitability = asyncHandler(async (req: Request, res: Response) => {
  const farmerId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { fieldId } = req.params;
  if (!fieldId) throw new ApiError(400, "fieldId is required");

  const field = await prisma.field.findFirst({ where: { fieldId, farmerId, tenantId } });
  if (!field) throw new ApiError(404, "Field not found");

  const plans = await prisma.fieldSeasonPlan.findMany({
    where: { fieldId, tenantId },
    include: { crop: true, season: true },
    orderBy: { createdAt: "desc" },
  });

  // Simple profitability: revenue = yield * crop.marketPricePerUnit
  // uses actualYield if available else expectedYield; cost uses actualCost else expectedCost
  const lines = plans.map((p) => {
    const y = p.actualYield ? Number(p.actualYield) : p.expectedYield ? Number(p.expectedYield) : 0;
    const c = p.actualCost ? Number(p.actualCost) : p.expectedCost ? Number(p.expectedCost) : 0;
    const price = p.crop.marketPricePerUnit ? Number(p.crop.marketPricePerUnit) : 0;
    const revenue = y * price;
    const profit = revenue - c;
    return {
      planId: p.planId,
      season: p.season.name,
      crop: p.crop.name,
      yield: y,
      price,
      revenue,
      cost: c,
      profit,
      cropStatus: p.cropStatus,
    };
  });

  const totals = lines.reduce(
    (acc, l) => {
      acc.revenue += l.revenue;
      acc.cost += l.cost;
      acc.profit += l.profit;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0 }
  );

  return res.status(200).json(new ApiResponse(200, { field, totals, lines }, "Profitability"));
});
