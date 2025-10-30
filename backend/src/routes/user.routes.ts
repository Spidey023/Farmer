import express from "express";
import {
  deleteFarmerProfile,
  getFarmerProfile,
  updateFarmerProfile,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();

// protected routes
router.get("/farmer-profile", verifyJWT, getFarmerProfile);
router.patch("/update-farmer", verifyJWT, updateFarmerProfile);
router.delete("/delete-farmer", verifyJWT, deleteFarmerProfile);

export default router;
