import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  createFieldSnapshot,
  getSnapshotsByFieldId,
} from "../controllers/snapshot.controller";

const router = express.Router();

// field snapshots
router.post("/:fieldId/create-snapshot", verifyJWT, createFieldSnapshot);
router.get("/:fieldId/snapshots", verifyJWT, getSnapshotsByFieldId);

export default router;
