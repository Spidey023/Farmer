import express from "express";
import {
  addField,
  deleteField,
  getFieldById,
  getFieldsByFarmerId,
  updateField,
} from "../controllers/field.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", verifyJWT, getFieldsByFarmerId);
router.get("/:fieldId", verifyJWT, getFieldById);

router.post("/create-field", verifyJWT, addField);
router.patch("/update-field/:fieldId", verifyJWT, updateField);

router.delete("/delete-field/:fieldId", verifyJWT, deleteField);

export default router;
