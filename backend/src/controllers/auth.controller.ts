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
  verifyRefreshToken,
} from "../utils/jwt";
import { hashPassowrd } from "../utils/hashPassword";
import { sha256 } from "../utils/tokenHash";

const generateAccessAndRefreshTokens = (userId: string) => {
  // generate access token
  const accessToken = generateAccessToken(userId);
  // generate refresh token
  const refreshToken = generateRefreshToken(userId);
  return { accessToken, refreshToken };
};

const registerFarmer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    console.log(username);

    if (!username || !email || !password) {
      throw new ApiError(400, "Please provide all required fields");
    }

    // Ensure default tenant exists (so we never crash on tenant lookups)
    const tenant = await prisma.tenant.upsert({
      where: { tenantId: "default" },
      update: {},
      create: { tenantId: "default", name: "Default Tenant" },
      select: { tenantId: true },
    });

    // check if user already exists (email OR username)
    const [byEmail, byUsername] = await Promise.all([
      prisma.farmer.findUnique({ where: { email }, select: { farmerId: true } }),
      prisma.farmer.findUnique({ where: { username }, select: { farmerId: true } }),
    ]);
    if (byEmail) throw new ApiError(400, "Email already registered");
    if (byUsername) throw new ApiError(400, "Username already taken");

    // hash password
    const newPassword = await hashPassowrd(password, 10);

    // create new user
    const newUser = await prisma.farmer.create({
      data: {
        username,
        email,
        password: newPassword,
        tenantId: tenant.tenantId,
        role: "FARMER",
        wallet: { create: { balance: "0", tenantId: tenant.tenantId } },
      },
      select: { farmerId: true, username: true, email: true },
    });
    res
      .status(200)
      .json(new ApiResponse(200, newUser, "User registered successfully"));
  }
);

type LoginRole = "FARMER" | "ADMIN" | "ANY";

