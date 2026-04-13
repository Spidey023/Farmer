import express from "express";

import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import {
  createOrder,
  getOrderById,
  getOrdersByUser,
  cancelOrderByFarmer,
} from "../controllers/order.controller";

const router = express.Router();

// protected routes
router.post("/create-order", verifyJWT, requireFarmer, createOrder);
router.get("/", verifyJWT, requireFarmer, getOrdersByUser);
router.get("/:orderId", verifyJWT, requireFarmer, getOrderById);
router.patch("/:orderId/cancel", verifyJWT, requireFarmer, cancelOrderByFarmer);

export default router;
