# P1：工程稳定性与运维闭环

> 最后更新：2026-03-14
> 当前阶段最高优先级

---

## 1. 测试与 CI/CD

### 1.1 Playwright 持续集成
- [x] 将现有 11 个 e2e 场景接入 CI（GitHub Actions）
- [x] 补多浏览器矩阵（Firefox、WebKit）
- [x] 配置失败截图/视频产物上传
- [x] 配置重试策略（flaky test 处理）
- [x] 将 CI 状态 badge 添加到 README

### 1.2 测试覆盖扩面
- [x] 补充 Stripe Webhook 相关的集成测试
- [x] 补充认证和权限边界的测试
- [x] 补充公开页配置渲染链路的测试
- [x] 统一 mock 与 test fixture 管理

### 1.3 构建管线
- [x] 添加 PR 自动检查：build + check + test + lint
- [ ] 配置 Vercel Preview Deployments
- [ ] 考虑引入 `changesets` 管理版本

---

## 2. Stripe Connect 运维闭环

### 2.1 运营视图增强
- [x] 对账页增加按 routing mode / connected account 筛选
- [x] 结算核销页增加按 payout 状态分组
- [x] 对账异常增加邮件/Slack 告警
- [x] 订单导出 CSV 增加 Connect 字段

### 2.2 卖家体验
- [x] 卖家后台 payout settings 页增加文案说明
- [x] 卖家 onboarding 流程增加进度提示
- [ ] Connect 账户状态异常时的提示与引导

### 2.3 安全与监控
- [ ] Connect Webhook 签名验证覆盖所有事件类型
- [ ] 添加 Connect 账户状态定期同步的健康检查日志
- [ ] dispute 处理流程增加证据提交引导

---

## 3. 脚本兼容层维护

- [ ] 升级 Next.js 时复核 `scripts/run-node-tool.mjs` 是否还需要
- [ ] 升级 Prisma 时复核 `scripts/run-prisma-generate.mjs` 兼容层
- [ ] 升级 Playwright 时检查 preload 兼容层是否可移除
- [ ] 记录每个兼容脚本存在的原因及移除条件
