# 视觉自由度计划

> 创建日期：2026-03-22
> 状态：🔄 审查通过，待实施
> 来源：/office-hours design doc + /plan-eng-review

解决"所有站点看起来一样"的核心产品问题。

---

## 已确认的架构决策（Eng Review）

| 决策 | 选择 | 理由 |
|---|---|---|
| Theme 存储位置 | PageConfig JSON 中的 `theme` 对象 | 跟 sections 一起走 draft/publish 流程，不需要 DB migration |
| CSS 变量策略 | 复用已有 `--editorial-*` / `--color-*` 变量 | 最小 diff，避免两套变量共存 |
| 全局 overlay | 参数化，纳入 theme 预设 | overlay 是"看起来一样"的主要原因之一 |
| DRY：hex-to-rgba | 提取共享工具函数 | Hero/News/Video 三处重复 |
| 双重注入 | 服务端注入 CSS 变量 + 客户端只传 Context | 消除冗余 DOM 操作 |
| 旧数据兼容 | normalizePageConfig 补 theme 默认值，JSON 优先于旧列 | 无声失败是最大风险 |

---

## Phase 0（Day 1）：架构 Spike

- [ ] 盘点所有 renderer 哪些字段已消费、哪些声明了但未渲染
- [ ] 确认 CSS 变量注入位置（复用 `layout.tsx` inline style）
- [ ] 确认 theme 作用范围：首页 sections + 所有子页面
- [ ] 决策：预设与 section 级 `backgroundColor` 的优先级规则
- [ ] 决策：PageRenderer 硬编码全局渐变 overlay 的参数化方案
- [ ] 确认 Zod schema 需要扩展的字段
- [ ] 产出：`ThemeConfig` 最小字段清单

**工作量：** ~30min CC

---

## Phase 1（Week 1）：Theme Presets 基础

- [ ] 设计 `ThemeConfig` 类型（扩展到 PageConfig JSON 的 `theme` 字段）
- [ ] 更新 Zod schema
- [ ] 扩展 `layout.tsx` 注入更多 CSS 变量（覆写 `--color-*` / `--editorial-*`）
- [ ] 精简 ThemeProvider — 只传 Context，不重复操作 DOM
- [ ] 提取 `hexToRgba()` 共享工具，替代 3 处重复
- [ ] 创建 3 个内置预设：Editorial（暗色）、Vivid（明亮靛蓝紫）、Mono（极简黑白）
- [ ] 改造 renderer 读取 CSS 变量而非硬编码 `#000000`
- [ ] 参数化 PageRenderer 全局 overlay
- [ ] CMS 增加预设选择器
- [ ] 扩展 normalizePageConfig 处理无 theme 的旧数据
- [ ] 写测试：预设填充、旧数据兼容、CSS 注入、列/JSON 合并
- [ ] 建 Demo 1

**工作量：** ~1-1.5 天 CC

---

## Phase 2（Week 2-3）：Section 变体

- [ ] `SectionConfig` 新增 `variant?: string` 字段
- [ ] 更新 Zod schema
- [ ] 为 News 做 2 种变体（卡片网格 vs 时间线）
- [ ] 为 Gallery 做 2 种变体 + 补背景色支持
- [ ] 为 Video 做 2 种变体
- [ ] CMS 编辑器增加变体选择器
- [ ] 补完 `backgroundOpacity` 到所有 renderer
- [ ] 写测试：无效 variant 回退、变体渲染正确性
- [ ] 建 Demo 2

**工作量：** ~1 天 CC

---

## Phase 3（Week 4）：打磨 + Demo 3

- [ ] 品牌定制面板（统一暴露已有字段）
- [ ] 即时预览优化
- [ ] 建 Demo 3
- [ ] 写 E2E 测试：预设切换后公开页视觉变化
- [ ] 整体 UX 打磨

**工作量：** ~0.5 天 CC

---

## 验收标准

每个 Phase 完成后：
1. `pnpm check` 通过
2. `pnpm test` 不减少现有通过数（+ 新增测试全通过）
3. `pnpm build` 成功
4. 相关文档同步更新

最终验收：
- 3 个视觉上明显不同的 demo 站点
- 非技术人员看到后不会认为出自同一模板

---

## 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| 旧数据无 theme 对象 | normalizePageConfig 补默认值 + 测试覆盖 |
| themeColor 列与 theme JSON 冲突 | JSON 存在时优先，否则读旧列 |
| overlay 参数化影响现有站点 | 默认值保持当前暗色 overlay |
| Gallery 背景色补全 | 参考其他 renderer 实现 |
| Phase 1 工作量偏大 | 可拆为 1a（theme 系统）+ 1b（预设+CMS） |

---

## 不在本轮范围

见 NEXT-PLAN.md（已标记为替代）中的所有项。

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 3 proposals, 3 accepted, 0 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | partial | 6 issues found (timeout before summary) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 4/10 → 7.5/10, 7 decisions |

- **CODEX:** Found existing ThemeProvider/editorial CSS vars ignored by plan, themeColor stored as DB column not JSON, path errors in Key Files
- **CROSS-MODEL:** Codex and Claude independently found same issues: dual injection, editorial vars underuse, ThemeProvider already exists
- **CEO EXPANSIONS:** Showcase landing page + CMS preset preview + dynamic OG images
- **UNRESOLVED:** 0
- **VERDICT:** CEO + ENG + DESIGN CLEARED — ready to implement
