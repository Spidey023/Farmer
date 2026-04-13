import express from "express";

import {
  registerFarmer,
  login,
  loginFarmer,
  loginAdmin,
  refreshToken,
  logout,
  dashboard,
  getWheather,
} from "../controllers/auth.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = express.Router();
// public routes
router.post("/register", registerFarmer);
router.post("/login", login);
// Explicit role-based logins (for separate Farmer/Admin login screens)
router.post("/login/farmer", loginFarmer);
router.post("/login/admin", loginAdmin);
router.get("/refresh", refreshToken);
// protected route
router.post("/logout", verifyJWT, logout);
router.get("/dashboard", verifyJWT, dashboard);
router.post("/weather", verifyJWT, getWheather);

export default router;
