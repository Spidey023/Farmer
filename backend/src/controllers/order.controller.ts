import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import { Decimal } from "@prisma/client/runtime/library";
import { OrderStatus, PaymentStatus } from "../generated/prisma";
import ApiResponse from "../utils/ApiResponse";

const createOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for posting an order
    const formerId = (req as any).user.id;
    const { cartId, paymentMethod } = req.body;

    // const cart = await prisma.cart.findUnique({
    //   where: { cartId, farmerId: formerId, status: "ACTIVE" },
    // });
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId,
      },
    });

    if (!formerId || !cartItems || cartItems.length === 0) {
      throw new ApiError(400, "Invalid order data");
    }
    console.log("cartitems", cartItems);

    const order = await prisma.$transaction(async (tx) => {
      const productIds = cartItems.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, name: true, price: true, stock: true },
      });

      const byId = new Map(products.map((p) => [p.productId, p]));

      for (const item of cartItems) {
        const product = byId.get(item.productId);
        if (!product) {
          throw new ApiError(400, `Product not found: ${item.productId}`);
        }
        if (item.qty <= 0) {
          throw new ApiError(
            400,
            `Invalid quantity for product: ${product.name}`
          );
        }
        if (product.stock < item.qty) {
          throw new ApiError(
            400,
            `Insufficient stock for product: ${product.name}`
          );
        }
      }

      const lines = cartItems.map((item: any) => {
        const product = byId.get(item.productId)!;
        return {
          productId: product.productId,
          qty: item.qty,
          unitPrice: product.price,
          fieldId: item.fieldId ?? null,
        };
      });
      console.log(lines, "lines");

      const totalNumber = lines.reduce(
        (sum: any, line: any) => sum + Number(line.unitPrice) * line.qty,
        0
      );
      console.log(totalNumber);

      const total = Decimal(totalNumber.toFixed(2));
      console.log(total);

      let newOrder;
      return (newOrder = await tx.order.create({
        data: {
          farmerId: formerId,
          status: OrderStatus.PENDING,
          total,
          placedAt: new Date(),
          paymentMethod: paymentMethod || null,
          paymentStatus: PaymentStatus.INITIATED,
          items: {
            create: lines,
          },
        },
        include: {
          items: true,
        },
      }));
    });

    const updateCartStatus = await prisma.cart.updateMany({
      where: { cartId, farmerId: formerId, status: "ACTIVE" },
      data: { status: "CHECKED_OUT" },
    });

    console.log(updateCartStatus);
    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order created successfully"));
  }
);

const getOrdersByUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const formerId = (req as any).user.id;

    if (!formerId) {
      throw new ApiError(400, "Invalid user");
    }

    if (!formerId) {
      throw new ApiError(400, "Invalid user");
    }

    const orders = await prisma.order.findMany({
      where: { farmerId: formerId },
      include: {
        items: true,
      },
      orderBy: {
        placedAt: "desc",
      },
    });

    if (orders.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No orders found for user"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders fetched successfully"));
  }
);

export { createOrder, getOrdersByUser };
