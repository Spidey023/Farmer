import { Router } from "express";
import getEnum from "../controllers/enum.controller";

const router = Router();

router.get("/", getEnum);

export default router;
