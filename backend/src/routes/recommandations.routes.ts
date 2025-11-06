import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getRecomandationsByFieldId } from "../controllers/field.controller";

const router = express.Router();

// field recommendations
router.get("/:fieldId/recommendations", verifyJWT, getRecomandationsByFieldId);

export default router;
