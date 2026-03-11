# Stripe Connect 多卖家独立收款改造方案

- 最后更新: 2026-03-11
- 状态: 设计草案，尚未进入实际迁移

## 用途

把当前“平台统一 Stripe 收款”升级为“卖家独立收款”的可执行方案，覆盖数据模型、后台入口、Stripe Connect 接法、Webhook、对账与迁移顺序。

## 适用范围

- 多卖家独立收款改造
- Stripe Connect onboarding / payout 设计
- 订单、退款、争议、结算与卖家收款账户联动

## 来源依据

- 当前仓库的 `domain/shop/payments.ts`、`domain/shop/settlements.ts`、`app/api/shop/checkout/route.ts`
- 当前 Prisma 模型 `prisma/schema.prisma`
- Stripe 官方文档:
  - [Create destination charges](https://docs.stripe.com/connect/destination-charges)
  - [Using Connect with Express connected accounts](https://docs.stripe.com/connect/express-accounts)
  - [Stripe-hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding)
  - [Connect webhooks](https://docs.stripe.com/connect/webhooks)
  - [Create a login link](https://docs.stripe.com/api/account/create_login_link)

## 当前现状

- 当前只配置了一组平台级 `STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET`
- `POST /api/shop/checkout` 会创建平台账号下的 Stripe Checkout Session
- 订单会记录 `sellerId`，但支付资金并不会路由到卖家自己的 Stripe connected account
- 退款、争议、结算、对账也都围绕平台单一 Stripe account 构建

这意味着当前真实行为是:

- 买家支付后，钱先进入平台 Stripe 账户
- 后续 payout 打到的是平台在 Stripe 后台绑定的银行账户
- 不是“哪个卖家出单，就最终打到哪个卖家的银行卡”

## 目标

- 每个卖家都能在后台绑定自己的 Stripe 收款账户
- 买家购买某个卖家的商品时，资金按该卖家的 connected account 路由
- 卖家银行卡信息由 Stripe 托管，平台不自行存原始银行卡号
- 保留现有后台订单、退款、争议、结算、对账能力，但让它们感知 connected account

## 核心决策

推荐方案:

- Stripe Connect
- Express connected accounts
- Stripe-hosted onboarding
- Stripe Checkout + destination charges
- 平台可选抽成，优先用 `application_fee_amount`

选择这条路的原因:

- 最贴合当前已经上线的 Stripe Checkout 托管支付链路
- 平台仍能保留订单、退款、争议、对账的统一后台
- 卖家不需要你自己处理 KYC 或银行卡明文录入
- 便于后续继续扩展 payout 状态、结算核销和平台佣金

不推荐直接做的方案:

- 自己存卖家银行卡并手动出款
- 继续只用平台统一 Stripe 账户但逻辑上“假装按卖家收款”
- 在当前阶段切到 direct charges 或完全自定义 checkout 流程

## 非目标

- 本阶段不同时接 PayPal / 本地支付
- 本阶段不重写现有公开结账 UI 为 Elements 自定义支付页
- 本阶段不迁移历史已支付订单的资金路径

## 资金流设计

### 推荐资金流

1. 卖家在后台完成 Stripe Express onboarding
2. 平台保存卖家的 `connectedAccountId`
3. 买家在公开页发起下单
4. 平台创建 Stripe Checkout Session
5. `payment_intent_data.transfer_data.destination` 指向卖家的 connected account
6. 如需抽成，平台同时设置 `application_fee_amount`
7. Stripe 成功收款后，将卖家份额结算到 connected account
8. Stripe 再按卖家在 Connect 中绑定的银行账户执行 payout

### 费用归属

按 Stripe destination charges 文档，默认结果是:

- 交易在平台账户上创建
- 卖家获得转入的资金
- 平台承担 Stripe fee / refund / dispute 的直接扣款压力

如果未来业务要改变手续费承担方式，再单独评估 separate charges and transfers 或其他 Connect 模式。

### `on_behalf_of`

对于 destination charges，如果平台与 connected account 跨区域，通常需要把 connected account 设为 `on_behalf_of`。实现上建议:

- 默认按 destination charge 接入
- 对不在同一区域或有 statement descriptor 需求的场景，按 Stripe 文档补 `on_behalf_of`
- 这部分不要硬编码在 UI，放在服务端支付创建逻辑里判断

## 数据模型改造

### 新增模型

建议新增统一卖家收款账户模型 `SellerPayoutAccount`，不要把 Stripe 字段直接散落在 `User` 上。

理由:

- 后续接 PayPal / 本地支付能复用同一抽象
- 可以保留历史停用账户
- 更容易做状态同步、审计和后台运维

### 建议新增枚举

- `PayoutProvider`
- `SellerPayoutAccountStatus`
- `PaymentRoutingMode`

### 建议新增字段

- `Order` 要记录资金路由快照，而不是只看 `userId`
- `OrderPaymentAttempt` / `OrderRefund` / `OrderDispute` / `PaymentSettlementEntry` 都要能回到 connected account
- 只存脱敏银行摘要，不存完整银行卡号

## Prisma Schema 草案

以下是增量草案，只列新增或修改的部分，不代表可直接覆盖现有 `schema.prisma`。

```prisma
enum PayoutProvider {
  STRIPE
}

enum SellerPayoutAccountStatus {
  NOT_STARTED
  PENDING
  RESTRICTED
  ACTIVE
  DISCONNECTED
}

enum PaymentRoutingMode {
  PLATFORM
  STRIPE_CONNECT_DESTINATION
}

model SellerPayoutAccount {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider          PayoutProvider
  providerAccountId String   @unique // Stripe: acct_xxx
  status            SellerPayoutAccountStatus @default(NOT_STARTED)

  accountType       String   @default("STRIPE_EXPRESS")
  country           String?
  defaultCurrency   String?  @default("JPY")
  businessType      String?
  displayNameSnapshot String?

  detailsSubmitted  Boolean  @default(false)
  chargesEnabled    Boolean  @default(false)
  payoutsEnabled    Boolean  @default(false)

  requirementsCurrentlyDue Json?
  requirementsEventuallyDue Json?
  requirementsPastDue      Json?
  disabledReason           String?

  bankNameMasked     String?
  bankLast4Masked    String?

  onboardingStartedAt   DateTime?
  onboardingCompletedAt DateTime?
  lastSyncedAt          DateTime?
  disconnectedAt        DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders    Order[]

  @@index([userId, provider, status])
  @@index([provider, providerAccountId])
}

model User {
  id           String @id @default(cuid())
  slug         String @unique
  email        String @unique
  passwordHash String
  displayName  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  payoutAccounts SellerPayoutAccount[]

  // existing relations omitted
}

model Order {
  id          String @id @default(cuid())
  userId      String
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  payoutAccountId   String?
  payoutAccount     SellerPayoutAccount? @relation(fields: [payoutAccountId], references: [id], onDelete: SetNull)
  paymentRoutingMode PaymentRoutingMode @default(PLATFORM)

  connectedAccountId     String?
  externalChargeId       String?
  externalTransferId     String?
  platformFeeAmount      Decimal? @db.Decimal(10, 2)
  sellerGrossAmount      Decimal? @db.Decimal(10, 2)
  sellerNetExpectedAmount Decimal? @db.Decimal(10, 2)

  // existing fields omitted

  @@index([payoutAccountId, createdAt])
  @@index([paymentRoutingMode, createdAt])
  @@index([connectedAccountId])
}

model OrderPaymentAttempt {
  id      String @id @default(cuid())
  orderId String
  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  connectedAccountId  String?
  externalChargeId    String?
  externalTransferId  String?
  applicationFeeAmount Decimal? @db.Decimal(10, 2)

  // existing fields omitted

  @@index([connectedAccountId])
  @@index([externalChargeId])
}

model OrderRefund {
  id      String @id @default(cuid())
  orderId String
  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  connectedAccountId           String?
  externalChargeId             String?
  externalTransferReversalId   String?
  applicationFeeRefundedAmount Decimal? @db.Decimal(10, 2)

  // existing fields omitted

  @@index([connectedAccountId])
  @@index([externalChargeId])
}

model OrderDispute {
  id String @id @default(cuid())

  connectedAccountId       String?
  externalTransferReversalId String?

  // existing fields omitted

  @@index([connectedAccountId])
}

model PaymentSettlementPayout {
  id String @id @default(cuid())

  stripeAccountId String?
  accountScope    String? // PLATFORM / CONNECTED

  // existing fields omitted

  @@index([stripeAccountId, payoutCreatedAt])
}

model PaymentSettlementEntry {
  id String @id @default(cuid())

  stripeAccountId String?
  accountScope    String? // PLATFORM / CONNECTED

  // existing fields omitted

  @@index([stripeAccountId, availableOn])
}
```

## 后台页面设计

### 卖家后台

新增页面:

- `/admin/settings/payouts`

页面最少要有这些模块:

- 当前收款状态卡
- “开始绑定 Stripe 收款账户”
- “继续完善资料”
- “打开 Express Dashboard”
- `chargesEnabled / payoutsEnabled` 状态
- 待补资料提示
- 脱敏的银行卡展示
- 最近同步时间

### 平台运维后台

如果你保留平台管理员视角，建议增加:

- `/admin/platform/payout-accounts`
- `/admin/platform/payout-accounts/[userId]`

用途:

- 看哪些卖家没完成 onboarding
- 看哪些账户被 restricted
- 看 `disabledReason`
- 强制触发账户状态同步

## API 路由列表

以下是建议的最小 API 清单。

### 新增: 卖家收款账户

- `GET /api/payments/connect/accounts/me`
  - 返回当前卖家的激活收款账户状态
- `POST /api/payments/connect/accounts`
  - 创建或获取当前卖家的 Stripe connected account
- `POST /api/payments/connect/accounts/onboarding-link`
  - 创建 Stripe-hosted onboarding link
- `POST /api/payments/connect/accounts/dashboard-link`
  - 创建 Express Dashboard login link
- `POST /api/payments/connect/accounts/sync`
  - 手动同步当前卖家收款账户状态

### 新增: 平台运维

- `GET /api/payments/connect/accounts`
  - 平台管理员分页查看所有卖家收款账户
- `GET /api/payments/connect/accounts/[id]`
  - 查看单个收款账户详情
- `POST /api/payments/connect/accounts/[id]/sync`
  - 平台管理员手动同步指定 connected account

### 调整: 公开下单

- `POST /api/shop/checkout`
  - 保持现有公开入口
  - 但服务端逻辑改为:
    - 校验卖家是否存在可用 `SellerPayoutAccount`
    - 决定 `paymentRoutingMode`
    - 创建 Connect destination charge 对应的 Checkout Session
    - 把 `connectedAccountId / platformFeeAmount / routingMode` 快照到订单

### 调整: Webhook

- `POST /api/payments/stripe/webhook`
  - 保留平台级支付 Webhook
  - 继续处理:
    - `checkout.session.completed`
    - `checkout.session.async_payment_failed`
    - `checkout.session.expired`
    - `charge.dispute.*`
- `POST /api/payments/stripe/connect/webhook`
  - 新增 Connect webhook
  - 处理 connected account 事件:
    - `account.updated`
    - `payout.paid`
    - `payout.failed`
    - `payout.updated`
    - 必要时补 `charge.dispute.*`

### 调整: 结算与定时同步

- `POST /api/internal/cron/stripe-finance-sync`
  - 从“只同步平台账户”升级为“平台账户 + connected accounts”
- 可选新增:
  - `POST /api/internal/cron/stripe-connect-account-sync`
  - 专门同步 connected account 状态与 requirement 变化

## Checkout 改造点

### 当前逻辑

当前 `createStripeCheckout()` 只会:

- 用平台 API key 创建 Checkout Session
- 记录订单和平台级 `paymentSessionId`
- 等 webhook 回写订单支付状态

### 新逻辑

在创建 Checkout Session 前，增加:

1. 读取商品所属卖家
2. 读取该卖家的 `SellerPayoutAccount`
3. 校验 `status = ACTIVE`
4. 校验 `chargesEnabled = true`
5. 校验 `payoutsEnabled = true`

创建 Session 时，关键参数改为:

- `payment_intent_data.transfer_data.destination = connectedAccountId`
- 如需平台抽成:
  - `payment_intent_data.application_fee_amount = ...`
- 跨区域或有结算商户要求时:
  - `payment_intent_data.on_behalf_of = connectedAccountId`

如果卖家未完成 onboarding，建议策略二选一:

- 严格模式: 禁止购买并提示卖家未开通收款
- 过渡模式: 仍走旧平台统一收款模式，但必须在订单上标记 `paymentRoutingMode = PLATFORM`

如果业务上已经决定切换独立收款，建议走严格模式，不要长期双轨。

## Webhook 设计

### 平台级 Webhook

继续保留现有平台 webhook，用于:

- Checkout Session 完成
- 支付失败 / 过期
- 平台承担的争议与退款同步

### Connect Webhook

新增单独 endpoint，用于 connected accounts 事件。

关键点:

- Connect webhook 事件会带顶层 `account`
- 这个字段就是 connected account id
- 处理时必须按 `account` 找到 `SellerPayoutAccount.providerAccountId`

建议事件处理:

- `account.updated`
  - 同步 `detailsSubmitted / chargesEnabled / payoutsEnabled`
  - 同步 `requirements.*`
  - 同步 `disabledReason`
  - 如条件满足，更新本地状态为 `ACTIVE`
- `payout.paid / payout.failed / payout.updated`
  - 写入或更新 `PaymentSettlementPayout`
  - 关联 connected account 维度
- `charge.dispute.*`
  - 根据事件实际落在哪个账户，补全 connected account 维度

注意:

- onboarding `return_url` 不能当作“卖家已完成绑定”的最终判断
- return 后要重新 fetch Stripe account，或等 `account.updated`

## 退款、争议、结算改造点

### 退款

当前退款只围绕平台级 `paymentIntentId`。

改造后要按订单快照决定:

- 是否属于 `STRIPE_CONNECT_DESTINATION`
- 是否需要 `reverse_transfer`
- 是否需要 `refund_application_fee`

否则会出现:

- 买家退款了，但 connected account 侧资金没回滚
- 或平台佣金没有按预期退回

### 争议

当前 `OrderDispute` 已能记录 dispute，但缺少 connected account 维度。

改造后要能回答:

- dispute 属于哪个卖家账户
- 是否已经影响 connected account 侧 payout / balance
- 是否需要平台补证据

### 结算 / 对账

当前结算页主要围绕平台账号的 `balance transactions` / `payouts`。

改造后至少要区分:

- 平台账户流水
- 某个 connected account 的流水
- 平台佣金流水
- 卖家 payout 流水

报表建议增加维度:

- `accountScope`
- `stripeAccountId`
- `sellerId`

## 环境变量增量

建议新增:

- `STRIPE_CONNECT_WEBHOOK_SECRET`
- `STRIPE_PLATFORM_FEE_BPS`
- `STRIPE_CONNECT_DEFAULT_COUNTRY`
- `STRIPE_CONNECT_COUNTRY_ALLOWLIST`

说明:

- `STRIPE_PLATFORM_FEE_BPS` 可选；如果佣金规则复杂，后续移到数据库配置
- 不建议把 connected account id 之类写在环境变量里，它们是卖家级数据

## 迁移顺序

### 阶段 0: 只加表，不改资金路径

- 新增 `SellerPayoutAccount`
- 给订单、退款、争议、结算表加 connected account / routing 字段
- 历史订单统一回填:
  - `paymentRoutingMode = PLATFORM`

### 阶段 1: 卖家 onboarding 闭环

- 后台新增 `/admin/settings/payouts`
- 接入:
  - 创建 connected account
  - account link
  - login link
  - account 状态同步

### 阶段 2: Connect webhook

- 新增 `POST /api/payments/stripe/connect/webhook`
- 先只处理 `account.updated` 和 payout 事件
- 跑通卖家状态从 `PENDING -> ACTIVE`

### 阶段 3: 新订单灰度切 Connect

- `POST /api/shop/checkout` 改造成双模式
- 只有 `ACTIVE` 卖家走 destination charges
- 其余卖家:
  - 禁止购买，或
  - 暂时继续旧平台模式

### 阶段 4: 退款 / dispute 适配

- 让退款逻辑识别 connected account 路径
- dispute 记录补上 connected account 维度

### 阶段 5: 结算 / 对账升级

- 让 `stripe-finance-sync` 同步 connected account payout
- 结算页和对账页增加 connected account 维度筛选

### 阶段 6: 收口旧平台模式

- 历史单保留 `PLATFORM`
- 新单默认要求卖家已完成 Connect onboarding
- 平台统一收款只保留为历史兼容，不再作为常规路径

## 测试清单

### API / domain

- 创建 connected account
- account link / login link
- checkout 在无有效收款账户时拒绝
- checkout 在 destination charge 模式下写入正确快照
- account.updated 正确更新卖家状态
- payout webhook 正确落库
- refund 在 Connect 模式下能正确回滚 transfer / fee

### 浏览器 E2E

- 卖家完成 onboarding 回流
- 卖家打开 Express Dashboard
- 已开通卖家商品可购买
- 未开通卖家商品不可购买
- Connect 模式下订单成功回流
- 退款后后台订单 / 对账页同步更新

## 风险与边界

- 历史已支付订单不要迁移资金路径
- 不要把银行卡号、户名、完整支行信息存到本地数据库
- Connect capability / country / business type 要受 Stripe 实际支持范围约束
- payout 到银行卡不是“你系统直接打银行卡”，而是 Stripe 对 connected account 执行 payout

## 建议实施顺序

如果只拆成三个开发批次，建议这样做:

1. 数据模型 + `/admin/settings/payouts` + onboarding
2. checkout 切 destination charges + webhook
3. refund / dispute / settlement / reconciliation 升级

## 对当前仓库的直接影响点

- `domain/shop/payments.ts`
- `domain/shop/settlements.ts`
- `domain/shop/disputes.ts`
- `app/api/shop/checkout/route.ts`
- `app/api/payments/stripe/webhook/route.ts`
- `app/api/internal/cron/stripe-finance-sync/route.ts`
- `prisma/schema.prisma`
- 新增 `app/api/payments/connect/**`
- 新增 `app/admin/settings/payouts/**`

## 一句话结论

当前项目要实现“每个卖家各自收款、最终打到自己银行卡”，正确路线不是继续堆平台统一收款逻辑，而是引入 **Stripe Connect + Express + destination charges**，并把订单、退款、争议、结算全链路升级成“感知 connected account”的模型。
