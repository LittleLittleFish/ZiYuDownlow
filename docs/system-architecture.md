# 系统架构设计

## 1. 总体架构

采用单仓多应用结构：

- apps/web: 用户前台与 H5
- apps/admin: 管理后台
- services/api: 后端 API 与业务编排
- packages/shared: 共享类型、常量、状态机定义
- infra/docker: 本地 PostgreSQL 与 Redis 依赖

## 2. 技术选型

### 2.1 前端
- Next.js 15
- React 19
- TypeScript
- App Router

### 2.2 后端
- Express + TypeScript
- Zod 做请求校验
- 按业务域拆模块

### 2.3 数据与基础设施
- PostgreSQL: 订单、账户、审核、日志
- Redis: 会话、限流、幂等、队列
- Docker Compose: 本地依赖与开发环境

## 3. 业务边界

### 平台负责
- 资源展示
- 支付创建与回调接收
- 订单担保与状态流转
- 佣金计算与收益台账
- 退款处理与提现审核
- 用户、卖家、资源和系统治理

### 平台不负责
- 存储资源文件
- 存储或传递提取码
- 直接参与卖家私下交付

## 4. 核心模块

### 4.1 Auth
- 注册、登录、Token 刷新
- 角色识别

### 4.2 Resources
- 资源增删改查
- 审核状态管理
- 官方资源与用户贡献资源分流

### 4.3 Orders
- 创建订单
- 支付前检查
- 订单状态流转
- 确认收货与退款申请

### 4.4 Payments
- 支付下单
- 第三方回调验签
- 幂等处理

### 4.5 Commission
- 平台/卖家分账比例计算
- 结算入账台账

### 4.6 Withdrawals
- 提现申请
- 后台审核
- 线下打款登记

### 4.7 Memberships
- 官方资源会员权益
- 会员套餐与有效期

### 4.8 Admin
- 审核与风控后台
- 系统配置
- 操作日志

## 5. 状态机建议

### 5.1 资源状态
- draft
- pending_review
- approved
- rejected
- off_shelf

### 5.2 订单状态
- pending_payment
- paid_pending_delivery
- delivered_waiting_confirm
- completed
- refund_requested
- refunded
- closed

### 5.3 提现状态
- pending_review
- approved_waiting_transfer
- transferred
- rejected

## 6. 安全要求

- 后台接口全部鉴权
- 支付回调必须验签和幂等
- 联系方式对未购买用户不可见
- 管理员操作必须记录审计日志
- 关键接口加限流和风控规则

## 7. 上线优先级

1. 用户认证
2. 资源管理与审核
3. 订单与支付
4. 分佣与退款
5. 提现与会员
6. 风控与通知
