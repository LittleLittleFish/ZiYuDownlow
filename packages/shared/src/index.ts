export type ResourceType = "official" | "community";
export type ResourceCategory = "工具类" | "教程类" | "素材类" | "代码类" | "AI 类";
export type OrderStatus = "待支付" | "已支付待卖家发货" | "待确认收货" | "已完成" | "退款处理中" | "已退款";
export type UserPortalRole = "buyer" | "seller" | "admin";
export type ResourceAuditStatus = "待审核" | "已上架" | "已驳回";

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface DashboardStat {
  label: string;
  value: string;
  description: string;
}

export interface ResourceCard {
  id: string;
  title: string;
  summary: string;
  type: ResourceType;
  category: ResourceCategory;
  sellerName: string;
  priceAmount: number;
  priceLabel: string;
  badge: string;
  coverTone: string;
}

export interface ResourceDetail extends ResourceCard {
  description: string;
  highlights: string[];
  deliveryFlow: string[];
  isMemberIncluded: boolean;
  sourcePolicy: string;
  contactHint: string;
}

export interface BuyerOrder {
  id: string;
  resourceId: string;
  resourceTitle: string;
  sellerName: string;
  amountLabel: string;
  status: OrderStatus;
  paymentStatus: string;
  contact: string;
  createdAt: string;
  actionLabel: string;
  canConfirm: boolean;
  canRefund: boolean;
}

export interface SellerResourceRow {
  id: string;
  title: string;
  category: ResourceCategory;
  auditStatus: string;
  priceLabel: string;
  monthlySales: string;
}

export interface SellerOrderRow {
  id: string;
  resourceTitle: string;
  buyerName: string;
  status: string;
  incomeLabel: string;
}

export interface SellerDashboard {
  metrics: DashboardStat[];
  resources: SellerResourceRow[];
  orders: SellerOrderRow[];
}

export interface PendingAuditItem {
  id: string;
  title: string;
  type: string;
  owner: string;
  status: string;
}

export interface AdminOrderRow {
  id: string;
  buyerName: string;
  resourceTitle: string;
  amountLabel: string;
  status: string;
}

export interface WithdrawalRow {
  id: string;
  sellerId?: string;
  sellerName: string;
  amountValue?: number;
  amountLabel: string;
  method: string;
  status: string;
  account?: string;
  createdAt?: string;
  note?: string;
}

export interface AdminOverview {
  stats: DashboardStat[];
  pending: PendingAuditItem[];
  orders: AdminOrderRow[];
  withdrawals: WithdrawalRow[];
}

export interface PlatformMeta {
  categories: readonly ResourceCategory[];
  commission: { platform: number; seller: number };
  minWithdrawalAmount: number;
}

export interface DemoUser {
  id: string;
  name: string;
  role: UserPortalRole;
  sellerId?: string;
  description: string;
}

export interface AuthSession {
  token: string;
  user: DemoUser;
}

export interface CreateOrderInput {
  buyerId: string;
  resourceId: string;
}

export interface DeliverOrderInput {
  sellerId: string;
  deliveryNote: string;
}

export interface ConfirmOrderInput {
  buyerId: string;
}

export interface RefundRequestInput {
  reason: string;
}

export interface ResolveRefundInput {
  approved: boolean;
  note: string;
}

export interface CreateResourceInput {
  sellerId: string;
  title: string;
  summary: string;
  description: string;
  category: ResourceCategory;
  sourceLink: string;
  contact: string;
  priceAmount: number;
}

export interface WithdrawalRequestInput {
  amountValue: number;
  method: string;
  account: string;
}

export interface ReviewWithdrawalInput {
  action: "approve" | "paid" | "reject";
  note: string;
}

export interface UploadedResourceRecord extends ResourceDetail {
  sellerId?: string;
  sourceLink?: string;
  contact?: string;
  auditStatus: ResourceAuditStatus;
  createdAt: string;
}

