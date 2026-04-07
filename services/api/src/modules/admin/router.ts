import { Router } from "express";
import { z } from "zod";
import { type AdminOverview, type ApiResponse, type ReviewWithdrawalInput, type WithdrawalRow } from "@ziyu/shared";
import { getAdminOverview, reviewWithdrawal } from "../../store/mock-store.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const adminRouter = Router();

const reviewWithdrawalSchema = z.object({
  action: z.enum(["approve", "paid", "reject"]),
  note: z.string().min(2)
});

adminRouter.get("/overview", requireAuth, requireRole("admin"), (_request, response) => {
  const payload: ApiResponse<AdminOverview> = {
    success: true,
    data: getAdminOverview()
  };

  response.json(payload);
});

adminRouter.post("/withdrawals/:id/review", requireAuth, requireRole("admin"), (request, response) => {
  const withdrawalId = String(request.params.id);
  const parsed = reviewWithdrawalSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_WITHDRAWAL_REVIEW_PAYLOAD",
        message: "提现审核参数不正确"
      }
    } satisfies ApiResponse<ReviewWithdrawalInput>);
    return;
  }

  const withdrawal = reviewWithdrawal(withdrawalId, parsed.data);

  if (!withdrawal) {
    response.status(400).json({
      success: false,
      error: {
        code: "WITHDRAWAL_REVIEW_FAILED",
        message: "提现申请当前不可处理"
      }
    } satisfies ApiResponse<WithdrawalRow>);
    return;
  }

  response.json({
    success: true,
    data: withdrawal
  } satisfies ApiResponse<WithdrawalRow>);
});
