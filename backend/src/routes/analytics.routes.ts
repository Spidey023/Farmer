import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import { getFieldProfitability, getYieldSummary } from "../controllers/analytics.controller";

const router = Router();

router.get("/yield", verifyJWT, requireFarmer, getYieldSummary);
router.get("/profitability/:fieldId", verifyJWT, requireFarmer, getFieldProfitability);

export default router;
