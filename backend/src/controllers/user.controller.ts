import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import ApiResponse from "../utils/ApiResponse";

const updateFarmerProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    console.log("hello");

    if (!userId) {
      throw new ApiError(400, "User not found");
    }

    const { username, phoneNumber, address, fullName } = req.body;

    const updatedUser = await prisma.farmer.update({
      where: { farmerId: userId },
      data: {
        username,
        phoneNumber,
        address,
        fullName,
      },
      select: {
        farmerId: true,
        username: true,
        email: true,
        phoneNumber: true,
        address: true,
        fullName: true,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "User profile updated successfully")
      );
  }
);

const deleteFarmerProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;

    if (!userId) {
      throw new ApiError(400, "User not found");
    }

    const farmer = await prisma.farmer.findUnique({
      where: { farmerId: userId },
    });

    if (!farmer) throw new ApiError(400, "user not found");

    let deletedFarmer;
    try {
      deletedFarmer = await prisma.farmer.delete({
        where: { farmerId: farmer.farmerId },
      });
    } catch (error) {
      throw new ApiError(400, "Error Deleting farmer");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deletedFarmer, "Farmer deleted successfully"));
  }
);

const getFarmerProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // const username = req.params.username || (req as any).user.username;
    const farmerId = (req as any).user.id;

    if (!farmerId) throw new ApiError(400, "User not found");

    const farmer = await prisma.farmer.findUnique({
      where: { farmerId },
      select: {
        farmerId: true,
        email: true,
        username: true,
        fullName: true,
        phoneNumber: true,
        address: true,
        fields: true, // include relation by selecting it
        orders: true, // same here
      },
    });

    if (!farmer) throw new ApiError(400, "User Not Found");

    return res.status(200).json(new ApiResponse(200, farmer, "User Found"));
  }
);

export { getFarmerProfile, updateFarmerProfile, deleteFarmerProfile };
