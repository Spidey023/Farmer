import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import errorHandler from "./middlewares/error.middleware";
import authRouter from "./routes/auth.routes";
import formerRouter from "./routes/user.routes";
import fieldRouter from "./routes/field.routes";
import snapshotRouter from "./routes/snapshot.routes";
import seasonPlanRouter from "./routes/seasonPlan.routes";
import recommandationsRouter from "./routes/recommandations.routes";
import productRouter from "./routes/products.routes";
import orderRouter from "./routes/order.routes";
import cartRouter from "./routes/cart.routes";

const app = express();

// common middlewares
const allowed = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Example .env on EC2 (HTTP testing):
// CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://<EC2-IP>:3000

app.use(
  cors({
    origin(origin, cb) {
      // Postman/curl have no Origin → allow
      if (!origin) return cb(null, true);
      // Strictly allow only the whitelisted ones
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin} not in whitelist`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Optional, but handy when debugging cookie issues:
    // exposedHeaders: ["Set-Cookie"],
  })
);

// (optional) respond to preflight explicitly
app.options(
  "*",
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin} not in whitelist`));
    },
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
app.use("/api/v1/snapshot", snapshotRouter);
app.use("/api/v1/season-plan", seasonPlanRouter);
app.use("/api/v1/recommandations", recommandationsRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use(errorHandler);

export default app;
