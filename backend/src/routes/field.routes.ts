import express from "express";
import {
  addField,
  deleteField,
  getFieldById,
  getFieldsByFarmerId,
  updateField,
} from "../controllers/field.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();
// protected routes
// fields
router.get("/", verifyJWT, getFieldsByFarmerId);
router.get("/:fieldId", verifyJWT, getFieldById);

router.post("/create-field", verifyJWT, upload.single("landImage"), addField);
router.patch(
  "/update-field/:fieldId",
  verifyJWT,
  upload.single("landImage"),
  updateField
);

router.delete("/delete-field/:fieldId", verifyJWT, deleteField);

export default router;
