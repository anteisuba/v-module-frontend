# TODO 总览

> 最后更新：2026-03-23

本目录汇总所有待办事项和优化方向，按优先级和领域分文件组织。

## 当前重点

| 文件 | 内容 | 状态 |
| --- | --- | --- |
| [NEXT-PHASE-PLAN.md](./NEXT-PHASE-PLAN.md) | 下一阶段：Turnstile → SEO → ScheduleBlock → 购物车 | 📋 待实施 |
| [VISUAL-FREEDOM-PLAN.md](./VISUAL-FREEDOM-PLAN.md) | 视觉自由度计划（Theme Presets + Section Variants） | ✅ 代码完成 |

## 文件索引

| 文件 | 内容 | 状态 |
| --- | --- | --- |
| [P0-critical.md](./P0-critical.md) | 阻断级问题 | ✅ 当前无阻断项 |
| [P1-engineering.md](./P1-engineering.md) | 工程稳定性与 CI/CD | ✅ 全部完成 |
| [P2-features.md](./P2-features.md) | 新功能开发 | 📋 待排期 |
| [P3-polish.md](./P3-polish.md) | 打磨与优化 | 📋 待排期 |
| [OPTIMIZATION.md](./OPTIMIZATION.md) | 代码质量与架构优化 | 🔧 持续改进 |
| [NEXT-PLAN.md](./NEXT-PLAN.md) | 原下一阶段计划 | ⏸️ 已替代 |

## 当前项目健康度

```
pnpm build      ✅ 通过
pnpm check      ✅ 通过
pnpm test       ✅ 36 文件 / 150 测试通过
pnpm test:e2e   ✅ 11 个 e2e 场景已接入 Chromium / Firefox / WebKit CI 矩阵
pnpm lint       ✅ 0 errors / 0 warnings
Prisma 迁移     ✅ 13 个
```

## 优先级解读

- **P0**：阻断上线或严重影响用户体验，必须立即处理
- **P1**：工程稳定性和运维闭环，当前阶段最重要
- **P2**：新功能，在 P1 稳定后排期
- **P3**：锦上添花的打磨和增强
