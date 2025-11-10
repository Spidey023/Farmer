import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";

const addToCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const { productId, quantity } = req.body;

    if (!farmerId) {
      throw new ApiError(401, "Unauthorized");
    }
    if (!productId || quantity <= 0) {
      throw new ApiError(400, "Invalid cart data");
    }

    const product = await prisma.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    let cart = await prisma.cart.findFirst({
      where: { farmerId, status: "ACTIVE" },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          farmerId,
          status: "ACTIVE",
        },
      });
    }

    const unitPrice = product.price;
    const qty = quantity; // snapshot

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.cartId, productId },
      },
      update: { qty: { increment: qty } }, // adds to existing
      create: { cartId: cart.cartId, productId, qty, unitPrice },
    });

    res.status(200).json({
      status: "success",
      data: [cart, cartItem],
      message: "Product added to cart successfully",
    });
  }
);

const updateCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for updating cart
    const farmerId = (req as any).user.id;
    const { productId, quantity } = req.body;

    if (!farmerId) {
      throw new ApiError(401, "Unauthorized");
    }
    if (!productId || quantity <= 0) {
      throw new ApiError(400, "Invalid cart data");
    }

    const cart = await prisma.cart.findFirst({
      where: { farmerId, status: "ACTIVE" },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const product = await prisma.product.findUnique({
      where: { productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const updatedCartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.cartId, productId },
      },
      update: { qty: quantity }, // set new quantity
      create: {
        cartId: cart.cartId,
        productId,
        qty: quantity,
        unitPrice: product.price,
      }, // unitPrice should be fetched from product
    });

    res.status(200).json({
      status: "success",
      data: updatedCartItem,
      message: "Cart item updated successfully",
    });
  }
);

const getCartByUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for getting cart by user

    const farmerId = (req as any).user.id;

    if (!farmerId) {
      throw new ApiError(401, "Unauthorized");
    }

    const cart = await prisma.cart.findFirst({
      where: { farmerId, status: "ACTIVE" },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    res.status(200).json({
      status: "success",
      data: cart,
      message: "Cart retrieved successfully",
    });
  }
);

const deleteCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for deleting cart
    const farmerId = (req as any).user.id;

    if (!farmerId) {
      throw new ApiError(401, "Unauthorized");
    }

    const cart = await prisma.cart.findFirst({
      where: { farmerId, status: "ACTIVE" },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.cartId },
    });

    await prisma.cart.delete({
      where: { cartId: cart.cartId },
    });

    res.status(200).json({
      status: "success",
      message: "Cart deleted successfully",
    });
  }
);

export { addToCart, updateCart, getCartByUser, deleteCart };
