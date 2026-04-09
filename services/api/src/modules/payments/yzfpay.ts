import { createSign, createVerify } from "node:crypto";
import type { PaymentFormRequest, WorkflowOrderRecord } from "@ziyu/shared";
import { env } from "../../config/env.js";

type PaymentParams = Record<string, string | undefined>;

function normalizePem(value: string, label: "PRIVATE KEY" | "PUBLIC KEY"): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("BEGIN")) {
    return trimmed.replace(/\\n/g, "\n");
  }

  const body = trimmed.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g)?.join("\n") ?? body;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function buildSignContent(params: PaymentParams): string {
  return Object.keys(params)
    .filter((key) => key !== "sign" && key !== "sign_type")
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && String(value) !== "";
    })
    .sort()
    .map((key) => `${key}=${String(params[key] ?? "")}`)
    .join("&");
}

function formatYuanFromCents(amount: number): string {
  return (amount / 100).toFixed(2);
}

function getPaymentAmount(order: WorkflowOrderRecord): string {
  if (env.PAYMENT_TEST_AMOUNT?.trim()) {
    return env.PAYMENT_TEST_AMOUNT.trim();
  }

  return formatYuanFromCents(order.amountValue);
}

function truncateName(name: string): string {
  const buffer = Buffer.from(name, "utf8");

  if (buffer.length <= 127) {
    return name;
  }

  return buffer.subarray(0, 127).toString("utf8");
}

export function isYzfPayConfigured(): boolean {
  return Boolean(env.YZFPAY_PID && env.YZFPAY_PRIVATE_KEY && env.YZFPAY_PLATFORM_PUBLIC_KEY);
}

export function createYzfPayPaymentForm(order: WorkflowOrderRecord): PaymentFormRequest {
  const fields: Record<string, string> = {
    pid: env.YZFPAY_PID,
    type: env.YZFPAY_PAYMENT_TYPE,
    out_trade_no: order.id,
    notify_url: env.PAYMENT_CALLBACK_URL,
    return_url: env.PAYMENT_RETURN_URL,
    name: truncateName(order.resourceTitle),
    money: getPaymentAmount(order),
    param: order.resourceId,
    timestamp: String(Math.floor(Date.now() / 1000)),
    sign_type: env.YZFPAY_SIGN_TYPE
  };

  const signer = createSign("RSA-SHA256");
  signer.update(buildSignContent(fields), "utf8");
  signer.end();

  fields.sign = signer.sign(normalizePem(env.YZFPAY_PRIVATE_KEY, "PRIVATE KEY"), "base64");

  return {
    actionUrl: `${env.YZFPAY_API_BASE_URL.replace(/\/$/, "")}/api/pay/submit`,
    method: "POST",
    fields
  };
}

export function verifyYzfPayCallback(params: PaymentParams): boolean {
  const signature = params.sign;

  if (!signature) {
    return false;
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(buildSignContent(params), "utf8");
  verifier.end();

  return verifier.verify(normalizePem(env.YZFPAY_PLATFORM_PUBLIC_KEY, "PUBLIC KEY"), signature, "base64");
}

export function isTimestampAcceptable(timestamp: string | undefined): boolean {
  if (!timestamp) {
    return false;
  }

  const numericTimestamp = Number(timestamp);

  if (!Number.isFinite(numericTimestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - numericTimestamp) <= env.PAYMENT_TIMESTAMP_TOLERANCE_SECONDS;
}