export interface WorkflowOrderRecord {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  resourceId: string;
  resourceTitle: string;
  amountLabel: string;
  amountValue: number;
  status: OrderStatus;
  paymentStatus: string;
  contact: string;
  deliveryNote: string;
  createdAt: string;
  refundReason?: string;
  refundReviewNote?: string;
}

export interface BuyerCenterData {
  user: DemoUser;
  orders: WorkflowOrderRecord[];
}

export interface SellerWorkspaceData {
  user: DemoUser;
  metrics: DashboardStat[];
  resources: UploadedResourceRecord[];
  orders: WorkflowOrderRecord[];
  withdrawals: WithdrawalRow[];
  availableWithdrawalAmount: number;
  availableWithdrawalLabel: string;
}

export const resourceCategories = ["工具类", "教程类", "素材类", "代码类", "AI 类"] as const;

export const resourceDetails: ResourceDetail[] = [
  {
    id: "official-001",
    title: "官方 AI 工具导航精选集",
    summary: "覆盖写作、办公、绘图、视频等公开免费工具，并附上筛选建议与场景说明。",
    description: "面向内容创作者和效率团队的官方整理资源，聚合公开免费工具入口、优缺点、适用人群和更新频率，适合会员快速建立工作流。",
    type: "official",
    category: "AI 类",
    sellerName: "平台官方",
    priceAmount: 0,
    priceLabel: "会员免费",
    badge: "会员权益",
    coverTone: "teal",
    highlights: ["平台官方整理", "每周更新工具入口", "附上选型建议"],
    deliveryFlow: ["开通会员", "进入资源详情", "直接下载官方整理文档"],
    isMemberIncluded: true,
    sourcePolicy: "官方资源可直接在站内查看整理说明和跳转入口。",
    contactHint: "官方资源无需联系卖家。"
  },
  {
    id: "official-002",
    title: "开源自动化脚本实战包",
    summary: "精选高质量开源自动化项目，适合效率工具、数据采集和日常任务编排。",
    description: "从 GitHub、开源社区和技术论坛筛选出适合上手的自动化脚本项目，提供用途说明、依赖条件、上手难度和风险提示。",
    type: "official",
    category: "代码类",
    sellerName: "平台官方",
    priceAmount: 0,
    priceLabel: "会员免费",
    badge: "会员权益",
    coverTone: "amber",
    highlights: ["开源许可说明", "适用场景分类", "包含部署难度标注"],
    deliveryFlow: ["开通会员", "进入资源详情", "获取官方整理说明与项目入口"],
    isMemberIncluded: true,
    sourcePolicy: "平台仅整理开源项目入口，不托管项目文件。",
    contactHint: "官方资源无需联系卖家。"
  },
  {
    id: "community-001",
    title: "设计素材网盘导航合集",
    summary: "整理多个公开免费素材来源，附上分类筛选和使用建议，适合设计师快速取材。",
    description: "卖家对公开免费素材源进行了主题化整理，买家支付后可查看卖家联系方式，私下联系获取网盘提取码和分类说明。",
    type: "community",
    category: "素材类",
    sellerName: "设计实验室",
    priceAmount: 2990,
    priceLabel: "¥29.90",
    badge: "单独购买",
    coverTone: "rose",
    highlights: ["公开免费来源筛选", "按风格与用途分类", "适合 UI 和海报设计"],
    deliveryFlow: ["下单支付", "订单页查看卖家联系方式", "联系卖家获取提取码"],
    isMemberIncluded: false,
    sourcePolicy: "平台不保存提取码，资源交付由买卖双方私下完成。",
    contactHint: "支付完成后在订单页展示微信与 QQ 联系方式。"
  },
  {
    id: "community-002",
    title: "前端实战教程资源总表",
    summary: "围绕 React、Next.js、工程化和部署，整理成可检索的教程索引。",
    description: "面向前端学习者的教程目录集合，覆盖基础、项目、部署和性能优化。卖家提供教程筛选逻辑和提取方式说明。",
    type: "community",
    category: "教程类",
    sellerName: "前端上岸计划",
    priceAmount: 1990,
    priceLabel: "¥19.90",
    badge: "单独购买",
    coverTone: "slate",
    highlights: ["按学习路径排序", "含免费课程入口", "适合求职与进阶"],
    deliveryFlow: ["下单支付", "联系卖家", "获取提取码和学习建议"],
    isMemberIncluded: false,
    sourcePolicy: "平台仅担保交易，不参与密码传递。",
    contactHint: "卖家需在 24 小时内响应，否则买家可申请退款。"
  },
  {
    id: "community-003",
    title: "AI 绘图模型公开资源指引",
    summary: "提供模型来源、版本差异、适用场景和下载路线，便于快速定位。",
    description: "聚焦 AI 绘图公开资源的整理和适配说明，适合需要快速试验不同模型、但不想自己做信息清洗的用户。",
    type: "community",
    category: "AI 类",
    sellerName: "模型路由局",
    priceAmount: 3990,
    priceLabel: "¥39.90",
    badge: "单独购买",
    coverTone: "violet",
    highlights: ["含版本对比", "含适用场景建议", "适合快速试验"],
    deliveryFlow: ["下单支付", "查看订单页联系方式", "向卖家索取提取码"],
    isMemberIncluded: false,
    sourcePolicy: "平台不存储任何模型资源和提取码。",
    contactHint: "支付完成后才展示卖家联系方式。"
  }
];

