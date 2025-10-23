import express from "express";
import {
  deleteFarmerProfile,
  getFarmerProfile,
  login,
  logout,
  refreshToken,
  registerFarmer,
  updateFarmerProfile,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();
// public routes
router.post("/register", registerFarmer);
router.post("/login", login);
router.get("/refresh", refreshToken);

// protected routes
router.get("/farmer-profile", verifyJWT, getFarmerProfile);
router.patch("/update-farmer", verifyJWT, updateFarmerProfile);
router.delete("/delete-farmer", verifyJWT, deleteFarmerProfile);
// logout
router.post("/logout", verifyJWT, logout);

export default router;
