# 交接摘要 — 2026-03-15

> 写给下一位接手的 AI Agent。假设你看不到此前完整会话，只能看到这份文档。

## 1. 当前任务目标

当前主线仍是补齐 P1 的 Stripe Connect 运维闭环，但这批未提交改动已经把两个子项基本做到位：

- 在 [`app/admin/settings/payouts/page.tsx`](./app/admin/settings/payouts/page.tsx) 为卖家 payout settings 页补“异常状态与处理建议”，覆盖 `DISCONNECTED`、`RESTRICTED`、`currently_due`、`charges review`、`payouts pending`
- 在 [`app/api/payments/stripe/connect/webhook/route.ts`](./app/api/payments/stripe/connect/webhook/route.ts) 补齐 Connect webhook 对 `payout.*` 的处理，并把 connected account payout 快照写回 settlement 模型
- 同步更新 TODO / canonical docs / 测试
- 把“交接文档格式”沉淀成 repo-local skill，并让后续 Agent 继续旧任务时优先读取最新 `*-handoff.md`

当前阶段的完成标准：

- `pnpm check`、`pnpm test` 通过
- payout 异常引导 UI、Connect webhook payout 同步、相关文档和测试保持一致
- 剩余 P1 项明确收敛为：`changesets`、Connect 健康检查日志、dispute 证据提交流程

## 2. 当前进展

已确认并已落在当前 worktree 的改动：

- [`app/admin/settings/payouts/page.tsx`](./app/admin/settings/payouts/page.tsx)
  - 新增 `buildPayoutStatusAlerts()`
  - 新增 `PayoutStatusAlert`、告警 tone/action 映射
  - 页面上新增 `data-testid="payout-alerts"` 区块和 5 类异常卡片
  - 告警操作复用现有动作：`onboarding` / `sync` / `dashboard`
- [`i18n/messages/en.json`](./i18n/messages/en.json)、[`i18n/messages/ja.json`](./i18n/messages/ja.json)、[`i18n/messages/zh.json`](./i18n/messages/zh.json)
  - 新增 payout alerts 文案、多语言 tone、`disconnectedAt` 字段
- [`app/api/payments/stripe/connect/webhook/route.ts`](./app/api/payments/stripe/connect/webhook/route.ts)
  - 新增 `isPayoutObject()`
  - `payout.created|updated|paid|failed|canceled` 会调用 `syncStripeSettlementPayoutByConnectedAccountId()`
- [`domain/shop/settlements.ts`](./domain/shop/settlements.ts)、[`domain/shop/index.ts`](./domain/shop/index.ts)
  - `upsertSettlementPayout()` 现在可接受 `stripeAccountId` / `accountScope`
  - 新导出 `syncStripeSettlementPayoutByConnectedAccountId()`
  - connected account payout 快照写入 `accountScope: "CONNECTED"`
- 测试
  - [`tests/app/api/payments/stripe-connect-webhook.route.test.ts`](./tests/app/api/payments/stripe-connect-webhook.route.test.ts) 扩到 `account.external_account.*`、`payout.*`、签名失败分支
  - 新增 [`tests/domain/shop/connect-settlement-payouts.test.ts`](./tests/domain/shop/connect-settlement-payouts.test.ts)
  - [`tests/e2e/payouts-workflows.spec.ts`](./tests/e2e/payouts-workflows.spec.ts) 新增 restricted account 场景
  - [`tests/helpers/stripe.ts`](./tests/helpers/stripe.ts) 新增 `createStripeConnectPayoutEvent()`
