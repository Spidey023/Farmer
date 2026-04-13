import { Request, Response } from "express";

import { SeasonType } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import ApiResponse from "../utils/ApiResponse";

// Create Season
export const createSeason = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) throw new ApiError(401, "Unauthorized");
  const { name, startDate, endDate } = req.body;

  if (!name || !startDate || !endDate) {
    throw new ApiError(400, "Name, startDate and endDate are required");
  }

  if (!Object.values(SeasonType).includes(name)) {
    throw new ApiError(400, "Invalid SeasonType");
  }

  const existing = await prisma.season.findFirst({
    where: { tenantId, name },
  });

  if (existing) {
    throw new ApiError(400, "Season already exists for this tenant");
  }

  const overlap = await prisma.season.findFirst({
    where: {
      tenantId,
      OR: [
        {
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) },
        },
      ],
    },
  });

  if (overlap) {
    throw new ApiError(400, "Season dates overlap with existing season");
  }

  const season = await prisma.season.create({
    data: {
      tenantId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  res.json(new ApiResponse(200, season, "Season created successfully"));
};

export const getAllSeasons = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) throw new ApiError(401, "Unauthorized");

  const seasons = await prisma.season.findMany({
    where: { tenantId },
    orderBy: { startDate: "asc" },
  });

  res.json(new ApiResponse(200, seasons));
};

export const updateSeason = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) throw new ApiError(401, "Unauthorized");
  const { seasonId } = req.params;
  const { startDate, endDate } = req.body;

  const season = await prisma.season.findFirst({
    where: { seasonId, tenantId },
  });

  if (!season) {
    throw new ApiError(404, "Season not found");
  }

  // Prevent overlapping date ranges when updating.
  const nextStart = startDate ? new Date(startDate) : season.startDate;
  const nextEnd = endDate ? new Date(endDate) : season.endDate;
  if (nextStart > nextEnd) {
    throw new ApiError(400, "startDate must be before endDate");
  }

  const overlap = await prisma.season.findFirst({
    where: {
      tenantId,
      seasonId: { not: seasonId },
      startDate: { lte: nextEnd },
      endDate: { gte: nextStart },
    },
  });

  if (overlap) {
    throw new ApiError(400, "Season dates overlap with existing season");
  }

  const updated = await prisma.season.update({
    where: { seasonId },
    data: {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  res.json(new ApiResponse(200, updated, "Season updated successfully"));
};

export const deleteSeason = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) throw new ApiError(401, "Unauthorized");
  const { seasonId } = req.params;

  const used = await prisma.fieldSeasonPlan.findFirst({
    where: { tenantId, seasonId },
  });

  if (used) {
    throw new ApiError(400, "Season is already used in plans");
  }

  await prisma.season.deleteMany({
    where: { tenantId, seasonId },
  });

  res.json(new ApiResponse(200, null, "Season deleted successfully"));
};
