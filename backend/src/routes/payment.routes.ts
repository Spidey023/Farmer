import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import { createRazorpayOrder, createStripePaymentIntent } from "../controllers/payment.controller";

const router = Router();

router.post("/stripe/intent", verifyJWT, requireFarmer, createStripePaymentIntent);
router.post("/razorpay/order", verifyJWT, requireFarmer, createRazorpayOrder);

export default router;
