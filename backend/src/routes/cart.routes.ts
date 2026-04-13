import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import {
  addToCart,
  deleteCart,
  getCartByUser,
  removeItemFromCart,
  updateCart,
} from "../controllers/cart.controller";

const router = express.Router();

router.post("/add-to-cart", verifyJWT, requireFarmer, addToCart);

router.get("/view-cart", verifyJWT, requireFarmer, getCartByUser); // to be implemented
router.delete("/remove/:productId", verifyJWT, requireFarmer, removeItemFromCart);
router.patch("/update-cart", verifyJWT, requireFarmer, updateCart); // to be implemented
router.delete("/delete-cart", verifyJWT, requireFarmer, deleteCart); // to be implemented

export default router;
