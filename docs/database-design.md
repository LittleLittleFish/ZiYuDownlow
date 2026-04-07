# 数据库设计

## 1. 设计原则

- 账务相关表以 PostgreSQL 事务一致性为核心
- 所有金额字段使用最小货币单位整数存储
- 审核、支付、退款、提现均保留审计轨迹
- 关键状态变化表具备 created_at、updated_at、operator_id 字段

## 2. 主要实体

### 2.1 users
- id
- phone
- email
- nickname
- password_hash
- role
- status
- created_at
- updated_at

### 2.2 seller_profiles
- id
- user_id
- display_name
- contact_wechat
- contact_qq
- payout_method
- payout_account
- audit_status
- violation_score
- created_at
- updated_at

### 2.3 resources
- id
- owner_type
- seller_id
- title
- summary
- cover_url
- category
- source_link
- price_amount
- currency
- is_official
- audit_status
- shelf_status
- created_at
- updated_at

### 2.4 resource_audits
- id
- resource_id
- reviewer_id
- result
- reason
- created_at

### 2.5 orders
- id
- order_no
- buyer_id
- seller_id
- resource_id
- order_type
- amount_total
- currency
- status
- payment_status
- contact_revealed_at
- confirmed_at
- created_at
- updated_at

### 2.6 payments
- id
- order_id
- provider
- provider_trade_no
- amount_total
- status
- callback_payload
- paid_at
- created_at

### 2.7 refunds
- id
- order_id
- applicant_id
- reason
- status
- refund_amount
- processed_by
- processed_at
- created_at

### 2.8 commission_ledgers
- id
- order_id
- seller_id
- platform_amount
- seller_amount
- status
- settled_at
- created_at

### 2.9 seller_wallets
- id
- seller_id
- available_amount
- frozen_amount
- total_income_amount
- total_withdrawn_amount
- updated_at

### 2.10 withdrawal_requests
- id
- seller_id
- wallet_id
- amount
- payout_method
- payout_account_masked
- status
- reviewed_by
- reviewed_at
- transfer_reference
- created_at

### 2.11 memberships
- id
- user_id
- plan_code
- started_at
- expired_at
- status
- created_at

### 2.12 membership_plans
- id
- code
- name
- duration_days
- price_amount
- status
- created_at

### 2.13 system_settings
- id
- setting_key
- setting_value
- updated_by
- updated_at

### 2.14 audit_logs
- id
- operator_id
- target_type
- target_id
- action
- detail_json
- created_at

## 3. 关键索引

- users(phone) unique
- orders(order_no) unique
- payments(provider_trade_no) unique
- resources(category, audit_status, shelf_status)
- withdrawal_requests(seller_id, status)
- commission_ledgers(order_id) unique

## 4. 金额约束

- 所有金额字段以分为单位
- 佣金比例由系统设置控制，但结算时写入台账，不依赖后续回算
- 退款必须校验订单状态与可退金额

## 5. 审计要求

- 资源审核
- 卖家审核
- 退款处理
- 提现审核
- 分佣结算
- 系统设置变更
