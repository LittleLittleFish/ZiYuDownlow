import { Router } from "express";
import type { ApiResponse, WorkflowOrderRecord } from "@ziyu/shared";
import { env } from "../../config/env.js";
import { getOrderById, markOrderPaid } from "../../store/mock-store.js";
import { isTimestampAcceptable, verifyYzfPayCallback } from "./yzfpay.js";

export const paymentsRouter = Router();

function normalizeQuery(query: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return [[key, String(value[0] ?? "")]];
      }

      if (value === undefined || value === null) {
        return [];
      }

      return [[key, String(value)]];
    })
  );
}

function processCallback(params: Record<string, string>): WorkflowOrderRecord | undefined {
  if (!verifyYzfPayCallback(params) || !isTimestampAcceptable(params.timestamp)) {
    return undefined;
  }

  if (params.trade_status !== "TRADE_SUCCESS" || !params.out_trade_no || !params.trade_no) {
    return undefined;
  }

  return markOrderPaid(params.out_trade_no, {
    paymentGateway: "yzfpay",
    paymentType: params.type,
    paymentTradeNo: params.trade_no,
    paymentApiTradeNo: params.api_trade_no,
    paymentParam: params.param,
    paymentBuyer: params.buyer,
    paymentNotifiedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    paymentCompletedAt: params.endtime || params.addtime
  });
}

paymentsRouter.get("/notify", (request, response) => {
  const params = normalizeQuery(request.query as Record<string, unknown>);
  const order = processCallback(params);

  if (!order) {
    response.status(400).send("fail");
    return;
  }

  response.type("text/plain").send("success");
});

paymentsRouter.get("/return", (request, response) => {
  const params = normalizeQuery(request.query as Record<string, unknown>);
  const order = processCallback(params) ?? (params.out_trade_no ? getOrderById(params.out_trade_no) : undefined);

  if (!order) {
    response.status(400).json({
      success: false,
      error: {
        code: "PAYMENT_RETURN_INVALID",
        message: "支付回跳验签失败或订单不存在。"
      }
    } satisfies ApiResponse<WorkflowOrderRecord>);
    return;
  }

  const redirectUrl = new URL("/orders", env.WEB_BASE_URL);
  redirectUrl.searchParams.set("payment", "success");
  redirectUrl.searchParams.set("orderId", order.id);
  response.redirect(302, redirectUrl.toString());
});