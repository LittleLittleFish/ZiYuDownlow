import { randomUUID } from "node:crypto";
import {
  type AdminOverview,
  type AuthSession,
  type ConfirmOrderInput,
  type CreateOrderInput,
  type CreateResourceInput,
  type DashboardStat,
  type DemoUser,
  type DeliverOrderInput,
  type RefundRequestInput,
  type ResourceCard,
  type ResourceDetail,
  type ResourceType,
  type ResolveRefundInput,
  type ReviewWithdrawalInput,
  type SellerWorkspaceData,
  type UploadedResourceRecord,
  type WithdrawalRequestInput,
  type WithdrawalRow,
  type WorkflowOrderRecord
} from "@ziyu/shared";
import { env } from "../config/env.js";
import { db } from "../db/sqlite.js";

const coverTones = ["teal", "amber", "rose", "slate", "violet"];

type ResourceRow = {
  id: string;
  title: string;
  summary: string;
  description: string;
  type: ResourceType;
  category: UploadedResourceRecord["category"];
  seller_name: string;
  price_amount: number;
  price_label: string;
  badge: string;
  cover_tone: string;
  highlights_json: string;
  delivery_flow_json: string;
  is_member_included: number;
  source_policy: string;
  contact_hint: string;
  seller_id: string | null;
  source_link: string | null;
  contact: string | null;
  audit_status: UploadedResourceRecord["auditStatus"];
  created_at: string;
};

type OrderRow = {
  id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  resource_id: string;
  resource_title: string;
  amount_label: string;
  amount_value: number;
  status: WorkflowOrderRecord["status"];
  payment_status: string;
  contact: string;
  delivery_note: string;
  created_at: string;
  refund_reason: string | null;
  refund_review_note: string | null;
};

type WithdrawalDatabaseRow = {
  id: string;
  seller_id: string;
  seller_name: string;
  amount_value: number;
  amount_label: string;
  method: string;
  status: string;
  account: string;
  created_at: string;
  note: string | null;
};

type UserRow = {
  id: string;
  name: string;
  role: DemoUser["role"];
  seller_id: string | null;
  description: string;
};

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

function nowLabel(): string {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function parseJsonArray(input: string): string[] {
  try {
    const parsed = JSON.parse(input) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toDemoUser(row: UserRow): DemoUser {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    sellerId: row.seller_id ?? undefined,
    description: row.description
  };
}

function toResourceRecord(row: ResourceRow): UploadedResourceRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    type: row.type,
    category: row.category,
    sellerName: row.seller_name,
    priceAmount: row.price_amount,
    priceLabel: row.price_label,
    badge: row.badge,
    coverTone: row.cover_tone,
    highlights: parseJsonArray(row.highlights_json),
    deliveryFlow: parseJsonArray(row.delivery_flow_json),
    isMemberIncluded: row.is_member_included === 1,
    sourcePolicy: row.source_policy,
    contactHint: row.contact_hint,
    sellerId: row.seller_id ?? undefined,
    sourceLink: row.source_link ?? undefined,
    contact: row.contact ?? undefined,
    auditStatus: row.audit_status,
    createdAt: row.created_at
  };
}

function toOrderRecord(row: OrderRow): WorkflowOrderRecord {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    amountLabel: row.amount_label,
    amountValue: row.amount_value,
    status: row.status,
    paymentStatus: row.payment_status,
    contact: row.contact,
    deliveryNote: row.delivery_note,
    createdAt: row.created_at,
    refundReason: row.refund_reason ?? undefined,
    refundReviewNote: row.refund_review_note ?? undefined
  };
}

function toWithdrawalRow(row: WithdrawalDatabaseRow): WithdrawalRow {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    amountValue: row.amount_value,
    amountLabel: row.amount_label,
    method: row.method,
    status: row.status,
    account: row.account,
    createdAt: row.created_at,
    note: row.note ?? undefined
  };
}

