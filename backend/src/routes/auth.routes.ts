import express from "express";

import {
  registerFarmer,
  login,
  refreshToken,
  logout,
  dashboard,
} from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();
// public routes
router.post("/register", registerFarmer);
router.post("/login", login);
router.get("/refresh", refreshToken);
// protected route
router.post("/logout", verifyJWT, logout);
router.get("/dashboard", verifyJWT, dashboard);

export default router;
