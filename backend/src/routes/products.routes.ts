import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/products.controller";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();

// public browse
router.get("/", getAllProducts);
router.get("/:productId", getProductById);

// protected CRUD (until you add roles)
router.post("/", verifyJWT, requireAdmin, upload.single("image"), createProduct);
router.patch("/:productId", verifyJWT, requireAdmin, upload.single("image"), updateProduct);
router.delete("/:productId", verifyJWT, requireAdmin, deleteProduct);

export default router;
