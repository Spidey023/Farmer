import { Router } from "express";
import { listSeasons } from "../controllers/season.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Used for dropdowns (create field / season plan). Tenant-scoped.
router.get("/", verifyJWT, listSeasons);

export default router;
