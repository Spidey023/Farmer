import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware";
import { prisma } from "./db";

const app = express();

// common middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// to handle json data and form data
app.use(express.json())
app.use(express.urlencoded({extended:true}))


// routes
app.get("/dbcheck", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // test query
    res.json({ connected: true });
  } catch (error) {
    res.status(500).json({ connected: false, error: (error as Error).message });
  }
});

app.use(errorHandler)
export default app