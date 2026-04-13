import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";

// NOTE: Admin-only create/update/delete is enforced at the route layer via requireAdmin.

const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "ProductId is required");

  const product = await prisma.product.findUnique({ where: { productId } });
  if (!product) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, imageUrl, category, price, unit, stock } = req.body;
  const file = (req as any).file as Express.Multer.File | undefined;
  const resolvedImageUrl = file ? `/uploads/${file.filename}` : imageUrl;

  if (!name || !category || price === undefined || price === null) {
    throw new ApiError(400, "name, category, price and stock are required");
  }
  if (stock === undefined || stock === null || stock === "") {
    throw new ApiError(400, "name, category, price and stock are required");
  }

  const parsedStock = Number.parseInt(String(stock), 10);
  if (Number.isNaN(parsedStock) || parsedStock < 0) {
    throw new ApiError(400, "stock must be a valid non-negative integer");
  }

  const parsedPrice = new Prisma.Decimal(String(price));

  const p = await prisma.product.create({
    data: {
      name: String(name).trim(),
      description: description !== undefined && description !== null && String(description).trim() !== "" ? String(description).trim() : null,
      imageUrl: resolvedImageUrl !== undefined && resolvedImageUrl !== null && String(resolvedImageUrl).trim() !== "" ? String(resolvedImageUrl).trim() : null,
      category: String(category).trim(),
      unit: unit !== undefined && unit !== null && String(unit).trim() !== "" ? String(unit).trim() : null,
      price: parsedPrice,
      stock: parsedStock,
      tenantId: "default",
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, p, "Product created successfully"));
});


const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "ProductId is required");

  const existing = await prisma.product.findUnique({ where: { productId } });
  if (!existing) throw new ApiError(404, "Product not found");

  const { name, description, imageUrl, category, price, unit, stock } = req.body;
  const file = (req as any).file as Express.Multer.File | undefined;
  const resolvedImageUrl = file ? `/uploads/${file.filename}` : imageUrl;

  const updated = await prisma.product.update({
    where: { productId },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(description !== undefined
        ? { description: description ? String(description).trim() : null }
        : {}),
      ...(resolvedImageUrl !== undefined
        ? { imageUrl: resolvedImageUrl ? String(resolvedImageUrl).trim() : null }
        : {}),
      ...(category !== undefined ? { category: String(category).trim() } : {}),
      ...(unit !== undefined ? { unit: unit ? String(unit).trim() : null } : {}),
      ...(price !== undefined ? { price: new Prisma.Decimal(String(price)) } : {}),
      ...(stock !== undefined ? { stock: Number.parseInt(String(stock), 10) } : {}),
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!productId) throw new ApiError(400, "ProductId is required");

  const existing = await prisma.product.findUnique({ where: { productId } });
  if (!existing) throw new ApiError(404, "Product not found");

  await prisma.product.delete({ where: { productId } });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully"));
});

export { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
