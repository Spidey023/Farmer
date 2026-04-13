import { Request, Response } from "express";
import { asyncHandler } from "../utils/ayncHnadler";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

/**
 * NOTE: This project ships with a "mock mode" integration for Stripe/Razorpay.
 * If STRIPE_SECRET_KEY or RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are present, you can wire the real SDKs.
 */

export const createStripePaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency = "usd" } = req.body as { amount?: number; currency?: string };
  if (!amount) throw new ApiError(400, "amount is required");

  // mock payload - wire stripe SDK if keys are available
  const clientSecret = `mock_stripe_cs_${Date.now()}`;
  return res.status(200).json(new ApiResponse(200, { clientSecret, amount, currency }, "Stripe intent created"));
});

export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency = "INR" } = req.body as { amount?: number; currency?: string };
  if (!amount) throw new ApiError(400, "amount is required");

  const orderId = `mock_razorpay_order_${Date.now()}`;
  return res.status(200).json(new ApiResponse(200, { orderId, amount, currency }, "Razorpay order created"));
});
