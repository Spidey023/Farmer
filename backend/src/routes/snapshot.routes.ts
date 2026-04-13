import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import {
  createFieldSnapshot,
  getSnapshotsByFieldId,
} from "../controllers/snapshot.controller";

const router = express.Router();

// field snapshots
router.post("/:fieldId/create-snapshot", verifyJWT, requireFarmer, createFieldSnapshot);
router.get("/:fieldId/snapshots", verifyJWT, requireFarmer, getSnapshotsByFieldId);

export default router;
