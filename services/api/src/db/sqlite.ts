import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { buyerOrders, demoUsers, resourceDetails, withdrawals } from "@ziyu/shared";
import { env } from "../config/env.js";

function resolveSellerIdByName(name: string): string | undefined {
  if (name === "设计实验室") {
    return "seller-001";
  }

  if (name === "前端上岸计划") {
    return "seller-ext-002";
  }

  if (name === "模型路由局") {
    return "seller-ext-003";
  }

  return undefined;
}

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

function nowLabel(): string {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

const databasePath = resolve(process.cwd(), env.SQLITE_DB_PATH);
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    seller_id TEXT,
    description TEXT NOT NULL,
    email TEXT,
    password_hash TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    price_amount INTEGER NOT NULL,
    price_label TEXT NOT NULL,
    badge TEXT NOT NULL,
    cover_tone TEXT NOT NULL,
    highlights_json TEXT NOT NULL,
    delivery_flow_json TEXT NOT NULL,
    is_member_included INTEGER NOT NULL,
    source_policy TEXT NOT NULL,
    contact_hint TEXT NOT NULL,
    seller_id TEXT,
    source_link TEXT,
    contact TEXT,
    audit_status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_title TEXT NOT NULL,
    amount_label TEXT NOT NULL,
    amount_value INTEGER NOT NULL,
    status TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    contact TEXT NOT NULL,
    delivery_note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    refund_reason TEXT,
    refund_review_note TEXT
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    amount_value INTEGER NOT NULL,
    amount_label TEXT NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    account TEXT NOT NULL,
    created_at TEXT NOT NULL,
    note TEXT
  );
`);

for (const statement of [
  "ALTER TABLE users ADD COLUMN email TEXT",
  "ALTER TABLE users ADD COLUMN password_hash TEXT",
  "ALTER TABLE users ADD COLUMN created_at TEXT"
]) {
  try {
    db.exec(statement);
  } catch {
    // Column already exists.
  }
}

db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL");

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };

if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, role, seller_id, description)
    VALUES (@id, @name, @role, @sellerId, @description)
  `);

  const insertResource = db.prepare(`
    INSERT INTO resources (
      id, title, summary, description, type, category, seller_name, price_amount, price_label,
      badge, cover_tone, highlights_json, delivery_flow_json, is_member_included, source_policy,
      contact_hint, seller_id, source_link, contact, audit_status, created_at
    ) VALUES (
      @id, @title, @summary, @description, @type, @category, @sellerName, @priceAmount, @priceLabel,
      @badge, @coverTone, @highlightsJson, @deliveryFlowJson, @isMemberIncluded, @sourcePolicy,
      @contactHint, @sellerId, @sourceLink, @contact, @auditStatus, @createdAt
    )
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, buyer_id, buyer_name, seller_id, seller_name, resource_id, resource_title,
      amount_label, amount_value, status, payment_status, contact, delivery_note, created_at,
      refund_reason, refund_review_note
    ) VALUES (
      @id, @buyerId, @buyerName, @sellerId, @sellerName, @resourceId, @resourceTitle,
      @amountLabel, @amountValue, @status, @paymentStatus, @contact, @deliveryNote, @createdAt,
      @refundReason, @refundReviewNote
    )
  `);

  const insertWithdrawal = db.prepare(`
    INSERT INTO withdrawals (
      id, seller_id, seller_name, amount_value, amount_label, method, status, account, created_at, note
    ) VALUES (
      @id, @sellerId, @sellerName, @amountValue, @amountLabel, @method, @status, @account, @createdAt, @note
    )
  `);

  const seed = db.transaction(() => {
    for (const user of demoUsers) {
      insertUser.run({
        id: user.id,
        name: user.name,
        role: user.role,
        sellerId: user.sellerId ?? null,
        description: user.description
      });
    }

    for (const resource of resourceDetails) {
      const sellerId = resource.type === "community" ? resolveSellerIdByName(resource.sellerName) : null;
      const contact = resource.type === "community"
        ? sellerId === "seller-001"
          ? "微信: design-lab / QQ: 172009"
          : `${resource.sellerName} 私聊交付`
        : null;

      insertResource.run({
        id: resource.id,
        title: resource.title,
        summary: resource.summary,
        description: resource.description,
        type: resource.type,
        category: resource.category,
        sellerName: resource.sellerName,
        priceAmount: resource.priceAmount,
        priceLabel: resource.priceLabel,
        badge: resource.badge,
        coverTone: resource.coverTone,
        highlightsJson: JSON.stringify(resource.highlights),
        deliveryFlowJson: JSON.stringify(resource.deliveryFlow),
        isMemberIncluded: resource.isMemberIncluded ? 1 : 0,
        sourcePolicy: resource.sourcePolicy,
        contactHint: resource.contactHint,
        sellerId,
        sourceLink: resource.type === "community" ? `https://example.com/share/${resource.id}` : null,
        contact,
        auditStatus: "已上架",
        createdAt: nowLabel()
      });
    }

    insertOrder.run({
      id: buyerOrders[0]?.id ?? "order-20260401-001",
      buyerId: "buyer-001",
      buyerName: "木木用户",
      sellerId: "seller-001",
      sellerName: "设计实验室",
      resourceId: "community-001",
      resourceTitle: "设计素材网盘导航合集",
      amountLabel: "¥29.90",
      amountValue: 2990,
      status: "待确认收货",
      paymentStatus: "支付成功，已展示卖家联系方式",
      contact: "微信: design-lab / QQ: 172009",
      deliveryNote: "已通过微信发送提取码：A1B2，网盘目录包含按风格整理的素材文件夹。",
      createdAt: "2026-04-01 21:14",
      refundReason: null,
      refundReviewNote: null
    });

    for (const withdrawal of withdrawals) {
      insertWithdrawal.run({
        id: withdrawal.id,
        sellerId: withdrawal.sellerId ?? resolveSellerIdByName(withdrawal.sellerName) ?? `seller-${withdrawal.id}`,
        sellerName: withdrawal.sellerName,
        amountValue: withdrawal.amountValue ?? 0,
        amountLabel: withdrawal.amountLabel || formatCurrency(withdrawal.amountValue ?? 0),
        method: withdrawal.method,
        status: withdrawal.status,
        account: withdrawal.account ?? "待补充",
        createdAt: withdrawal.createdAt ?? nowLabel(),
        note: withdrawal.note ?? null
      });
    }
  });

  seed();
}