export const featuredResources: ResourceCard[] = resourceDetails.map(({ description, highlights, deliveryFlow, isMemberIncluded, sourcePolicy, contactHint, ...resource }) => resource);

export const platformHighlights: DashboardStat[] = [
  {
    label: "资源治理边界",
    value: "0 提取码托管",
    description: "平台只做展示、担保、结算和规则治理，不接触提取码。"
  },
  {
    label: "卖家收益比例",
    value: "70%",
    description: "确认收货后自动按默认比例进入卖家收益台账。"
  },
  {
    label: "会员权益范围",
    value: "仅官方资源",
    description: "用户贡献资源保持单独购买，避免权益混淆。"
  }
];

export const buyerOrders: BuyerOrder[] = [
  {
    id: "order-20260401-001",
    resourceId: "community-001",
    resourceTitle: "设计素材网盘导航合集",
    sellerName: "设计实验室",
    amountLabel: "¥29.90",
    status: "待确认收货",
    paymentStatus: "支付成功",
    contact: "微信: design-lab / QQ: 172009",
    createdAt: "2026-04-01 21:14",
    actionLabel: "确认收货",
    canConfirm: true,
    canRefund: true
  },
  {
    id: "order-20260402-006",
    resourceId: "official-001",
    resourceTitle: "官方 AI 工具导航精选集",
    sellerName: "平台官方",
    amountLabel: "会员获取",
    status: "已完成",
    paymentStatus: "权益已生效",
    contact: "无需联系卖家",
    createdAt: "2026-04-02 09:26",
    actionLabel: "查看资源",
    canConfirm: false,
    canRefund: false
  }
];

export const sellerDashboard: SellerDashboard = {
  metrics: [
    { label: "总收益", value: "¥12,860", description: "累计确认收货后结算的总金额。" },
    { label: "可提现", value: "¥3,240", description: "可立即发起提现申请的金额。" },
    { label: "待审核资源", value: "3", description: "正在等待平台审核的资源数量。" },
    { label: "本月订单", value: "68", description: "当月已支付订单数量。" }
  ],
  resources: [
    { id: "community-001", title: "设计素材网盘导航合集", category: "素材类", auditStatus: "已上架", priceLabel: "¥29.90", monthlySales: "32 单" },
    { id: "community-002", title: "前端实战教程资源总表", category: "教程类", auditStatus: "审核中", priceLabel: "¥19.90", monthlySales: "18 单" },
    { id: "community-003", title: "AI 绘图模型公开资源指引", category: "AI 类", auditStatus: "已上架", priceLabel: "¥39.90", monthlySales: "12 单" }
  ],
  orders: [
    { id: "seller-order-001", resourceTitle: "设计素材网盘导航合集", buyerName: "木木用户", status: "待确认收货", incomeLabel: "¥20.93" },
    { id: "seller-order-002", resourceTitle: "AI 绘图模型公开资源指引", buyerName: "图像研究员", status: "已完成", incomeLabel: "¥27.93" },
    { id: "seller-order-003", resourceTitle: "前端实战教程资源总表", buyerName: "前端新人", status: "退款处理中", incomeLabel: "待定" }
  ]
};

