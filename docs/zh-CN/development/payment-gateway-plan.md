# 支付网关接入方案

- 最后更新: 2026-03-08
- 状态: 阶段一已实现 Stripe Checkout + Webhook；本文保留为设计依据与二期扩展参考

## 用途

说明当前项目如何把“公开结账创建订单”升级为“创建支付会话 + 支付回调确认订单”，并保留后续扩展 provider、状态机和库存补偿策略的设计依据。

## 相关链接

- [多卖家独立收款改造方案](./stripe-connect-marketplace-plan.md)

## 适用范围

- 商店公开结账链路改造
- 订单支付状态与库存策略设计
- 支付回调、环境变量和测试范围规划

## 来源依据

- 当前仓库的 `POST /api/shop/checkout`、订单状态与库存实现
- Stripe 官方 Checkout / Webhook / Session 过期文档
- PayPal 官方 JS SDK / Orders API 文档

## 结论

阶段一推荐接入 **Stripe Checkout（Hosted Checkout）**，不在第一阶段同时接 PayPal。

这是基于当前代码结构做出的工程判断：

- 当前公开下单入口已经是服务端 API `POST /api/shop/checkout`，天然适合由服务端创建 Stripe Checkout Session，再把跳转 URL 返回前端
- 当前系统已经依赖服务端订单状态更新和邮件通知，Webhook 回写比在浏览器端直接确认支付更契合现有模型
- 当前订单只支持单卖家结账，正好适配 Stripe Checkout 的单次结账会话模型
- PayPal 官方推荐路径更偏向前端 JS SDK + Orders API 组合；如果没有明确的钱包支付需求，第一阶段会额外拉高前端和服务端耦合面

结论不是“PayPal 不可用”，而是 **Stripe 更适合先落地 MVP**。如果后续业务明确要求 PayPal Wallet，再作为第二阶段扩展。

## 当前代码基线

- `POST /api/shop/checkout` 已改为预留 `AWAITING_PAYMENT` 订单、立即占库存，并创建 Stripe Checkout Session
- `Order` 已扩展 `currency`、`paymentProvider`、`paymentStatus`、`paymentSessionId`、`paymentIntentId`、`paymentExpiresAt`、`paymentFailedAt`、`paymentFailureReason`
- `POST /api/payments/stripe/webhook` 已处理支付成功、异步失败和会话过期
- 订单详情页已基于 `orderId + buyerEmail` 公开读取，并在待确认时轮询支付状态
- 卖家后台已能搜索订单、更新履约状态、导出 CSV，并区分 `AWAITING_PAYMENT`

## 阶段一目标

- 访客点击下单后，不再直接把订单当作已成立业务单，而是先创建支付会话
- 支付成功只能由 Stripe Webhook 驱动回写，不能依赖前端 success URL 自行判定
- 保留当前“单卖家结账”限制，不在支付阶段顺带引入购物车或多卖家拆单
- 保留当前公开订单详情页，但在支付未确认时展示“等待支付确认”而不是“已下单成功”

当前实现已经满足以上阶段一目标。

## 非目标

- 不在这一阶段同时做购物车
- 不在这一阶段同时做多卖家结账
- 不在这一阶段同时做退款自动化
- 不在这一阶段引入独立的支付对账后台

## 推荐状态机

### 订单状态

- `AWAITING_PAYMENT`: 已创建支付会话，库存已占用，等待回调确认
- `PAID`: 已收款，可进入发货流程
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

### 支付状态

建议新增独立字段 `paymentStatus`，不要把履约状态和支付状态混在同一个字段里：

- `OPEN`: 支付会话已创建，尚未完成
- `PAID`: 已支付
- `FAILED`: 支付失败
- `EXPIRED`: 支付超时
- `REFUNDED`: 已退款（预留）

这样卖家后台能清楚区分“待支付”和“待发货”，不会再把当前的 `PENDING` 混成两个语义。

## 库存策略

阶段一推荐 **沿用当前“创建订单时立即扣库存”的思路，但把它升级为“支付会话占库存”**，而不是改成“支付成功后再扣库存”。

理由：

- 当前系统已经在事务内完成订单创建和扣库存，迁移成本最低
- 公开结账仍然是单商品/单卖家场景，保留库存占用更能避免超卖
- 如果改成“支付成功后才扣库存”，当前没有购物车和库存预留表，会明显增加并发超卖风险

配套要求：

- 创建支付会话时把订单写成 `AWAITING_PAYMENT`
- Stripe `checkout.session.completed` 或异步支付成功事件到达后，把订单更新为 `PAID`
- Stripe `checkout.session.expired` 或支付失败事件到达后，回滚库存并把订单改成 `CANCELLED`
- 再补一个定时补偿任务，兜底清理超时未支付但漏掉 Webhook 的订单

## 推荐 API 形态

以下接口已经是当前已上线行为。

### 保留并改造现有入口

