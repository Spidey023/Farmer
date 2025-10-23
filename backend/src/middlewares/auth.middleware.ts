import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import { verifyJWTToken } from "../utils/jwt";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.cookies);

    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "") ||
      "";
    console.log("Token in auth middleware:", token);

    if (!token) throw new ApiError(401, "Unauthorized");

    console.log("here");
    try {
      const decoded = verifyJWTToken(token);
      console.log("decoded", decoded);

      if (!decoded.id) {
        throw new ApiError(401, "Unauthorized");
      }

      const user = await prisma.farmer.findUnique({
        where: { farmerId: decoded.id },
        select: { farmerId: true, username: true, email: true, password: true },
      });
      if (!user) {
        throw new ApiError(401, "Unauthorized");
      }
      (req as any).user = {
        id: user.farmerId,
        username: user.username,
        email: user.email,
        password: user.password,
      };
      next();
    } catch (error) {
      throw new ApiError(401, "Unauthorized");
    }
  }
);