function getUserById(userId: string): DemoUser | undefined {
  const row = db.prepare("SELECT id, name, role, seller_id, description FROM users WHERE id = ?").get(userId) as UserRow | undefined;
  return row ? toDemoUser(row) : undefined;
}

function getUserByToken(token: string): DemoUser | undefined {
  const row = db.prepare(`
    SELECT users.id, users.name, users.role, users.seller_id, users.description
    FROM sessions
    INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ?
  `).get(token) as UserRow | undefined;

  return row ? toDemoUser(row) : undefined;
}

function computeAvailableWithdrawalAmount(sellerId: string): number {
  const settled = db.prepare(`
    SELECT COALESCE(SUM(amount_value), 0) AS total
    FROM orders
    WHERE seller_id = ? AND status = '已完成'
  `).get(sellerId) as { total: number };

  const reserved = db.prepare(`
    SELECT COALESCE(SUM(amount_value), 0) AS total
    FROM withdrawals
    WHERE seller_id = ? AND status IN ('待审核', '待打款登记', '已打款')
  `).get(sellerId) as { total: number };

  const grossSellerIncome = Math.floor(settled.total * env.SELLER_COMMISSION_RATE);
  return Math.max(0, grossSellerIncome - reserved.total);
}

function buildSellerMetrics(sellerId: string): DashboardStat[] {
  const resources = db.prepare("SELECT COUNT(*) AS count FROM resources WHERE seller_id = ?").get(sellerId) as { count: number };
  const pendingResources = db.prepare("SELECT COUNT(*) AS count FROM resources WHERE seller_id = ? AND audit_status = '待审核'").get(sellerId) as { count: number };
  const pendingDelivery = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE seller_id = ? AND status = '已支付待卖家发货'").get(sellerId) as { count: number };
  const completedIncome = db.prepare("SELECT COALESCE(SUM(amount_value), 0) AS total FROM orders WHERE seller_id = ? AND status = '已完成'").get(sellerId) as { total: number };

  return [
    { label: "资源总数", value: String(resources.count), description: "当前卖家名下已提交的资源数量。" },
    { label: "待审核资源", value: String(pendingResources.count), description: "等待管理员审核的卖家资源。" },
    { label: "待发货订单", value: String(pendingDelivery.count), description: "买家已下单，等待卖家发货。" },
    { label: "累计已结算", value: formatCurrency(Math.floor(completedIncome.total * env.SELLER_COMMISSION_RATE)), description: "买家确认收货后，按分佣比例计入卖家收益。" }
  ];
}

export function listDemoUsers(): DemoUser[] {
  const rows = db.prepare("SELECT id, name, role, seller_id, description FROM users ORDER BY role, id").all() as UserRow[];
  return rows.map(toDemoUser);
}

export function loginAs(userId: string): AuthSession | undefined {
  const user = getUserById(userId);

  if (!user) {
    return undefined;
  }

  const token = randomUUID();
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)").run(token, user.id, nowLabel());

  return { token, user };
}

export function getSessionByToken(token: string): AuthSession | undefined {
  const user = getUserByToken(token);
  return user ? { token, user } : undefined;
}

