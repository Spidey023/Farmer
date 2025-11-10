import express from "express";

import { verifyJWT } from "../middlewares/auth.middleware";
import { createOrder, getOrdersByUser } from "../controllers/order.controller";

const router = express.Router();

// protected routes
router.post("/create-order", verifyJWT, createOrder);
router.get("/", verifyJWT, getOrdersByUser);

export default router;