- `POST /api/shop/checkout`

建议仍保留这个路由作为公开结账入口，但响应从当前的 `{ order }` 调整为：

```json
{
  "orderId": "ord_xxx",
  "provider": "STRIPE",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "expiresAt": "2026-03-08T12:34:56.000Z"
}
```

服务端职责：

1. 重新校验商品、价格、库存、卖家归属
2. 创建 `AWAITING_PAYMENT` 订单并占用库存
3. 创建 Stripe Checkout Session
4. 把 `orderId`、`sellerId`、`buyerEmail` 写进 metadata
5. 返回 Stripe 跳转地址

### 新增 Webhook 入口

- `POST /api/payments/stripe/webhook`

职责：

- 验证 `Stripe-Signature`
- 处理 `checkout.session.completed`
- 处理 `checkout.session.async_payment_succeeded`
- 处理 `checkout.session.async_payment_failed`
- 处理 `checkout.session.expired`
- 幂等更新订单和库存

### 保留订单详情读取

- `GET /api/shop/orders/[id]`

保持现有卖家读取和访客 `buyerEmail` 证明边界不变，只扩展未支付状态展示。

## 推荐数据字段

阶段一不建议立刻拆独立 `PaymentTransaction` 表，先把支付主键挂在 `Order` 上，等未来需要退款、多次扣款、对账流水时再拆表。

建议给 `Order` 增加以下字段：

- `currency`，默认 `JPY`
- `paymentProvider`，如 `STRIPE`
- `paymentStatus`
- `paymentSessionId`
- `paymentIntentId`
- `paymentExpiresAt`
- `paymentFailedAt`
- `paymentFailureReason`

建议保留并继续使用：

- `paidAt`
- `shippingAddress`
- `shippingMethod`

## 前端交互建议

### 公开结账页

- 提交表单后调用 `POST /api/shop/checkout`
- 成功拿到 `checkoutUrl` 后立刻 `window.location.assign(checkoutUrl)`
- 不在前端自行把订单标成已支付

### 支付成功页

沿用现有 `/u/[slug]/shop/order-success/[orderId]`，但文案和行为要改成两段式：

- 初次进入先显示“支付结果确认中”
- 轮询订单详情，直到状态从 `AWAITING_PAYMENT` 变成 `PAID`
- 如果长时间仍未确认，提示“支付已提交，请稍后刷新或检查邮箱”

### 卖家后台

- 订单列表增加 `AWAITING_PAYMENT` 过滤项
- 默认动作不允许卖家手动把 `AWAITING_PAYMENT` 改成 `PAID`
- 支付状态字段应只由 Webhook 或内部补偿任务更新

## 幂等与安全要求

- Webhook 必须校验签名，不能把普通 JSON POST 当成可信来源
- 订单更新必须基于 `paymentSessionId` 或 `paymentIntentId` 做幂等
- 若订单已是 `PAID`，重复成功事件应直接忽略
- 只有在 `paymentStatus=OPEN` 时才允许执行“失败/过期释放库存”
- 前端 success URL 只用于展示，不作为支付成功的真相来源

## 环境变量规划

这些变量已经被代码消费，但当前仍保持“缺失时警告、运行时返回 503”的软校验：

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY`，建议默认 `JPY`

阶段一采用 Hosted Checkout，不要求前端先接 `Stripe.js`，因此 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 不是必需项。

## 推荐实施顺序

1. 扩展 Prisma `Order` 字段与状态枚举，补迁移
2. 改造 `POST /api/shop/checkout` 为“创建支付会话”
3. 接入 `POST /api/payments/stripe/webhook`
4. 调整公开成功页与卖家后台订单过滤
5. 增加超时补偿任务
6. 补自动化测试和 Stripe test mode 联调

其中 1-4 和自动化测试已完成；定时补偿任务与 Stripe test mode 实机联调仍待继续推进。

## 验证清单

- 成功支付后订单从 `AWAITING_PAYMENT` 进入 `PAID`
- 支付失败或超时后库存能回补
- 重复 Webhook 不会重复扣库存或重复发信
- 公开订单页在 Webhook 到达前不会误显示“已支付”
- 卖家后台不能手动伪造 `PAID`

## 官方参考

- Stripe Checkout: [https://docs.stripe.com/payments/checkout](https://docs.stripe.com/payments/checkout)
- Stripe Webhooks: [https://docs.stripe.com/webhooks](https://docs.stripe.com/webhooks)
- Stripe Checkout Session expire: [https://docs.stripe.com/api/checkout/sessions/expire](https://docs.stripe.com/api/checkout/sessions/expire)
- PayPal JS SDK 概览: [https://developer.paypal.com/sdk/js/](https://developer.paypal.com/sdk/js/)
- PayPal Orders API: [https://developer.paypal.com/docs/api/orders/v2/](https://developer.paypal.com/docs/api/orders/v2/)
