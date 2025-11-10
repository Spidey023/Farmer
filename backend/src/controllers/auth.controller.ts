import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { CookieOptions } from "express";

import ApiResponse from "../utils/ApiResponse";

import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyJWTToken,
} from "../utils/jwt";
import { hashPassowrd } from "../utils/hashPassword";

const generateAccessAndRefreshTokens = (userId: string) => {
  // generate access token
  const accessToken = generateAccessToken(userId);
  // generate refresh token
  const refreshToken = generateRefreshToken(userId);
  return { accessToken, refreshToken };
};

const registerFarmer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("he");

    const { username, email, password } = req.body;
    console.log("visited");

    if (!username || !email || !password) {
      throw new ApiError(400, "Please provide all required fields");
    }

    // check if user already exists
    const existingUser = await prisma.farmer.findUnique({
      where: { email },
      select: { farmerId: true },
    });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    // hash password
    const newPassword = await hashPassowrd(password, 10);

    // create new user
    const newUser = await prisma.farmer.create({
      data: {
        username,
        email,
        password: newPassword,
      },
    });
    res
      .status(200)
      .json(new ApiResponse(200, newUser, "User registered successfully"));
  }
);

const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Please provide all required fields");
    }

    // check if user exists
    const existingUser = await prisma.farmer.findUnique({
      where: { email },
      select: { farmerId: true, username: true, email: true, password: true },
    });
    if (!existingUser) {
      throw new ApiError(400, "Invalid email or password");
    }

    // verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid email or password");
    }

    const tokens = generateAccessAndRefreshTokens(existingUser.farmerId);

    const loggedInUser = await prisma.farmer.update({
      where: { farmerId: existingUser.farmerId },
      data: { refreshToken: tokens.refreshToken },
      select: { farmerId: true, username: true, email: true, fullName: true },
    });
    // set cookies
    let options: CookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return res
      .status(200)
      .cookie("accessToken", tokens.accessToken, options)
      .cookie("refreshToken", tokens.refreshToken, options)
      .json(
        new ApiResponse(
          200,
          [loggedInUser, tokens],
          "User logged in successfully"
        )
      );
  }
);

const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    // remove refresh token from database
    await prisma.farmer.update({
      where: { farmerId: userId },
      data: { refreshToken: null },
    });
    // clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  }
);

const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.headers.authorization?.replace("Bearer ", "") ||
      req.body.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized");
    }
    // verify refresh token
    let decoded;
    try {
      decoded = verifyJWTToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, "Unauthorized");
    }

    // check if refresh token is valid
    const user = await prisma.farmer.findUnique({
      where: { farmerId: decoded.id },
      select: {
        farmerId: true,
        username: true,
        email: true,
        refreshToken: true,
      },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Unauthorized");
    }
    // generate new access token
    const tokens = generateAccessAndRefreshTokens(user.farmerId);

    // update refresh token in database
    await prisma.farmer.update({
      where: { farmerId: user.farmerId },
      data: { refreshToken: tokens.refreshToken },
    });

    // set cookies
    let options: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return res
      .status(200)
      .cookie("accessToken", tokens.accessToken, options)
      .cookie("refreshToken", tokens.refreshToken, options)
      .json(new ApiResponse(200, null, "Token refreshed successfully"));
  }
);

const dashboard = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;

    if (!userId) {
      throw new ApiError(400, "User not found");
    }

    // fetch user details
    const user = await prisma.farmer.findUnique({
      where: { farmerId: userId },
      select: {
        farmerId: true,
        username: true,
        email: true,
        fullName: true,
        address: true,
        phoneNumber: true,
      },
    });

    const field = await prisma.field.findMany({
      where: { farmerId: userId },
    });
    let data = [{ ...user }, { ...field }];
    return res
      .status(200)
      .json(new ApiResponse(200, data, "Dashboard data fetched successfully"));
  }
);
// const getAllEnum = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const landTypes =
//       await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"LandType")) AS land_type;`;
//     const soilTypes =
//       await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"SoilType")) AS soil_type;`;
//     const cropTypes =
//       await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"CropType")) AS crop_type;`;
//     const irrigationTypes =
//       await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"IrrigationType")) AS irrigation_type;`;
//       const fieldplanStatuses =
//       await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"FieldPlanStatus")) AS field_plan_status;`;
//       const ordersStatuses =
//       await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"OrderStatus")) AS order_status;`;
//       const leaseModel =
//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { landTypes, soilTypes, cropTypes },
//           "Enums fetched successfully"
//         )
//       );
//   }
// );

export { registerFarmer, login, logout, refreshToken, dashboard };
