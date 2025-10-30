import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import errorHandler from "./middlewares/error.middleware";
import authRouter from "./routes/auth.routes";
import formerRouter from "./routes/user.routes";
import fieldRouter from "./routes/field.routes";

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
// to handle cookies
app.use(cookieParser());

// routes
app.get("/api/v1/health", (req, res) => {
  return res.status(200).json({
    status: "success",
    data: authRouter.length,
    message: "API is working fine",
  });
});
// auth routes
app.use("/api/v1/auth", authRouter);

// user routes
app.use("/api/v1/farmer", formerRouter);

app.use("/api/v1/field", fieldRouter);

app.use(errorHandler);

export default app;
