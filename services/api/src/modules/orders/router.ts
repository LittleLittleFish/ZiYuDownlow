import { Router } from "express";
import { z } from "zod";
import { type ApiResponse, type ConfirmOrderInput, type CreateOrderInput, type RefundRequestInput, type ResolveRefundInput, type WorkflowOrderRecord } from "@ziyu/shared";
import { confirmOrder, createOrder, listBuyerOrders, requestRefund, resolveRefund } from "../../store/mock-store.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../auth/middleware.js";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  buyerId: z.string().min(1),
  resourceId: z.string().min(1)
});

const confirmOrderSchema = z.object({
  buyerId: z.string().min(1)
});

const refundRequestSchema = z.object({
  reason: z.string().min(4)
});

const resolveRefundSchema = z.object({
  approved: z.boolean(),
  note: z.string().min(2)
});

ordersRouter.get("/mine", requireAuth, (request: AuthenticatedRequest, response) => {
  if (!request.authUser) {
    response.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "未登录，无法读取订单。"
      }
    } satisfies ApiResponse<WorkflowOrderRecord[]>);
    return;
  }

  const payload: ApiResponse<WorkflowOrderRecord[]> = {
    success: true,
    data: listBuyerOrders(request.authUser)
  };

  response.json(payload);
});

ordersRouter.post("/", requireAuth, requireRole(["buyer", "seller"]), (request: AuthenticatedRequest, response) => {
  const parsed = createOrderSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_ORDER_PAYLOAD",
        message: "下单参数不正确"
      }
    } satisfies ApiResponse<CreateOrderInput>);
    return;
  }

  const order = request.authUser ? createOrder(request.authUser, parsed.data) : undefined;

  if (!order) {
    response.status(400).json({
      success: false,
      error: {
        code: "ORDER_CREATE_FAILED",
        message: "资源未上架或不支持下单"
      }
    } satisfies ApiResponse<WorkflowOrderRecord>);
    return;
  }

  response.status(201).json({
    success: true,
    data: order
  } satisfies ApiResponse<WorkflowOrderRecord>);
});

ordersRouter.post("/:id/confirm", requireAuth, requireRole(["buyer", "seller"]), (request: AuthenticatedRequest, response) => {
  const orderId = String(request.params.id);
  const parsed = confirmOrderSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_CONFIRM_PAYLOAD",
        message: "确认收货参数不正确"
      }
    } satisfies ApiResponse<ConfirmOrderInput>);
    return;
  }

  const order = request.authUser ? confirmOrder(request.authUser, orderId, parsed.data) : undefined;

  if (!order) {
    response.status(400).json({
      success: false,
      error: {
        code: "ORDER_CONFIRM_FAILED",
        message: "订单当前不可确认收货"
      }
    } satisfies ApiResponse<WorkflowOrderRecord>);
    return;
  }

  response.json({
    success: true,
    data: order
  } satisfies ApiResponse<WorkflowOrderRecord>);
});

ordersRouter.post("/:id/refund", requireAuth, requireRole(["buyer", "seller"]), (request: AuthenticatedRequest, response) => {
  const orderId = String(request.params.id);
  const parsed = refundRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_REFUND_PAYLOAD",
        message: "退款申请参数不正确"
      }
    } satisfies ApiResponse<RefundRequestInput>);
    return;
  }

  const order = request.authUser ? requestRefund(request.authUser, orderId, parsed.data) : undefined;

  if (!order) {
    response.status(400).json({
      success: false,
      error: {
        code: "ORDER_REFUND_FAILED",
        message: "订单当前不可申请退款"
      }
    } satisfies ApiResponse<WorkflowOrderRecord>);
    return;
  }

  response.json({
    success: true,
    data: order
  } satisfies ApiResponse<WorkflowOrderRecord>);
});

ordersRouter.post("/:id/refund/review", requireAuth, requireRole("admin"), (request, response) => {
  const orderId = String(request.params.id);
  const parsed = resolveRefundSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      success: false,
      error: {
        code: "INVALID_REFUND_REVIEW_PAYLOAD",
        message: "退款审核参数不正确"
      }
    } satisfies ApiResponse<ResolveRefundInput>);
    return;
  }

  const order = resolveRefund(orderId, parsed.data);

  if (!order) {
    response.status(400).json({
      success: false,
      error: {
        code: "ORDER_REFUND_REVIEW_FAILED",
        message: "退款申请当前不可处理"
      }
    } satisfies ApiResponse<WorkflowOrderRecord>);
    return;
  }

  response.json({
    success: true,
    data: order
  } satisfies ApiResponse<WorkflowOrderRecord>);
});