- 文档 / 待办同步
  - [`TODO/P1-engineering.md`](./TODO/P1-engineering.md) 已把 Vercel Preview、异常状态引导、Connect webhook 覆盖标成完成
  - [`docs/zh-CN/overview/current-status.md`](./docs/zh-CN/overview/current-status.md)、[`docs/zh-CN/overview/backlog.md`](./docs/zh-CN/overview/backlog.md)、[`docs/zh-CN/agent/repo-brief.md`](./docs/zh-CN/agent/repo-brief.md)、[`docs/zh-CN/agent/next-steps.md`](./docs/zh-CN/agent/next-steps.md)、[`docs/zh-CN/development/routes-and-api.md`](./docs/zh-CN/development/routes-and-api.md) 已同步
  - 日文文档 [`docs/ja/overview/current-status.md`](./docs/ja/overview/current-status.md)、[`docs/ja/overview/backlog.md`](./docs/ja/overview/backlog.md)、[`docs/ja/development/routes-and-api.md`](./docs/ja/development/routes-and-api.md) 也已同步
- 交接机制
  - 新增 repo-local skill：[`./.agents/skills/repo-handoff/SKILL.md`](./.agents/skills/repo-handoff/SKILL.md)
  - 根 [`AGENTS.md`](./AGENTS.md) 会提示继续旧任务前先读根目录最新 `*-handoff.md`

本次会话已实际执行的验证：

- `pnpm check`：通过
- `pnpm test`：通过，`31` 个文件 `111` 个测试
- `pnpm test:e2e`：本次未复跑
- `pnpm build` / `pnpm lint`：本次未复跑

## 3. 关键上下文

- 仓库当前是 dirty worktree，不只我改的文件在变；不要回滚无关改动
- 当前修改主线是 Stripe Connect 运维闭环，不是支付通道扩展；不要把 PayPal / 本地支付抢回 P1
- 用户明确希望把“继任者 Prompt 2.0”产品化：不仅生成 handoff，还要能作为 skill 复用，并让 Agent 每次继续旧任务时优先读 handoff
- 这个“每次读取”不能只靠 skill 触发；更可靠的入口是根 [`AGENTS.md`](./AGENTS.md) 的短规则
- Connect webhook 和普通 Stripe webhook 是两条链路：
  - [`app/api/payments/stripe/webhook/route.ts`](./app/api/payments/stripe/webhook/route.ts) 处理 checkout / dispute
  - [`app/api/payments/stripe/connect/webhook/route.ts`](./app/api/payments/stripe/connect/webhook/route.ts) 处理 connected account 状态和 payout
- 改文档时遵守 repo 规则：canonical 以 `docs/zh-CN/overview/*` 为准，`docs/zh-CN/agent/*` 是 AI quick context
- 商店 / 订单仍然要保持“卖家后台管理”与“访客公开下单”语义分离，别把公开结账逻辑写回 `/api/shop/orders`

## 4. 关键发现

- 当前 P1 剩余项已经比旧 handoff 更收敛：异常状态引导和 Connect webhook payout 覆盖都已进入实现态，不应再把它们当作未开始
- `pnpm test -- tests/...` 最终跑了整套 Vitest，而不是只跑目标文件；结果是全量 `31/111` 通过，可作为当前代码基线
- payout alert UI 目前只有 restricted 场景补了 e2e；其他告警类型主要靠组件逻辑和 API / domain 测试兜底
- settlement payout upsert 现在会在 `update` 时也写入 `stripeAccountId` 和 `accountScope`，这意味着同一个 `externalPayoutId` 已存在时也会被 connected account 元数据覆盖为最新快照
- 根目录原有 `260315-handoff.md` 是旧阶段摘要，已经过时；不要再参考旧版本结论
- repo 里的实际技能目录是 `./.agents/skills/`，不是旧文案里提到的 `.Codex/skills/`

## 5. 未完成事项

按优先级排序：

1. 复核 payout 异常引导是否覆盖真实 Stripe 状态映射
   - 至少应人工看一遍 [`app/admin/settings/payouts/page.tsx`](./app/admin/settings/payouts/page.tsx) 的 `buildPayoutStatusAlerts()` 分支
   - 最好补更多 UI / e2e 覆盖：`DISCONNECTED`、`currentlyDue`、`chargesReview`、`payoutsPending`
