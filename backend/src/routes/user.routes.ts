import express from "express";
import {
  deleteFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";

const router = express.Router();

// protected routes
router.get("/farmer-profile", verifyJWT, requireFarmer, getFarmerProfile);
router.patch("/update-farmer", verifyJWT, requireFarmer, updateFarmerProfile);
router.delete("/delete-farmer", verifyJWT, requireFarmer, deleteFarmerProfile);

export default router;
