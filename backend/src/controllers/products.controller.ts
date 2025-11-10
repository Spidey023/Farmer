import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import { prisma } from "../db";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

const getAllProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for getting products

    const products = await prisma.product.findMany();
    if (!products || products.length === 0) {
      throw new ApiError(404, "No products found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, products, "Products retrieved successfully"));
  }
);



export { getAllProducts };
