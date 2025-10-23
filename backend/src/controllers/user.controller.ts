import { CookieOptions, NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import { hashPassowrd } from "../utils/hashPassword";
import ApiResponse from "../utils/ApiResponse";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyJWTToken,
} from "../utils/jwt";

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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return res
      .status(200)
      .cookie("accessToken", tokens.accessToken, options)
      .cookie("refreshToken", tokens.refreshToken, options)
      .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    return res
      .status(200)
      .cookie("accessToken", tokens.accessToken, options)
      .cookie("refreshToken", tokens.refreshToken, options)
      .json(new ApiResponse(200, null, "Token refreshed successfully"));
  }
);

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

export {
  registerFarmer,
  login,
  getFarmerProfile,
  updateFarmerProfile,
  deleteFarmerProfile,
  refreshToken,
  logout,
};
