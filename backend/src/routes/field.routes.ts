import express from "express";
import {
  addField,
  deleteField,
  getFieldById,
  getFieldsByFarmerId,
  updateField,
} from "../controllers/field.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireFarmer } from "../middlewares/farmer.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();
// protected routes
// fields
router.get("/", verifyJWT, requireFarmer, getFieldsByFarmerId);
router.get("/:fieldId", verifyJWT, requireFarmer, getFieldById);

router.post("/create-field", verifyJWT, requireFarmer, upload.single("landImage"), addField);
router.patch(
  "/update-field/:fieldId",
  verifyJWT, requireFarmer,
  upload.single("landImage"),
  updateField
);

router.delete("/delete-field/:fieldId", verifyJWT, requireFarmer, deleteField);

export default router;
