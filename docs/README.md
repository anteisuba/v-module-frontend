# v-module-frontend Docs

`docs/` 是人类维护者的正式长文档层。AI / 代理的根入口以 [`../AGENTS.md`](../AGENTS.md) 为主，兼容说明保留在 [`../CLAUDE.md`](../CLAUDE.md)；AI 扩展上下文集中在 [`./zh-CN/agent/`](./zh-CN/agent/)。

## 中文

### 文档分层

- AI 根入口：[`../AGENTS.md`](../AGENTS.md)
- AI 兼容入口：[`../CLAUDE.md`](../CLAUDE.md)
- AI 扩展上下文：[`./zh-CN/agent/repo-brief.md`](./zh-CN/agent/repo-brief.md)、[`./zh-CN/agent/repo-map.md`](./zh-CN/agent/repo-map.md)、[`./zh-CN/agent/workflows.md`](./zh-CN/agent/workflows.md)、[`./zh-CN/agent/next-steps.md`](./zh-CN/agent/next-steps.md)
- 人类中文长文档：[`./zh-CN/`](./zh-CN/)
- 人类日文长文档：[`./ja/`](./ja/)

### 5-10 分钟快速阅读顺序

1. [项目概览](./zh-CN/overview/project-overview.md)
2. [当前状态](./zh-CN/overview/current-status.md)
3. [后续待办](./zh-CN/overview/backlog.md)
4. [路由与 API](./zh-CN/development/routes-and-api.md)
5. [数据库与基础设施](./zh-CN/development/database-and-infra.md)
6. [AI 快速摘要](./zh-CN/agent/repo-brief.md)

### 审计快照

- `pnpm build`：通过，当前为标准构建输出
- `pnpm check`：通过
- `pnpm test`：通过，当前为 `27` 个文件 `81` 个测试
- `pnpm lint`：通过，当前为 `0 errors / 0 warnings`
- `pnpm test:e2e`：通过，当前为 `11` 个 Chromium 场景
- 自动化测试文件：已存在 `Vitest + Playwright`，位于 `tests/`，并已进入实际执行
- 当前 Prisma migration 目录：`13`

### 中文长文档索引

- 概览：[项目概览](./zh-CN/overview/project-overview.md)、[当前状态](./zh-CN/overview/current-status.md)、[后续待办](./zh-CN/overview/backlog.md)、[优化报告](./zh-CN/overview/optimization-report.md)
- 架构：[系统架构](./zh-CN/architecture/system-architecture.md)、[模块地图](./zh-CN/architecture/module-map.md)
- 开发：[本地开发与命令](./zh-CN/development/setup-and-commands.md)、[路由与 API](./zh-CN/development/routes-and-api.md)、[数据库与基础设施](./zh-CN/development/database-and-infra.md)
- 运维：[部署与环境变量](./zh-CN/operations/deployment-and-env.md)、[部署与投递历史](./zh-CN/operations/deployment-and-delivery-history.md)
- 参考与历史：[文档迁移映射表](./zh-CN/reference/doc-migration-map.md)、[API 测试示例](./zh-CN/reference/api-test-examples.md)、[结构分析历史](./zh-CN/reference/structure-analysis-history.md)、[产品实现历史](./zh-CN/history/product-implementation-history.md)、[设计与路线图历史](./zh-CN/history/design-and-roadmap-history.md)

### AI 快速上下文

- [仓库摘要](./zh-CN/agent/repo-brief.md)
- [仓库地图](./zh-CN/agent/repo-map.md)
- [工作流](./zh-CN/agent/workflows.md)
- [后续建议摘要](./zh-CN/agent/next-steps.md)

## 日本語

`docs/` は人間向けの正式な長文書レイヤーです。AI の根入口は [`../AGENTS.md`](../AGENTS.md) を優先し、互換説明は [`../CLAUDE.md`](../CLAUDE.md) に残しています。AI 補助文脈は中国語の [`./zh-CN/agent/`](./zh-CN/agent/) に集約しています。

### レイヤー構成

- AI 根入口: [`../AGENTS.md`](../AGENTS.md)
- AI 互換入口: [`../CLAUDE.md`](../CLAUDE.md)
- AI 補助文脈: [`./zh-CN/agent/repo-brief.md`](./zh-CN/agent/repo-brief.md)、[`./zh-CN/agent/repo-map.md`](./zh-CN/agent/repo-map.md)、[`./zh-CN/agent/workflows.md`](./zh-CN/agent/workflows.md)、[`./zh-CN/agent/next-steps.md`](./zh-CN/agent/next-steps.md)
- 日本語長文書: [`./ja/`](./ja/)
- 中国語長文書: [`./zh-CN/`](./zh-CN/)

### 5-10 分で読む順番

1. [プロジェクト概要](./ja/overview/project-overview.md)
2. [現状](./ja/overview/current-status.md)
3. [バックログ](./ja/overview/backlog.md)
4. [ルートと API](./ja/development/routes-and-api.md)
5. [データベースと基盤](./ja/development/database-and-infra.md)

### 日本語長文書索引

- 概要: [プロジェクト概要](./ja/overview/project-overview.md)、[現状](./ja/overview/current-status.md)、[バックログ](./ja/overview/backlog.md)、[改善レポート](./ja/overview/optimization-report.md)
- アーキテクチャ: [システム構成](./ja/architecture/system-architecture.md)、[モジュールマップ](./ja/architecture/module-map.md)
- 開発: [ローカル開発とコマンド](./ja/development/setup-and-commands.md)、[ルートと API](./ja/development/routes-and-api.md)、[データベースと基盤](./ja/development/database-and-infra.md)
- 運用: [デプロイと環境変数](./ja/operations/deployment-and-env.md)、[デプロイと配信の履歴](./ja/operations/deployment-and-delivery-history.md)
- 参考 / 履歴: [文書移行マップ](./ja/reference/doc-migration-map.md)、[API テスト例](./ja/reference/api-test-examples.md)、[構造分析の履歴](./ja/reference/structure-analysis-history.md)、[実装履歴](./ja/history/product-implementation-history.md)、[設計とロードマップの履歴](./ja/history/design-and-roadmap-history.md)

## Migration Notes

- `document/` 配下の Markdown は `docs/` の現行文書または履歴文書へ再編済み
- Markdown 以外の技術補助ファイルはコード寄りのディレクトリへ移動済み
- 現行仕様は `overview/current-status.md` とコードを優先し、履歴文書は補助資料として扱う
