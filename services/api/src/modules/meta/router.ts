import { Router } from "express";
import { resourceCategories, type ApiResponse, type PlatformMeta } from "@ziyu/shared";
import { env } from "../../config/env.js";

export const metaRouter = Router();

metaRouter.get("/meta", (_request, response) => {
  const payload: ApiResponse<PlatformMeta> = {
    success: true,
    data: {
      categories: resourceCategories,
      commission: {
        platform: env.PLATFORM_COMMISSION_RATE,
        seller: env.SELLER_COMMISSION_RATE
      },
      minWithdrawalAmount: env.MIN_WITHDRAWAL_AMOUNT
    }
  };

  response.json(payload);
});