2. 复跑 E2E 或至少目标规格
   - 当前改了后台 payout 页，且 [`tests/e2e/payouts-workflows.spec.ts`](./tests/e2e/payouts-workflows.spec.ts) 有新场景
   - 本次只跑了 `pnpm check` 和 `pnpm test`
3. 决定是否继续把这批改动收尾为一个提交
   - 当前 worktree 还包含用户已有改动：`TODO/P1-engineering.md`、docs、Stripe Connect 相关代码、i18n、tests
4. P1 剩余正式待办
   - `changesets`
   - Connect 账户状态定期同步的健康检查日志
   - dispute 证据提交引导

## 6. 建议接手路径

优先查看这些文件：

1. [`AGENTS.md`](./AGENTS.md)
2. [`260315-handoff.md`](./260315-handoff.md)
3. [`TODO/P1-engineering.md`](./TODO/P1-engineering.md)
4. [`app/admin/settings/payouts/page.tsx`](./app/admin/settings/payouts/page.tsx)
5. [`app/api/payments/stripe/connect/webhook/route.ts`](./app/api/payments/stripe/connect/webhook/route.ts)
6. [`domain/shop/settlements.ts`](./domain/shop/settlements.ts)
7. [`tests/app/api/payments/stripe-connect-webhook.route.test.ts`](./tests/app/api/payments/stripe-connect-webhook.route.test.ts)
8. [`tests/domain/shop/connect-settlement-payouts.test.ts`](./tests/domain/shop/connect-settlement-payouts.test.ts)
9. [`tests/e2e/payouts-workflows.spec.ts`](./tests/e2e/payouts-workflows.spec.ts)

建议先验证：

```bash
cd /Users/fulina/Desktop/workspace/vtuber-blog/v-module-frontend
git status --short
git diff --stat
pnpm check
pnpm test
pnpm test:e2e tests/e2e/payouts-workflows.spec.ts
```

推荐下一步动作：

1. 先看 `git status --short`，确认是否还有用户正在并行修改同一批文件
2. 跑 payout workflow 的 e2e，确认 restricted alert 没有视觉或交互回归
3. 如果这批代码稳定，就继续做 P1 剩余的“健康检查日志”或“dispute 引导”
4. 如果用户下一步主要想优化交接机制，再考虑是否把 latest handoff 读取逻辑补到更多 repo 入口文档里，但不要把根文档写成长说明

## 7. 风险与注意事项

- 不要把 skill 当成“强制每回合自动执行”的机制；真正能提高稳定性的，是 skill + 根 `AGENTS.md` 的短入口一起用
- 不要只看 handoff 就开始改代码；先用 `git status` / `git diff --stat` 核对 handoff 是否仍然新鲜
- payout alert 的分支里有业务判断耦合：
  - `detailsSubmitted || onboardingCompletedAt` 被当作 `detailsReady`
  - `chargesEnabled && !payoutsEnabled` 会走 payouts pending
  - `pastDue` / `disabledReason` 会优先短路成 restricted
- Connect webhook 的 `payout.*` 现在按 `event.account` 写 settlement payout；如果真实 webhook payload 缺 `event.account`，当前分支不会落库
- `docs/zh-CN/overview/current-status.md`、`docs/zh-CN/overview/backlog.md` 已同步，后续不要再额外复制一份新的 TODO 文档
- 当前已有一批用户改动未提交，不要用 destructive git 命令清空现场

## 下一位 Agent 的第一步建议

先读 [`AGENTS.md`](./AGENTS.md) 和这份 [`260315-handoff.md`](./260315-handoff.md)，然后立刻跑 `git status --short` 与 `pnpm test:e2e tests/e2e/payouts-workflows.spec.ts`。如果 e2e 通过，就把注意力切到 P1 还没做完的“Connect 健康检查日志”或“dispute 证据提交引导”；如果 e2e 不通过，优先回看 [`app/admin/settings/payouts/page.tsx`](./app/admin/settings/payouts/page.tsx) 的 alert 渲染和 action 分支。
