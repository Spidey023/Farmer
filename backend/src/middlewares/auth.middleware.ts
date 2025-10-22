import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";


export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace("Bearer ", "") ||
    "";

  if (!token) throw new ApiError(401, "Unauthorized");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as JwtPayload;
    if(!decoded.id){
        throw new ApiError(401, "Unauthorized");
    }
    
        const user = await prisma.farmer.findUnique({
            where: {farmerId: decoded.id},
            select:{farmerId:true, username:true, email:true, password:true}
        })
        if(!user){
            throw new ApiError(401, "Unauthorized");
        }
        req.user = {
            id: user.farmerId,
            username: user.username,
            email: user.email,
            password: user.password
        }
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized");
    }
});
