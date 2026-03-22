# 下一阶段执行计划（视觉自由度之后）

> 创建日期：2026-03-23
> 状态：📋 待实施
> 前置：视觉自由度计划已完成（代码层面）

---

## Phase A（~30min CC）：Turnstile 验证码

安全加固，阻止机器人滥用公开写入入口。

- [ ] 安装 Cloudflare Turnstile SDK
- [ ] 创建共享 `<TurnstileWidget>` 组件（invisible 模式）
- [ ] 创建服务端验证工具函数 `verifyTurnstileToken()`
- [ ] 接入评论提交 API
- [ ] 接入公开结账 API
- [ ] 接入登录 API
- [ ] 接入注册 API
- [ ] 接入密码重置 API
- [ ] 环境变量：`TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- [ ] 写测试：验证 token 校验逻辑

**价值**：所有公开写入入口都暴露在公网，无验证码是实际安全风险。
**风险**：使用 invisible 模式不影响用户体验。开发环境用 Turnstile test key 跳过。

---

## Phase B（~1h CC）：SEO + 动态 OG 图片

让站点可被搜索引擎发现，分享卡片反映主题风格。

### B1: SEO 基础
- [ ] 各页面 meta tags（Next.js Metadata API）
- [ ] Open Graph tags（title、description、image）
- [ ] `sitemap.xml` 自动生成（Next.js `sitemap.ts`）
- [ ] `robots.txt` 精细化配置

### B2: 动态 OG 图片
- [ ] `app/u/[slug]/opengraph-image.tsx` — 使用 `next/og`（Satori）
- [ ] 读取用户主题色 + 背景色 + 站点标题
- [ ] 预加载预设字体的 .woff 文件
- [ ] ISR 缓存策略（publish 时 revalidate）

**价值**：公开页是创作者门面，没有 SEO = 没有自然流量。OG 图片让分享看起来专业。
**风险**：Satori 字体加载在 Edge 有限制，只支持预加载的 .woff。

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
