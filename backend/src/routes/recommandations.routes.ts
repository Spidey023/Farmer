import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import { getRecomandationsByFieldId } from "../controllers/field.controller";

const router = express.Router();

// field recommendations
router.get("/:fieldId/recommendations", verifyJWT, requireFarmer, getRecomandationsByFieldId);

export default router;
