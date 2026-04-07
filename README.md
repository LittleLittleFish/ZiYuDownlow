# ZiYuDownlow

ZiYuDownlow 是一个资源整理类付费撮合平台，聚焦公开免费资源的整理、展示、交易担保、分佣结算与会员权益管理。

## 项目目标

- 不存储资源文件，不参与资源交付。
- 不存储提取码，降低版权和数据风险。
- 提供交易担保、分佣结算、退款处理、卖家提现与后台治理能力。
- 区分官方资源与用户贡献资源，会员只覆盖官方资源。

## 当前范围

当前仓库为 MVP 启动版本，包含三部分内容：

- 启动文档包：PRD、架构、数据设计、接口概览、上线清单、运营与风控。
- 单仓代码骨架：前台 Web、管理后台、API 服务、共享类型包、基础设施目录。
- 首批初始化代码：页面、后台、API、SQLite 本地持久化、登录会话、资源审核、下单、发货、退款与提现闭环。

## 推荐技术栈

- Web/App Shell: Next.js 15 + React 19 + TypeScript
- Admin: Next.js 15 + React 19 + TypeScript
- API: Node.js + Express + TypeScript + Zod
- Database: SQLite（当前默认） / PostgreSQL（后续可切换）
- Cache/Queue: Redis（预留）
- Infra: Docker Compose（预留）

## 目录结构

```text
apps/
  web/      前台站点
  admin/    管理后台
services/
  api/      后端 API 服务
packages/
  shared/   共享类型、常量与领域模型
infra/
  docker/   本地开发依赖与部署样例
docs/       项目文档
```

## 快速开始

1. 安装 Node.js 20+
2. 在仓库根目录执行 `npm install`
3. 复制环境文件：`cp .env.example .env`
4. 启动 API：`npm run dev --workspace @ziyu/api`
5. 启动前台：`npm run dev --workspace @ziyu/web`
6. 启动后台：`npm run dev --workspace @ziyu/admin`

当前默认使用 SQLite 本地数据库文件，不依赖 Docker。API 首次启动会自动初始化数据库并写入演示数据。

## 优先开发顺序

1. 用户/卖家身份与权限
2. 资源上传与审核
3. 下单支付与订单闭环
4. 分佣、退款、提现
5. 会员与官方资源专区
6. 风控、通知与运营工具

## 关键业务边界

- 平台仅保存卖家联系方式，不保存提取码。
- 买家付款成功后，在订单页查看卖家联系方式，自行联系卖家获取提取码。
- 买家确认收货后才结算卖家收益。
- 用户贡献资源不纳入会员权益。

## 文档索引

- [产品需求](docs/prd-mvp.md)
- [系统架构](docs/system-architecture.md)
- [数据库设计](docs/database-design.md)
- [接口概览](docs/api-overview.md)
- [上线清单](docs/release-checklist.md)
- [运营与风控](docs/operations-and-risk.md)
