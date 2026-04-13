import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler"; // keep your path/name
import ApiError from "../utils/ApiError";
import { prisma } from "../db";

// Small helper: validate qty
const parseQty = (qty: any) => {
  const n = Number(qty);
  if (!Number.isInteger(n)) return null;
  return n;
};

const addToCart = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    const { productId, quantity } = req.body;

    if (!farmerId) throw new ApiError(401, "Unauthorized");
    if (!productId) throw new ApiError(400, "ProductId is required");

    const qty = parseQty(quantity);
    if (qty === null || qty <= 0) {
      throw new ApiError(400, "Quantity must be a positive integer");
    }

    // Wrap everything in a transaction to avoid race conditions
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { productId } });
      if (!product) throw new ApiError(404, "Product not found");

      // find or create ACTIVE cart
      let cart = await tx.cart.findFirst({
        where: { farmerId, status: "ACTIVE" },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { farmerId, status: "ACTIVE" },
        });
      }

      const unitPrice = product.price; // snapshot at time of add

      const cartItem = await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.cartId, productId } },
        update: {
          qty: { increment: qty },
          // optional: keep unitPrice in sync with latest product price
          unitPrice,
        },
        create: { cartId: cart.cartId, productId, qty, unitPrice },
        include: { product: true },
      });

      // Return the full cart with items+products (useful for UI)
      const fullCart = await tx.cart.findUnique({
        where: { cartId: cart.cartId },
        include: { items: { include: { product: true } } },
      });

      if (!fullCart) throw new ApiError(500, "Failed to load cart");

      const totalQty = fullCart.items.reduce((sum, i) => sum + i.qty, 0);
      const totalAmount = fullCart.items.reduce(
        (sum, i) => sum + i.qty * Number(i.unitPrice),
        0
      );

      return { cart: fullCart, cartItem, totalQty, totalAmount };
    });

    return res.status(200).json({
      status: "success",
      data: result,
      message: "Product added to cart successfully",
    });
  }
);

const updateCart = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    const { productId, quantity } = req.body;

    if (!farmerId) throw new ApiError(401, "Unauthorized");
    if (!productId) throw new ApiError(400, "ProductId is required");

    const qty = parseQty(quantity);
    if (qty === null || qty < 0) {
      throw new ApiError(400, "Quantity must be 0 or a positive integer");
    }

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { farmerId, status: "ACTIVE" },
      });
      if (!cart) throw new ApiError(404, "Cart not found");

      // If qty is 0 => remove item
      if (qty === 0) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.cartId, productId },
        });
      } else {
        const product = await tx.product.findUnique({ where: { productId } });
        if (!product) throw new ApiError(404, "Product not found");

        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.cartId, productId } },
          update: {
            qty, // set new quantity
            unitPrice: product.price, // optional: refresh snapshot
          },
          create: {
            cartId: cart.cartId,
            productId,
            qty,
            unitPrice: product.price,
          },
        });
      }

      const fullCart = await tx.cart.findUnique({
        where: { cartId: cart.cartId },
        include: { items: { include: { product: true } } },
      });

      if (!fullCart) throw new ApiError(500, "Failed to load cart");

      const totalQty = fullCart.items.reduce((sum, i) => sum + i.qty, 0);
      const totalAmount = fullCart.items.reduce(
        (sum, i) => sum + i.qty * Number(i.unitPrice),
        0
      );

      return { cart: fullCart, totalQty, totalAmount };
    });

    return res.status(200).json({
      status: "success",
      data: result,
      message:
        qty === 0 ? "Item removed from cart" : "Cart item updated successfully",
    });
  }
);

const getCartByUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    if (!farmerId) throw new ApiError(401, "Unauthorized");

    const cart = await prisma.cart.findFirst({
      where: { farmerId, status: "ACTIVE" },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart) {
      // In many apps, returning empty cart is nicer than 404.
      // If you prefer 404, keep your old behavior.
      return res.status(200).json({
        status: "success",
        data: { cart: null, totalQty: 0, totalAmount: 0 },
        message: "No active cart",
      });
    }

    const totalQty = cart.items.reduce((sum, i) => sum + i.qty, 0);
    const totalAmount = cart.items.reduce(
      (sum, i) => sum + i.qty * Number(i.unitPrice),
      0
    );

    return res.status(200).json({
      status: "success",
      data: { cart, totalQty, totalAmount },
      message: "Cart retrieved successfully",
    });
  }
);

const deleteCart = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    if (!farmerId) throw new ApiError(401, "Unauthorized");

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { farmerId, status: "ACTIVE" },
      });

      if (!cart) throw new ApiError(404, "Cart not found");

      await tx.cartItem.deleteMany({ where: { cartId: cart.cartId } });
      await tx.cart.delete({ where: { cartId: cart.cartId } });
    });

    return res.status(200).json({
      status: "success",
      message: "Cart deleted successfully",
    });
  }
);

// Remove a single product from the active cart
const removeItemFromCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const farmerId = (req as any).user.id;
    const productId = req.params.productId;

    if (!farmerId) {
      throw new ApiError(401, "Unauthorized");
    }
    if (!productId) {
      throw new ApiError(400, "Product not provided");
    }

    const cart = await prisma.cart.findFirst({
      where: { farmerId, status: "ACTIVE" },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.cartId, productId },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { cartId: cart.cartId },
      include: { items: { include: { product: true } } },
    });

    return res.status(200).json({
      status: "success",
      data: updatedCart,
      message: "Item removed from cart",
    });
  }
);

export { addToCart, updateCart, getCartByUser, deleteCart, removeItemFromCart };
