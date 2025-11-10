import express from "express";
import { get } from "http";
import { getAllProducts } from "../controllers/products.controller";

const router = express.Router();

router.get("/", getAllProducts);

export default router;
