import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";

/**
 * Requires an authenticated user with role=FARMER.
 * Blocks ADMIN from farmer-only routes.
 */
export const requireFarmer = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as { role?: string } | undefined;
    if (!user || user.role !== "FARMER") {
      throw new ApiError(403, "Farmer access required");
    }
    next();
  }
);
