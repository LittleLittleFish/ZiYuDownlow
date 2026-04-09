import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/router.js";
import { metaRouter } from "./modules/meta/router.js";
import { resourcesRouter } from "./modules/resources/router.js";
import { ordersRouter } from "./modules/orders/router.js";
import { sellerRouter } from "./modules/seller/router.js";
import { adminRouter } from "./modules/admin/router.js";
import { paymentsRouter } from "./modules/payments/router.js";
import { env } from "./config/env.js";
import type { ApiResponse } from "@ziyu/shared";

export const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  const payload: ApiResponse<{ status: string; appName: string }> = {
    success: true,
    data: {
      status: "ok",
      appName: env.APP_NAME
    }
  };

  response.json(payload);
});

app.use("/api", metaRouter);
app.use("/api", authRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
