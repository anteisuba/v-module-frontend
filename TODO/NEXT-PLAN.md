# 下一阶段执行计划

> 创建日期：2026-03-22
> 状态：⏸️ 已替代 — 视觉自由度计划优先（见 VISUAL-FREEDOM-PLAN.md）
>
> 本计划中的项目（Turnstile、SEO、ScheduleBlock、购物车、API 统一）仍有价值，
> 在视觉自由度计划完成后作为后续待办参考。

基于 P1 全部完成的现状，从 P2/P3/OPTIMIZATION 中筛选高价值项，按 6 周节奏排期。

---

## Phase 1（Week 1-2）：安全加固 + SEO 基础

### 1.1 Turnstile 验证码接入
- 评论提交接入 Cloudflare Turnstile
- 公开结账接入验证码
- 登录/注册接入验证码
- 密码重置接入验证码

**价值**：公开页所有写入入口（评论、结账、登录、注册）都暴露在公网，无验证码是实际安全风险。
**工作量**：小。Turnstile 是 drop-in 方案，每个表单加一个组件 + 后端验证。
**来源**：P2-3.1

### 1.2 SEO 基础设施
- 各页面 meta tags / Open Graph 优化
- 结构化数据 (JSON-LD) 产品页和博客页
- sitemap.xml 自动生成
- robots.txt 精细化配置

**价值**：公开页是创作者的门面，没有 SEO 基础等于没有自然流量入口。
**工作量**：小到中。Next.js 内置 metadata API，大部分是配置工作。
**来源**：P2-5

---

## Phase 2（Week 3-4）：核心内容模块 + 代码质量

### 2.1 ScheduleBlock 直播日程模块
- 设计 ScheduleBlock 数据模型和 section 配置类型
- Zod 校验 schema
- 后台 CMS 编辑器（日期选择、平台选择、链接）
- 公开页渲染器（列表视图，区分 upcoming/past）
- 注册进 `page-renderer/registry.tsx`

**价值**：对 VTuber 场景最核心的内容类型。直播日程是粉丝访问公开页的首要动机之一。
**工作量**：中。需要走完 section 全链路（类型 → 校验 → 编辑器 → 渲染器 → 注册）。
**来源**：P2-2.1

### 2.2 API 错误码与序列化统一
- 统一所有 API 返回值格式（`{ error }` vs `{ message }` → 统一标准）
- 统一 `Decimal` → `string`，`Date` → ISO string，`Json` → typed 的序列化处理
- 补充缺失的 Zod schema（输入校验覆盖所有公开 API）

**价值**：减少前端错误处理的分歧和潜在 bug，降低后续开发的认知负担。
**工作量**：中。需要逐个审查 API route handler。
**来源**：OPTIMIZATION-1.2, 1.3

---

## Phase 3（Week 5-6）：商店核心功能

### 3.1 购物车与多商品结账
- 设计购物车数据结构（推荐 session 存储，登录用户持久化到数据库）
- 添加/删除/修改数量的 API
- 购物车 UI 组件（侧边栏抽屉）
- Stripe Checkout 支持多 line items
- 购物车持久化策略（游客 localStorage → 登录后合并到数据库）

**价值**：商店最大的功能缺口。没有购物车，每次只能买一件商品，严重限制客单价。
**工作量**：大。涉及数据结构设计、API、UI、Stripe 集成和持久化策略。
**来源**：P2-1.1

---

## 不在本轮范围

| 模块 | 理由 |
|---|---|
| PayPal / 本地支付 | Connect 运维刚稳定，先跑一段时间再扩支付通道 |
| 博客富文本升级 (Tiptap/MDX) | 技术风险高、迁移成本大，等用户量起来再做 |
| 深色模式 / 国际化 / a11y 全套 | P3 级别，在核心功能和安全加固完成前不值得投入 |
| 库存管理 | 依赖购物车完成后的商店数据流，放到下一轮 |

---

## 验收标准

每个 Phase 完成后：
1. `pnpm check` 通过
2. `pnpm test` 不减少现有通过数
3. `pnpm build` 成功
4. 相关文档同步更新（`current-status.md`、`backlog.md`、TODO 文件）

---

## 风险与依赖

| 风险 | 缓解措施 |
|---|---|
| Turnstile 可能影响公开页加载性能 | 使用 lazy/invisible 模式，仅在提交时触发 |
| ScheduleBlock 需要新的 section 类型全链路 | 参考已有 section 实现（如 VideoBlock），遵循 page-config CLAUDE.md 规范 |
| 购物车持久化策略涉及认证边界 | 游客用 localStorage，登录用户用数据库，登录时合并；参考 session CLAUDE.md |
| API 统一改动面广 | 分批改，每批跑完整测试，不搞大爆炸重构 |
