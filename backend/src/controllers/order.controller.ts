import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import { prisma } from "../db";
import { Decimal } from "@prisma/client/runtime/library";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import ApiResponse from "../utils/ApiResponse";

const createOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for posting an order
    const formerId = (req as any).user.id;
    const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
    const { cartId, paymentMethod, paymentProvider, providerPaymentId } = req.body as {
      cartId?: string;
      paymentMethod?: string;
      paymentProvider?: string;
      providerPaymentId?: string;
    };

    // const cart = await prisma.cart.findUnique({
    //   where: { cartId, farmerId: formerId, status: "ACTIVE" },
    // });
    if (!cartId) {
      throw new ApiError(400, "cartId is required");
    }

    // Ensure cart belongs to farmer and is active
    const cart = await prisma.cart.findFirst({
      where: { cartId, farmerId: formerId, status: "ACTIVE", tenantId },
      include: { items: true },
    });

    const cartItems = cart?.items ?? [];

    if (!formerId || !cartItems || cartItems.length === 0) {
      throw new ApiError(400, "Invalid order data");
    }
    console.log("cartitems", cartItems);

    const order = await prisma.$transaction(async (tx) => {
      const productIds = cartItems.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: { productId: { in: productIds }, tenantId },
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

      // NOTE: We do NOT decrement stock at order creation.
      // Stock is decremented when ADMIN marks the order as SHIPPED.

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

      // Optional: wallet payment
      if ((paymentMethod as any) === "WALLET") {
        const wallet = await tx.wallet.findUnique({ where: { farmerId: formerId } });
        if (!wallet) throw new ApiError(400, "Wallet not found");
        if (Number(wallet.balance) < Number(total)) {
          throw new ApiError(400, "Insufficient wallet balance");
        }
        await tx.wallet.update({
          where: { walletId: wallet.walletId },
          data: { balance: { decrement: String(total) } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.walletId,
            tenantId,
            type: "DEBIT",
            amount: String(total),
            referenceType: "ORDER",
            referenceId: cartId,
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          tenantId,
          farmerId: formerId,
          status: OrderStatus.PENDING,
          total,
          placedAt: new Date(),
          cartId,
          paymentMethod: (paymentMethod as any) || null,
          paymentStatus: (paymentMethod as any) === "WALLET" ? PaymentStatus.PAID : PaymentStatus.INITIATED,
          paymentProvider: (paymentProvider as any) || "OFFLINE",
          providerPaymentId: providerPaymentId || null,
          items: {
            create: lines,
          },
        },
        include: {
          items: true,
        },
      });

      // Clear cart items.
      // IMPORTANT: We intentionally do NOT change cart.status here.
      // Cart has a unique constraint on (farmerId, status). If we flip status
      // to CHECKED_OUT and the farmer already has a historical CHECKED_OUT cart,
      // Prisma will throw P2002. Keeping one ACTIVE cart and clearing items is
      // the simplest stable behavior.
      await tx.cartItem.deleteMany({ where: { cartId } });

      return newOrder;
    });

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

const getOrderById = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const farmerId = (req as any).user?.id as string | undefined;
    const orderId = req.params.orderId as string | undefined;

    if (!farmerId || !orderId) {
      throw new ApiError(400, "Invalid user or orderId");
    }

    const order = await prisma.order.findFirst({
      where: { orderId, farmerId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order fetched successfully"));
  }
);

// FARMER: PATCH /orders/:orderId/cancel (only if PENDING)
const cancelOrderByFarmer = asyncHandler(async (req: Request, res: Response) => {
  const farmerId = (req as any).user?.id as string | undefined;
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { orderId } = req.params as { orderId?: string };
  const order = await prisma.order.findFirst({ where: { orderId, farmerId, tenantId } });
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status !== OrderStatus.PENDING) {
    throw new ApiError(400, "Only PENDING orders can be cancelled by farmer");
  }

  const updated = await prisma.order.update({
    where: { orderId },
    data: { status: OrderStatus.CANCELLED },
    include: { items: { include: { product: true } } },
  });

  return res.status(200).json(new ApiResponse(200, updated, "Order cancelled"));
});


// ADMIN: GET /admin/orders
const getAllOrdersAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const orders = await prisma.order.findMany({
    where: { tenantId },
    include: {
      farmer: { select: { farmerId: true, username: true, email: true, fullName: true } },
      items: { include: { product: true, field: true } },
      cart: true,
    },
    orderBy: { placedAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, orders, "All orders"));
});

