# API 接口概览

## 1. 认证与用户

### POST /api/auth/register
用户注册

### POST /api/auth/login
用户登录

### GET /api/users/me
获取当前用户信息

### POST /api/sellers/apply
申请成为卖家

## 2. 资源

### GET /api/resources
资源列表

支持查询参数：
- type: official | community
- category
- keyword
- page
- pageSize

### GET /api/resources/:id
资源详情

### POST /api/resources
卖家创建资源

### PATCH /api/resources/:id
卖家编辑资源

### POST /api/resources/:id/submit-review
提交审核

## 3. 订单与支付

### POST /api/orders
创建订单

### GET /api/orders/:id
订单详情

### POST /api/orders/:id/confirm
确认收货

### POST /api/orders/:id/refund-request
申请退款

### POST /api/payments/checkout
创建支付单

### POST /api/payments/callback
第三方支付回调

## 4. 会员

### GET /api/membership/plans
会员套餐列表

### POST /api/membership/orders
创建会员订单

## 5. 卖家收益与提现

### GET /api/seller/wallet
卖家钱包信息

### GET /api/seller/commissions
卖家收益明细

### POST /api/seller/withdrawals
提交提现申请

## 6. 管理后台

### GET /api/admin/resources/pending
待审核资源

### POST /api/admin/resources/:id/approve
审核通过

### POST /api/admin/resources/:id/reject
审核驳回

### GET /api/admin/orders
订单列表

### POST /api/admin/refunds/:id/approve
退款通过

### POST /api/admin/withdrawals/:id/approve
提现通过

### POST /api/admin/withdrawals/:id/reject
提现驳回

## 7. 基础规范

- 所有写接口必须支持幂等处理
- 统一返回结构：success、data、error
- 后台接口必须附带角色权限校验
- 支付与退款回调必须记录原始回调体