const loginCore = (role: LoginRole) =>
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Please provide all required fields");
    }

    // check if user exists
    const existingUser = await prisma.farmer.findUnique({
      where: { email },
      select: {
        farmerId: true,
        username: true,
        email: true,
        password: true,
        role: true,
        tenantId: true,
      },
    });
    if (!existingUser) {
      throw new ApiError(400, "Invalid email or password");
    }

    // Optional role gate
    if (role !== "ANY" && existingUser.role !== role) {
      throw new ApiError(403, `Please use the ${existingUser.role.toLowerCase()} login.`);
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

    // Store refresh token (hashed) for rotation + revoke support
    await prisma.refreshToken.create({
      data: {
        farmerId: existingUser.farmerId,
        tenantId: "default",
        tokenHash: sha256(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const loggedInUser = await prisma.farmer.findUnique({
      where: { farmerId: existingUser.farmerId },
      select: { farmerId: true, username: true, email: true, fullName: true, role: true, tenantId: true },
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
          { user: loggedInUser, tokens },
          "User logged in successfully"
        )
      );
  });

// Backwards compatible login (accepts both roles)
const login = loginCore("ANY");
// Explicit role-based logins (nice UX + stricter guard)
const loginFarmer = loginCore("FARMER");
const loginAdmin = loginCore("ADMIN");

const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const rt = req.cookies?.refreshToken as string | undefined;
    if (rt) {
      await prisma.refreshToken.updateMany({
        where: { farmerId: userId, tokenHash: sha256(rt), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
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
    // verify refresh token using refresh secret
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Unauthorized");
    }

    const stored = await prisma.refreshToken.findFirst({
      where: {
        farmerId: decoded.id,
        tokenHash: sha256(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!stored) throw new ApiError(401, "Unauthorized");

    // rotate: revoke old
    await prisma.refreshToken.update({
      where: { tokenId: stored.tokenId },
      data: { revokedAt: new Date() },
    });
    // generate new access + refresh token
    const tokens = generateAccessAndRefreshTokens(decoded.id);

    await prisma.refreshToken.create({
      data: {
        farmerId: decoded.id,
        tenantId: stored.tenantId,
        tokenHash: sha256(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
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
      .json(new ApiResponse(200, { accessToken: tokens.accessToken }, "Token refreshed successfully"));
  }
);

const dashboard = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    // const page = Number(req.query.page ?? 1);
    // const limit = Number(req.query.limit ?? 20);

    if (!userId) {
      throw new ApiError(400, "User not found");
    }

    const dashboardData = await prisma.$transaction(async (pms) => {
      // 1) Fetch user with relations
      const user = await pms.farmer.findUnique({
        where: { farmerId: userId },
        select: {
          farmerId: true,
          fullName: true,
          email: true,
          username: true,
          role: true,
          tenantId: true,
          phoneNumber: true,
          address: true,
          wallet: {
            select: {
              walletId: true,
              balance: true,
              transactions: {
                orderBy: { createdAt: "desc" },
                take: 20,
              },
            },
          },
          carts: true,
          fields: { include: { leases: true } }, // all fields with leases
          orders: {
            select: {
              orderId: true,
              farmerId: true,
              cartId: true,
              status: true,
              total: true,
              placedAt: true,
              paymentMethod: true,
              paymentStatus: true,
              createdAt: true,
              updatedAt: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
          }, // all orders
        },
      });

      if (!user) {
        throw new ApiError(404, "Farmer not found");
      }

      // 2) Attach crops per field (optional)
      const fieldsWithCrops = await Promise.all(
        user.fields.map(async (field) => {
          if (!field.currentCropId) {
            // no crop linked to this field
            return { ...field, crops: [] as any[] };
          }

          const crops = await pms.crop.findMany({
            where: { cropId: field.currentCropId ?? undefined }, // 👈 TS-safe
          });

          const fieldSeasonPlan = await pms.fieldSeasonPlan.findMany({
            where: { fieldId: field.fieldId },
            include: { season: true, crop: true },
            orderBy: { createdAt: "desc" },
          });

          const fieldSnapchat = await pms.fieldSnapshot.findMany({
            where: { fieldId: field.fieldId },
            orderBy: { createdAt: "desc" },
            // skip: (page - 1) * limit,
            // take: limit,
            take: 1,
          });

          // Keep key name aligned with Prisma relation: `leases`
          // Use the relation already loaded in `user.fields` when available.
          const leases = field.leases ??
            (await pms.lease.findMany({
              where: { fieldId: field.fieldId },
              orderBy: { createdAt: "desc" },
            }));

          return { ...field, crops, fieldSeasonPlan, fieldSnapchat, leases };
        })
      );
      // cart data
      // 2) Attach crops per field (optional)
      const cartsWithItems = await Promise.all(
        user.carts.map(async (cart) => {
          const items = await pms.cartItem.findMany({
            where: { cartId: cart.cartId },
            include: { product: true },
            orderBy: { createdAt: "desc" },
          });

          return { ...cart, items };
        })
      );

      //    const fieldSeasonPlan = await Promise.all(
      //  await pms.fieldSeasonPlan.findMany({where:{fieldId:user.farmerId}}).map(async (field) => {
      //     if (!field.currentCropId) {
      //       // no crop linked to this field
      //       return { ...field, crops: [] as any[] };
      //     }

      //     const crops = await pms.crop.findMany({
      //       where: { cropId: field.currentCropId ?? undefined }, // 👈 TS-safe
      //     });

      //     return { ...field, crops };
      //   })
      // );

      // 3) Return combined dashboard object
      return {
        ...user,
        fields: fieldsWithCrops,
        carts: cartsWithItems,
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          dashboardData,
          "Dashboard data fetched successfully"
        )
      );
  }
);

const getWheather = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      console.log(apiKey);

      if (!apiKey) {
        console.error("Missing OPENWEATHER_API_KEY in .env");
        return res
          .status(500)
          .json({ message: "Server weather config error (no API key)" });
      }

      const { lat, lon, city } = req.body.params || req.body;
      console.log(lat, lon, city);

      console.log("RAW API KEY =>", `[${apiKey}]`);
      console.log("KEY LENGTH =>", apiKey?.length);
      let url = "https://api.openweathermap.org/data/2.5/weather?units=metric";

      // If latitude & longitude are provided
      if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}`;
      }
      // If city is provided
      else if (city) {
        url += `&q=${city}`;
      }
      // Default fallback location
      else {
        url += `&q=Binghamton`;
      }

      url += `&appid=${apiKey}`;

      console.log("Calling weather URL:", url);

      const response = await fetch(url);

      console.log("Weather status:", response.status, response.statusText);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Weather API error body:", errorBody);
        return res
          .status(500)
          .json({ message: "Weather API error", details: errorBody });
      }

      const data = await response.json();

      return res.json({
        city: data.name,
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        all: data,
      });
    } catch (error) {
      console.error("Weather Error:", error);
      return res.status(500).json({ message: "Failed to fetch weather" });
    }
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

export {
  registerFarmer,
  login,
  loginFarmer,
  loginAdmin,
  logout,
  refreshToken,
  dashboard,
  getWheather,
};
