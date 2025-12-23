import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  createFiedSeasonPlan,
  getSeasonPlansByFieldId,
} from "../controllers/seasonPlan.controller";

const router = express.Router();

// field season plans
router.post("/:fieldId/create-season-plan", verifyJWT, createFiedSeasonPlan);
router.get("/:fieldId", verifyJWT, getSeasonPlansByFieldId);

export default router;