export function logoutByToken(token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function listPublicResources(type?: ResourceType): UploadedResourceRecord[] {
  const rows = type
    ? db.prepare("SELECT * FROM resources WHERE audit_status = '已上架' AND type = ? ORDER BY created_at DESC, id DESC").all(type)
    : db.prepare("SELECT * FROM resources WHERE audit_status = '已上架' ORDER BY created_at DESC, id DESC").all();

  return (rows as ResourceRow[]).map(toResourceRecord);
}

export function listFeaturedResources(): ResourceCard[] {
  return listPublicResources().map(({ description, highlights, deliveryFlow, isMemberIncluded, sourcePolicy, contactHint, sellerId, sourceLink, contact, auditStatus, createdAt, ...resource }) => resource);
}

export function getResource(resourceId: string): UploadedResourceRecord | undefined {
  const row = db.prepare("SELECT * FROM resources WHERE id = ?").get(resourceId) as ResourceRow | undefined;
  return row ? toResourceRecord(row) : undefined;
}

export function createResource(user: DemoUser, input: CreateResourceInput): UploadedResourceRecord | undefined {
  if (user.role !== "seller" || !user.sellerId) {
    return undefined;
  }

  const resource: UploadedResourceRecord = {
    id: `community-${Date.now()}`,
    title: input.title,
    summary: input.summary,
    description: input.description,
    type: "community",
    category: input.category,
    sellerName: user.name,
    priceAmount: input.priceAmount,
    priceLabel: formatCurrency(input.priceAmount),
    badge: "单独购买",
    coverTone: coverTones[Math.floor(Date.now() / 1000) % coverTones.length] ?? "teal",
    highlights: ["卖家自主整理", "需联系卖家获取提取码", "平台担保交易"],
    deliveryFlow: ["买家下单支付", "卖家私下发送提取码", "买家确认收货后自动结算"],
    isMemberIncluded: false,
    sourcePolicy: "平台不存储提取码，资源交付由买卖双方私下完成。",
    contactHint: "支付成功后在订单页查看卖家联系方式。",
    sellerId: user.sellerId,
    sourceLink: input.sourceLink,
    contact: input.contact,
    auditStatus: "待审核",
    createdAt: nowLabel()
  };

  db.prepare(`
    INSERT INTO resources (
      id, title, summary, description, type, category, seller_name, price_amount, price_label, badge,
      cover_tone, highlights_json, delivery_flow_json, is_member_included, source_policy, contact_hint,
      seller_id, source_link, contact, audit_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    resource.id,
    resource.title,
    resource.summary,
    resource.description,
    resource.type,
    resource.category,
    resource.sellerName,
    resource.priceAmount,
    resource.priceLabel,
    resource.badge,
    resource.coverTone,
    JSON.stringify(resource.highlights),
    JSON.stringify(resource.deliveryFlow),
    resource.isMemberIncluded ? 1 : 0,
    resource.sourcePolicy,
    resource.contactHint,
    resource.sellerId,
    resource.sourceLink,
    resource.contact,
    resource.auditStatus,
    resource.createdAt
  );

  return resource;
}

export function approveResource(resourceId: string): UploadedResourceRecord | undefined {
  const found = getResource(resourceId);

  if (!found) {
    return undefined;
  }

  db.prepare("UPDATE resources SET audit_status = '已上架' WHERE id = ?").run(resourceId);
  return getResource(resourceId);
}

export function listBuyerOrders(user: DemoUser): WorkflowOrderRecord[] {
  const rows = db.prepare("SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC, id DESC").all(user.id) as OrderRow[];
  return rows.map(toOrderRecord);
}

export function listSellerOrders(sellerId: string): WorkflowOrderRecord[] {
  const rows = db.prepare("SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC, id DESC").all(sellerId) as OrderRow[];
  return rows.map(toOrderRecord);
}

export function createOrder(user: DemoUser, input: CreateOrderInput): WorkflowOrderRecord | undefined {
  if (user.role === "admin") {
    return undefined;
  }

  const resource = getResource(input.resourceId);

  if (!resource || resource.type !== "community" || resource.auditStatus !== "已上架" || !resource.sellerId) {
    return undefined;
  }

  const order: WorkflowOrderRecord = {
    id: `order-${Date.now()}`,
    buyerId: user.id,
    buyerName: user.name,
    sellerId: resource.sellerId,
    sellerName: resource.sellerName,
    resourceId: resource.id,
    resourceTitle: resource.title,
    amountLabel: resource.priceLabel,
    amountValue: resource.priceAmount,
    status: "已支付待卖家发货",
    paymentStatus: "支付成功，已展示卖家联系方式",
    contact: resource.contact ?? "待补充联系方式",
    deliveryNote: "",
    createdAt: nowLabel()
  };

  db.prepare(`
    INSERT INTO orders (
      id, buyer_id, buyer_name, seller_id, seller_name, resource_id, resource_title,
      amount_label, amount_value, status, payment_status, contact, delivery_note, created_at,
      refund_reason, refund_review_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    order.id,
    order.buyerId,
    order.buyerName,
    order.sellerId,
    order.sellerName,
    order.resourceId,
    order.resourceTitle,
    order.amountLabel,
    order.amountValue,
    order.status,
    order.paymentStatus,
    order.contact,
    order.deliveryNote,
    order.createdAt,
    null,
    null
  );

  return order;
}

export function deliverOrder(user: DemoUser, orderId: string, input: DeliverOrderInput): WorkflowOrderRecord | undefined {
  if (user.role !== "seller" || !user.sellerId) {
    return undefined;
  }

  const found = db.prepare("SELECT * FROM orders WHERE id = ? AND seller_id = ?").get(orderId, user.sellerId) as OrderRow | undefined;

  if (!found || found.status !== "已支付待卖家发货") {
    return undefined;
  }

  db.prepare("UPDATE orders SET status = '待确认收货', delivery_note = ?, payment_status = '卖家已发货，等待买家确认' WHERE id = ?").run(input.deliveryNote, orderId);
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
  return updated ? toOrderRecord(updated) : undefined;
}

export function confirmOrder(user: DemoUser, orderId: string, _input: ConfirmOrderInput): WorkflowOrderRecord | undefined {
  const found = db.prepare("SELECT * FROM orders WHERE id = ? AND buyer_id = ?").get(orderId, user.id) as OrderRow | undefined;

  if (!found || found.status !== "待确认收货") {
    return undefined;
  }

  db.prepare("UPDATE orders SET status = '已完成', payment_status = '已确认收货，收益进入卖家结算' WHERE id = ?").run(orderId);
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
  return updated ? toOrderRecord(updated) : undefined;
}

export function requestRefund(user: DemoUser, orderId: string, input: RefundRequestInput): WorkflowOrderRecord | undefined {
  const found = db.prepare("SELECT * FROM orders WHERE id = ? AND buyer_id = ?").get(orderId, user.id) as OrderRow | undefined;

  if (!found || !["已支付待卖家发货", "待确认收货"].includes(found.status)) {
    return undefined;
  }

  db.prepare("UPDATE orders SET status = '退款处理中', payment_status = '买家已发起退款申请', refund_reason = ?, refund_review_note = NULL WHERE id = ?").run(input.reason, orderId);
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
  return updated ? toOrderRecord(updated) : undefined;
}

export function resolveRefund(orderId: string, input: ResolveRefundInput): WorkflowOrderRecord | undefined {
  const found = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;

  if (!found || found.status !== "退款处理中") {
    return undefined;
  }

  const nextStatus = input.approved ? "已退款" : found.delivery_note ? "待确认收货" : "已支付待卖家发货";
  const nextPaymentStatus = input.approved ? "退款完成，订单关闭" : "退款申请已驳回";

  db.prepare("UPDATE orders SET status = ?, payment_status = ?, refund_review_note = ? WHERE id = ?").run(nextStatus, nextPaymentStatus, input.note, orderId);
  const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as OrderRow | undefined;
  return updated ? toOrderRecord(updated) : undefined;
}

export function createWithdrawal(user: DemoUser, input: WithdrawalRequestInput): WithdrawalRow | undefined {
  if (user.role !== "seller" || !user.sellerId) {
    return undefined;
  }

  const minAmount = Math.round(env.MIN_WITHDRAWAL_AMOUNT * 100);
  const available = computeAvailableWithdrawalAmount(user.sellerId);

  if (input.amountValue < minAmount || input.amountValue > available) {
    return undefined;
  }

  const withdrawal: WithdrawalRow = {
    id: `wd-${Date.now()}`,
    sellerId: user.sellerId,
    sellerName: user.name,
    amountValue: input.amountValue,
    amountLabel: formatCurrency(input.amountValue),
    method: input.method,
    status: "待审核",
    account: input.account,
    createdAt: nowLabel(),
    note: "卖家已提交提现申请。"
  };

  db.prepare(`
    INSERT INTO withdrawals (id, seller_id, seller_name, amount_value, amount_label, method, status, account, created_at, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    withdrawal.id,
    withdrawal.sellerId,
    withdrawal.sellerName,
    withdrawal.amountValue,
    withdrawal.amountLabel,
    withdrawal.method,
    withdrawal.status,
    withdrawal.account,
    withdrawal.createdAt,
    withdrawal.note
  );

  return withdrawal;
}

export function reviewWithdrawal(withdrawalId: string, input: ReviewWithdrawalInput): WithdrawalRow | undefined {
  const found = db.prepare("SELECT * FROM withdrawals WHERE id = ?").get(withdrawalId) as WithdrawalDatabaseRow | undefined;

  if (!found) {
    return undefined;
  }

  const nextStatus = input.action === "approve"
    ? "待打款登记"
    : input.action === "paid"
      ? "已打款"
      : "已驳回";

  db.prepare("UPDATE withdrawals SET status = ?, note = ? WHERE id = ?").run(nextStatus, input.note, withdrawalId);
  const updated = db.prepare("SELECT * FROM withdrawals WHERE id = ?").get(withdrawalId) as WithdrawalDatabaseRow | undefined;
  return updated ? toWithdrawalRow(updated) : undefined;
}

export function getSellerWorkspace(user: DemoUser): SellerWorkspaceData | undefined {
  if (user.role !== "seller" || !user.sellerId) {
    return undefined;
  }

  const resources = (db.prepare("SELECT * FROM resources WHERE seller_id = ? ORDER BY created_at DESC, id DESC").all(user.sellerId) as ResourceRow[]).map(toResourceRecord);
  const orders = listSellerOrders(user.sellerId);
  const withdrawals = (db.prepare("SELECT * FROM withdrawals WHERE seller_id = ? ORDER BY created_at DESC, id DESC").all(user.sellerId) as WithdrawalDatabaseRow[]).map(toWithdrawalRow);
  const availableAmount = computeAvailableWithdrawalAmount(user.sellerId);

  return {
    user,
    metrics: buildSellerMetrics(user.sellerId),
    resources,
    orders,
    withdrawals,
    availableWithdrawalAmount: availableAmount,
    availableWithdrawalLabel: formatCurrency(availableAmount)
  };
}

export function getAdminOverview(): AdminOverview {
  const pendingResources = (db.prepare("SELECT * FROM resources WHERE audit_status = '待审核' ORDER BY created_at DESC, id DESC").all() as ResourceRow[])
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type === "official" ? "官方资源" : "用户贡献资源",
      owner: item.seller_name,
      status: item.audit_status
    }));

  const orders = (db.prepare("SELECT * FROM orders ORDER BY created_at DESC, id DESC").all() as OrderRow[]).map((item) => ({
    id: item.id,
    buyerName: item.buyer_name,
    resourceTitle: item.resource_title,
    amountLabel: item.amount_label,
    status: item.status
  }));

  const withdrawalRows = (db.prepare("SELECT * FROM withdrawals ORDER BY created_at DESC, id DESC").all() as WithdrawalDatabaseRow[]).map(toWithdrawalRow);

  return {
    stats: [
      { label: "待审核资源", value: String(pendingResources.length), description: "等待管理员审核的资源数量。" },
      { label: "订单总量", value: String(orders.length), description: "当前持久化环境中的订单总数。" },
      { label: "待处理退款", value: String(orders.filter((item) => item.status === "退款处理中").length), description: "买家已发起但尚未审核完成的退款申请。" },
      { label: "待审提现", value: String(withdrawalRows.filter((item) => item.status === "待审核").length), description: "卖家新提交、等待管理员审核的提现申请。" }
    ],
    pending: pendingResources,
    orders,
    withdrawals: withdrawalRows
  };
}
