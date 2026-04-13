import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import { getMyWallet } from "../controllers/wallet.controller";

const router = Router();

router.get("/me", verifyJWT, requireFarmer, getMyWallet);

export default router;
