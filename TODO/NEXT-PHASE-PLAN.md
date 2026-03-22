# 下一阶段执行计划（视觉自由度之后）

> 创建日期：2026-03-23
> 状态：🔄 进行中（Phase A+B 已完成，Phase C 待实施）
> 前置：视觉自由度计划已完成（代码层面）

---

## Phase A（~30min CC）：Turnstile 验证码 ✅

> 已完成：2026-03-23（commit `d6f24f8`）

- [x] 安装 Cloudflare Turnstile SDK
- [x] 创建共享 `<TurnstileWidget>` 组件（invisible 模式）
- [x] 创建服务端验证工具函数 `verifyTurnstileToken()`
- [x] 接入评论提交 API
- [x] 接入公开结账 API
- [x] 接入登录 API
- [x] 接入注册 API
- [x] 接入密码重置 API
- [x] 环境变量：`TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- [x] 写测试：验证 token 校验逻辑

---

## Phase B（~1h CC）：SEO + 动态 OG 图片 ✅

> 已完成：2026-03-23（commit `57baa33`）

### B1: SEO 基础
- [x] 各页面 meta tags（Next.js Metadata API）
- [x] Open Graph tags（title、description、image）
- [x] `sitemap.xml` 自动生成（Next.js `sitemap.ts`）
- [x] `robots.txt` 精细化配置

### B2: 动态 OG 图片
- [x] `app/u/[slug]/opengraph-image.tsx` — 使用 `next/og`（Satori）
- [x] 读取用户主题色 + 背景色 + 站点标题
- [ ] 预加载预设字体的 .woff 文件（使用系统 sans-serif，后续可升级）
- [ ] ISR 缓存策略（publish 时 revalidate）（后续优化）

---

## Phase C（~30min CC）：ScheduleBlock 直播日程

新增 section 类型，对 VTuber 场景最核心。

- [ ] 设计 `ScheduleSectionProps` 类型（日期、标题、平台、链接、状态 upcoming/past）
- [ ] Zod schema
- [ ] 后台 CMS 编辑器（日期选择、平台选择、链接输入）
- [ ] 公开页渲染器（列表视图，upcoming 在上、past 在下）
- [ ] 注册进 `page-renderer/registry.tsx`
- [ ] 支持 variant 字段（为 Phase 2 变体系统做好准备）
- [ ] 写测试

**价值**：直播日程是粉丝访问公开页的首要动机之一。变体系统已就位，新 section 直接获得变体支持。

---

## Phase D（~2-3h CC）：购物车 + 多商品结账

商店最大功能缺口。

- [ ] 设计购物车数据结构（游客 localStorage，登录用户可选 DB）
- [ ] 购物车 API：添加/删除/修改数量
- [ ] 购物车 UI 组件（侧边栏抽屉）
- [ ] Stripe Checkout 支持多 line items
- [ ] 购物车持久化策略（游客 → 登录合并）
- [ ] 写测试

**价值**：没有购物车，每次只能买一件商品，严重限制客单价。
**风险**：工作量最大，涉及数据结构 + API + UI + Stripe 集成 + 持久化策略。

---

## 验收标准

每个 Phase 完成后：
1. `pnpm check` 通过
2. `pnpm test` 不减少现有通过数
3. `pnpm build` 成功
4. TODO 文件同步更新

---

## 总工作量估算

| Phase | CC 时间 | 产出 |
|---|---|---|
| A Turnstile | ~30min | 5 个公开入口接入验证码 |
| B SEO + OG | ~1h | meta/sitemap/robots + 动态 OG 图片 |
| C ScheduleBlock | ~30min | 新 section 类型 + CMS 编辑器 |
| D 购物车 | ~2-3h | 购物车 API + UI + Stripe 多商品 |
| **总计** | **~4-5h CC** | |
