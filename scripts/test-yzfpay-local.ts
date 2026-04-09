import { createSign, generateKeyPairSync } from "node:crypto";
import { rmSync } from "node:fs";

type JsonResponse = {
  success: boolean;
  data?: any;
  error?: { code: string; message: string };
};

function buildSignContent(params: Record<string, string>) {
  return Object.keys(params)
    .filter((key) => key !== "sign" && key !== "sign_type")
    .filter((key) => params[key] !== undefined && params[key] !== null && String(params[key]) !== "")
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join("&");
}

function toEscapedPem(value: string) {
  return value.replace(/\n/g, "\\n");
}

async function main() {
  rmSync("./services/api/data/ziyu-payment-test.sqlite", { force: true });

  const merchantPair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  const platformPair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  process.env.NODE_ENV = "development";
  process.env.API_PORT = "4100";
  process.env.SQLITE_DB_PATH = "./services/api/data/ziyu-payment-test.sqlite";
  process.env.WEB_BASE_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:4100/api";
  process.env.PAYMENT_PROVIDER = "yzfpay";
  process.env.PAYMENT_CALLBACK_URL = "http://127.0.0.1:4100/api/payments/notify";
  process.env.PAYMENT_RETURN_URL = "http://127.0.0.1:4100/api/payments/return";
  process.env.PAYMENT_TEST_AMOUNT = "1.00";
  process.env.YZFPAY_API_BASE_URL = "https://api.yzfpay.com";
  process.env.YZFPAY_PID = "10999";
  process.env.YZFPAY_PAYMENT_TYPE = "alipay";
  process.env.YZFPAY_SIGN_TYPE = "RSA";
  process.env.YZFPAY_PRIVATE_KEY = toEscapedPem(merchantPair.privateKey);
  process.env.YZFPAY_PLATFORM_PUBLIC_KEY = toEscapedPem(platformPair.publicKey);

  const { app } = await import("../services/api/src/app.ts");
  const server = app.listen(4100);
  const base = "http://127.0.0.1:4100/api";

  async function request(path: string, options: RequestInit = {}) {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...((options.headers ?? {}) as Record<string, string>)
    };

    const response = await fetch(base + path, {
      ...options,
      headers,
    });
    const body = (await response.json()) as JsonResponse;
    return { response, body };
  }

  try {
    const email = `buyer-${Date.now()}@example.com`;
    const register = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "支付测试用户", email, password: "Passw0rd123" })
    });

    if (!register.response.ok || !register.body.data?.token) {
      throw new Error(`register failed: ${JSON.stringify(register.body)}`);
    }

    const token = register.body.data.token as string;
    const buyerId = register.body.data.user.id as string;
    const created = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ buyerId, resourceId: "community-001" })
    });

    if (!created.response.ok || !created.body.data?.order?.id || !created.body.data?.paymentForm?.fields) {
      throw new Error(`create order failed: ${JSON.stringify(created.body)}`);
    }

    const orderId = created.body.data.order.id as string;
    const paymentForm = created.body.data.paymentForm as { actionUrl: string; fields: Record<string, string> };
    const callbackParams: Record<string, string> = {
      pid: "10999",
      trade_no: `trade-${Date.now()}`,
      out_trade_no: orderId,
      api_trade_no: `api-${Date.now()}`,
      type: "alipay",
      trade_status: "TRADE_SUCCESS",
      addtime: "2026-04-08 14:00:00",
      endtime: "2026-04-08 14:00:30",
      name: paymentForm.fields.name,
      money: "1.00",
      param: paymentForm.fields.param,
      buyer: "buyer-openid-demo",
      timestamp: String(Math.floor(Date.now() / 1000)),
      sign_type: "RSA"
    };

    const signer = createSign("RSA-SHA256");
    signer.update(buildSignContent(callbackParams), "utf8");
    signer.end();
    callbackParams.sign = signer.sign(platformPair.privateKey, "base64");

    const notify = await fetch(`${base}/payments/notify?${new URLSearchParams(callbackParams).toString()}`);
    const notifyText = await notify.text();
    if (notify.status !== 200 || notifyText.trim() !== "success") {
      throw new Error(`notify failed: ${notify.status} ${notifyText}`);
    }

    const orders = await request("/orders/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const order = (orders.body.data as any[]).find((item) => item.id === orderId);

    if (!order) {
      throw new Error("order not found after notify");
    }

    console.log(JSON.stringify({
      createdOrderId: orderId,
      paymentFormAction: paymentForm.actionUrl,
      paymentMoney: paymentForm.fields.money,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      paymentTradeNo: order.paymentTradeNo,
      paymentApiTradeNo: order.paymentApiTradeNo,
      paymentType: order.paymentType,
      paymentCompletedAt: order.paymentCompletedAt,
      paymentNotifiedAt: order.paymentNotifiedAt,
      contact: order.contact
    }, null, 2));
  } finally {
    server.close();
  }
}

void main();
