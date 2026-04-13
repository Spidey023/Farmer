import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";

/**
 * Requires an authenticated user with role=ADMIN.
 */
export const requireAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as { role?: string } | undefined;
    if (!user || user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required");
    }
    next();
  }
);
