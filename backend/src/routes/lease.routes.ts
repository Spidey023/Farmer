import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import {
  createLease,
  getLeasesForFarmer,
  updateLease,
  deleteLease,
} from "../controllers/lease.controller";

const router = express.Router();

router.get("/", verifyJWT, requireFarmer, getLeasesForFarmer);
router.post("/", verifyJWT, requireFarmer, createLease);
router.patch("/:leaseId", verifyJWT, requireFarmer, updateLease);
router.delete("/:leaseId", verifyJWT, requireFarmer, deleteLease);

export default router;
