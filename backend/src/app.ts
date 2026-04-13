import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

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
import leaseRouter from "./routes/lease.routes";
import enumRouter from "./routes/enum.router";
import cropRouter from "./routes/crop.routes";
import seasonRouter from "./routes/season.routes";
import adminRouter from "./routes/admin.routes";
import walletRouter from "./routes/wallet.routes";
import analyticsRouter from "./routes/analytics.routes";
import paymentRouter from "./routes/payment.routes";
import adminSeasonRoutes from "./routes/admin.season.routes";

const app = express();

// Ensure uploads dir exists and expose it
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

/**
 * CORS whitelist
 * Put your actual frontend URLs here (local + deployed).
 */
const allowed = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // add your deployed frontend URL(s) here
  // "https://your-frontend.vercel.app",
];

// common middlewares
app.use(
  cors({
    origin(origin, cb) {
      // Postman/curl/server-to-server have no Origin → allow
      if (!origin) return cb(null, true);

      if (allowed.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked: ${origin} not in whitelist`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// to handle json data and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// to handle cookies
app.use(cookieParser());

// health
app.get("/api/v1/health", (_req, res) => {
  return res.status(200).json({
    status: "success",
    message: "API is working fine",
  });
});

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/farmer", formerRouter);
app.use("/api/v1/field", fieldRouter);
app.use("/api/v1/snapshot", snapshotRouter);
app.use("/api/v1/season-plan", seasonPlanRouter);
app.use("/api/v1/recommandations", recommandationsRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/lease", leaseRouter);
app.use("/api/v1/enum", enumRouter);
app.use("/api/v1/crops", cropRouter);
app.use("/api/v1/seasons", seasonRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/payments", paymentRouter);
// Admin Season CRUD (mounted under /admin to match frontend)
app.use("/api/v1/admin/seasons", adminSeasonRoutes);

// error handler MUST be last
app.use(errorHandler);

export default app;
