import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  addToCart,
  deleteCart,
  getCartByUser,
  updateCart,
} from "../controllers/cart.controller";

const router = express.Router();

router.post("/add-to-cart", verifyJWT, addToCart);

router.get("/view-cart", verifyJWT, getCartByUser); // to be implemented
router.patch("/update-cart", verifyJWT, updateCart); // to be implemented
router.delete("/delete-cart", verifyJWT, deleteCart); // to be implemented

export default router;
