import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

type NodeEnv = "development" | "test" | "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("ZiYuDownlow"),
  API_PORT: z.coerce.number().default(4000),
  SQLITE_DB_PATH: z.string().default("./data/ziyu.sqlite"),
  WEB_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000/api"),
  PLATFORM_COMMISSION_RATE: z.coerce.number().default(0.3),
  SELLER_COMMISSION_RATE: z.coerce.number().default(0.7),
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().default(10),
  PAYMENT_PROVIDER: z.string().default("yzfpay"),
  PAYMENT_CALLBACK_URL: z.string().url().default("http://localhost:4000/api/payments/notify"),
  PAYMENT_RETURN_URL: z.string().url().default("http://localhost:4000/api/payments/return"),
  PAYMENT_TEST_AMOUNT: z.string().optional(),
  PAYMENT_TIMESTAMP_TOLERANCE_SECONDS: z.coerce.number().default(86400),
  YZFPAY_API_BASE_URL: z.string().url().default("https://api.yzfpay.com"),
  YZFPAY_PID: z.string().default(""),
  YZFPAY_PAYMENT_TYPE: z.string().default("alipay"),
  YZFPAY_SIGN_TYPE: z.string().default("RSA"),
  YZFPAY_PRIVATE_KEY: z.string().default(""),
  YZFPAY_PLATFORM_PUBLIC_KEY: z.string().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation failed", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data as typeof parsed.data & { NODE_ENV: NodeEnv };
