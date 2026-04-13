import { Router } from "express";

import { listCrops } from "../controllers/crop.controller";

const cropRouter = Router();

// Public: used for dropdowns (create field / season plan). No sensitive data.
cropRouter.get("/", listCrops);

export default cropRouter;
