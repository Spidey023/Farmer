import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import {
  createFiedSeasonPlan,
  getSeasonPlansByFieldId,
  updateFieldSeasonPlan,
} from "../controllers/seasonPlan.controller";

const router = express.Router();

// field season plans
router.post("/:fieldId/create-season-plan", verifyJWT, requireFarmer, createFiedSeasonPlan);
router.get("/:fieldId", verifyJWT, requireFarmer, getSeasonPlansByFieldId);

// Update an existing season plan (crop status / expected values / dates)
router.patch("/plan/:planId", verifyJWT, requireFarmer, updateFieldSeasonPlan);

export default router;
