import { Request, Response } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../utils/ayncHnadler";

// Used for frontend dropdowns. Tenant-scoped.
export const listSeasons = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) {
    return res.status(401).json({
      statusCode: 401,
      data: [],
      message: "Unauthorized",
      success: false,
    });
  }

  let seasons = await prisma.season.findMany({
    where: { tenantId },
    orderBy: { startDate: "desc" },
    select: {
      seasonId: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });

  // If tenant is fresh and no seasons are seeded, create defaults so dropdowns work.
  if (!seasons || seasons.length === 0) {
    const now = new Date();
    const plusDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    await prisma.tenant.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId, name: "Default Tenant" },
    });

    await prisma.season.createMany({
      data: [
        { tenantId, name: "RABI", startDate: now, endDate: plusDays(120) },
        { tenantId, name: "KHARIF", startDate: now, endDate: plusDays(120) },
        { tenantId, name: "SUMMER", startDate: now, endDate: plusDays(90) },
      ],
      skipDuplicates: true,
    });

    seasons = await prisma.season.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
      select: {
        seasonId: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });
  }

  return res.status(200).json({
    statusCode: 200,
    data: seasons,
    message: "Seasons retrieved successfully",
    success: true,
  });
});
