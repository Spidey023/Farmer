import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware";
import formerRouter from "./routes/user.routes";
import cookieParser from "cookie-parser";

const app = express();

// common middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// to handle json data and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "API is working fine",
  });
});

// user routes
app.use("/api/v1/farmer", formerRouter);

app.use(errorHandler);
export default app;