export const adminDashboardStats: DashboardStat[] = [
  { label: "待审核资源", value: "18", description: "等待管理员处理的资源数量。" },
  { label: "今日订单", value: "124", description: "已支付和待确认订单总量。" },
  { label: "待处理退款", value: "6", description: "买家已发起、管理员未完结的退款申请。" },
  { label: "待审提现", value: "9", description: "卖家已申请、尚未完成审核或打款登记。" }
];

export const pendingAuditItems: PendingAuditItem[] = [
  { id: "audit-001", title: "Stable Diffusion 模型整理合集", type: "用户贡献资源", owner: "设计实验室", status: "待审核" },
  { id: "audit-002", title: "公开免费字体资源导航", type: "官方资源", owner: "平台运营", status: "待审核" },
  { id: "audit-003", title: "自动化办公脚本精选", type: "用户贡献资源", owner: "效率派卖家", status: "待补充说明" }
];

export const adminOrders: AdminOrderRow[] = [
  { id: "order-20260401-001", buyerName: "木木用户", resourceTitle: "设计素材网盘导航合集", amountLabel: "¥29.90", status: "待确认收货" },
  { id: "order-20260402-010", buyerName: "前端新人", resourceTitle: "前端实战教程资源总表", amountLabel: "¥19.90", status: "退款处理中" },
  { id: "order-20260403-002", buyerName: "模型玩家", resourceTitle: "AI 绘图模型公开资源指引", amountLabel: "¥39.90", status: "已完成" }
];

export const withdrawals: WithdrawalRow[] = [
  { id: "wd-001", sellerId: "seller-001", sellerName: "设计实验室", amountValue: 120000, amountLabel: "¥1200.00", method: "支付宝", status: "待审核", account: "design-lab@alipay", createdAt: "2026-04-01 20:40", note: "等待管理员审核。" },
  { id: "wd-002", sellerId: "seller-ext-003", sellerName: "模型路由局", amountValue: 86000, amountLabel: "¥860.00", method: "微信", status: "待打款登记", account: "model-routing-wechat", createdAt: "2026-04-02 11:20", note: "已审核通过，待登记打款。" },
  { id: "wd-003", sellerId: "seller-ext-002", sellerName: "前端上岸计划", amountValue: 42000, amountLabel: "¥420.00", method: "支付宝", status: "已驳回", account: "frontend-plan@alipay", createdAt: "2026-04-02 15:10", note: "资料不完整，已驳回。" }
];

export const adminOverview: AdminOverview = {
  stats: adminDashboardStats,
  pending: pendingAuditItems,
  orders: adminOrders,
  withdrawals
};

export const membershipPlans = [
  { code: "month", name: "月度会员", priceLabel: "¥39", description: "适合短期集中获取官方整理资源。" },
  { code: "quarter", name: "季度会员", priceLabel: "¥99", description: "适合阶段性系统学习和工具筛选。" },
  { code: "year", name: "年度会员", priceLabel: "¥299", description: "适合长期持续跟进官方资源更新。" }
] as const;

export const demoUsers: DemoUser[] = [
  {
    id: "buyer-001",
    name: "木木用户",
    role: "buyer",
    description: "普通购买用户，用于体验资源浏览、下单和确认收货。"
  },
  {
    id: "seller-user-001",
    name: "设计实验室",
    role: "seller",
    sellerId: "seller-001",
    description: "卖家账号，用于上传资源、发货、查看收益和订单。"
  },
  {
    id: "admin-001",
    name: "平台管理员",
    role: "admin",
    description: "后台管理员，用于审核资源和查看订单总览。"
  }
];

export function findResourceById(resourceId: string): ResourceDetail | undefined {
  return resourceDetails.find((item) => item.id === resourceId);
}