// ADMIN: GET /admin/orders/:orderId
const getOrderByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { orderId } = req.params as { orderId?: string };
  if (!orderId) throw new ApiError(400, "orderId is required");

  const order = await prisma.order.findFirst({
    where: { orderId, tenantId },
    include: {
      farmer: { select: { farmerId: true, username: true, email: true, fullName: true } },
      items: { include: { product: true, field: true } },
      cart: true,
    },
  });

  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

// ADMIN: PUT /admin/orders/:orderId (edit payment info etc.)
const updateOrderAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { orderId } = req.params as { orderId?: string };
  if (!orderId) throw new ApiError(400, "orderId is required");

  const { paymentMethod, paymentStatus, paymentProvider, providerPaymentId } = req.body as any;

  const existing = await prisma.order.findFirst({ where: { orderId, tenantId } });
  if (!existing) throw new ApiError(404, "Order not found");

  const updated = await prisma.order.update({
    where: { orderId },
    data: {
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      ...(paymentStatus !== undefined ? { paymentStatus } : {}),
      ...(paymentProvider !== undefined ? { paymentProvider } : {}),
      ...(providerPaymentId !== undefined ? { providerPaymentId } : {}),
    },
    include: { items: { include: { product: true } }, farmer: true },
  });

  return res.status(200).json(new ApiResponse(200, updated, "Order updated"));
});

// ADMIN: DELETE /admin/orders/:orderId
const deleteOrderAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { orderId } = req.params as { orderId?: string };
  if (!orderId) throw new ApiError(400, "orderId is required");

  const existing = await prisma.order.findFirst({ where: { orderId, tenantId }, include: { items: true } });
  if (!existing) throw new ApiError(404, "Order not found");

  // If already shipped, restock on delete (safety)
  if (existing.status === OrderStatus.SHIPPED) {
    for (const item of existing.items) {
      await prisma.product.update({
        where: { productId: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
  }

  await prisma.order.delete({ where: { orderId } });
  return res.status(200).json(new ApiResponse(200, null, "Order deleted"));
});

// ADMIN: PATCH /admin/orders/:orderId/status
const updateOrderStatusAdmin = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = ((req as any).user?.tenantId as string | undefined) ?? "default";
  const { orderId } = req.params as { orderId?: string };
  const { status } = req.body as { status?: OrderStatus };
  if (!orderId || !status) throw new ApiError(400, "orderId and status are required");

  const order = await prisma.order.findFirst({ where: { orderId, tenantId }, include: { items: true } });
  if (!order) throw new ApiError(404, "Order not found");

  // Inventory operations (e-commerce style)
  // - Deduct stock when moving to SHIPPED (first time)
  // - Restock when cancelling after shipment
  if (status === OrderStatus.SHIPPED && order.status !== OrderStatus.SHIPPED) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { productId: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }
  }

  if (status === OrderStatus.CANCELLED && order.status === OrderStatus.SHIPPED) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { productId: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
  }

  const updated = await prisma.order.update({
    where: { orderId },
    data: { status },
    include: { items: { include: { product: true } }, farmer: true },
  });

  return res.status(200).json(new ApiResponse(200, updated, "Order status updated"));
});

export {
  createOrder,
  getOrdersByUser,
  getOrderById,
  cancelOrderByFarmer,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderAdmin,
  deleteOrderAdmin,
  updateOrderStatusAdmin,
};
