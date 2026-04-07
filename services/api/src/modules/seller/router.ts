import { Router } from "express";
import { z } from "zod";
import { type ApiResponse, type DeliverOrderInput, type SellerWorkspaceData, type WithdrawalRequestInput, type WithdrawalRow, type WorkflowOrderRecord } from "@ziyu/shared";
import { createWithdrawal, deliverOrder, getSellerWorkspace } from "../../store/mock-store.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.js";

export const sellerRouter = Router();

const deliverOrderSchema = z.object({
  sellerId: z.string().min(1),
  deliveryNote: z.string().min(4)
});

const createWithdrawalSchema = z.object({
  amountValue: z.coerce.number().int().positive(),
  method: z.string().min(2),
  account: z.string().min(2)
});

sellerRouter.get("/workspace/me", requireAuth, requireRole("seller"), (request: AuthenticatedRequest, response) => {
  const workspace = request.authUser ? getSellerWorkspace(request.authUser) : undefined;

  if (!workspace) {
    response.status(404).json({
      success: false,
      error: {
        code: "SELLER_NOT_FOUND",
        message: "卖家工作台不存在"
      }
    } satisfies ApiResponse<SellerWorkspaceData>);
    return;
  }

  const payload: ApiResponse<SellerWorkspaceData> = {
    success: true,
    data: workspace
  };

  response.json(payload);
});

sellerRouter.post("/orders/:id/deliver", requireAuth, requireRole("seller"), (request: AuthenticatedRequest, response) => {
  const orderId = String(request.params.id);
  const parsed = deliverOrderSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_DELIVERY_PAYLOAD",
        message: "发货参数不正确"
      }
    } satisfies ApiResponse<DeliverOrderInput>);
    return;
  }

  const order = request.authUser ? deliverOrder(request.authUser, orderId, parsed.data) : undefined;

  if (!order) {
    response.status(400).json({
      success: false,
      error: {
        code: "ORDER_DELIVERY_FAILED",
        message: "订单当前不可发货"
      }
    } satisfies ApiResponse<WorkflowOrderRecord>);
    return;
  }

  response.json({
    success: true,
    data: order
  } satisfies ApiResponse<WorkflowOrderRecord>);
});

sellerRouter.post("/withdrawals", requireAuth, requireRole("seller"), (request: AuthenticatedRequest, response) => {
  const parsed = createWithdrawalSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_WITHDRAWAL_PAYLOAD",
        message: "提现申请参数不正确"
      }
    } satisfies ApiResponse<WithdrawalRequestInput>);
    return;
  }

  const withdrawal = request.authUser ? createWithdrawal(request.authUser, parsed.data) : undefined;

  if (!withdrawal) {
    response.status(400).json({
      success: false,
      error: {
        code: "WITHDRAWAL_CREATE_FAILED",
        message: "提现金额超限或当前账号不可提现"
      }
    } satisfies ApiResponse<WithdrawalRow>);
    return;
  }

  response.status(201).json({
    success: true,
    data: withdrawal
  } satisfies ApiResponse<WithdrawalRow>);
});
