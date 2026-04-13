import express from "express";
import {
  createSeason,
  getAllSeasons,
  updateSeason,
  deleteSeason,
} from "../controllers/admin.season.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";

const router = express.Router();

router.use(verifyJWT, requireAdmin);

router.post("/", createSeason);
router.get("/", getAllSeasons);
router.patch("/:seasonId", updateSeason);
router.delete("/:seasonId", deleteSeason);

export default router;
