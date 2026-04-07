import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

type NodeEnv = "development" | "test" | "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("ZiYuDownlow"),
  API_PORT: z.coerce.number().default(4000),
  SQLITE_DB_PATH: z.string().default("./data/ziyu.sqlite"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000/api"),
  PLATFORM_COMMISSION_RATE: z.coerce.number().default(0.3),
  SELLER_COMMISSION_RATE: z.coerce.number().default(0.7),
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().default(10)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation failed", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data as typeof parsed.data & { NODE_ENV: NodeEnv };
