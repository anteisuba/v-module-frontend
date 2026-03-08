# 改善レポート

- 简体中文: [优化报告](../../zh-CN/overview/optimization-report.md)
- 最終更新: 2026-03-07

## 目的

今すぐ取り組むべき技術的改善項目をまとめ、次の開発が不安定な土台の上に積み上がらないようにします。

## 適用範囲

- 技術的負債の解消
- リスク評価
- コード健全性改善

## 参照根拠

- `pnpm lint`
- `pnpm build`
- `pnpm check`
- 主要画面と API の抜き取り確認

## 関連文書

- [現状](./current-status.md)
- [バックログ](./backlog.md)
- [システム構成](../architecture/system-architecture.md)

## P0: 正しさと整合性

- 公開注文画面と注文作成 API の認証要件が矛盾している
- `PageConfig.links` と実際のレンダラが一致していない
- ルート `/blog` と `/shop` が固定 slug に依存している

## P1: Lint を止めている問題

- 現在 `pnpm lint` は `62 errors / 93 warnings` で失敗
- 主なエラーは `@typescript-eslint/no-explicit-any` で、現在およそ `43` 件
- そのほか Hooks の条件付き呼び出し、render 中の `Math.random()` / `Date.now()`、effect 内の同期 `setState` がある
- 問題が集中している領域:
  - `components/ui/*`
  - `features/video-section/*`
  - `lib/api/endpoints.ts`
  - 一部の `app/api/*` と `app/u/*`

## P2: 保守性

- 未使用変数と不完全な依存配列が多く、ページ境界が崩れ始めている
- 管理画面と公開画面に重複スタイルと状態管理がある
- 古い文書と現行コードの乖離は今回 `docs/` で整理した

## プラットフォーム警告

- `middleware.ts` は Next.js で非推奨になり、将来 `proxy` へ移行が必要
- `package.json#prisma` は Prisma 側で廃止予定、`prisma.config.ts` への移行が必要
- `baseline-browser-mapping` が古いという警告が build ログに出ている

## 推奨実行順

1. P0 の機能矛盾を解消
2. Lint を止めている Hooks / purity / `any` を整理
3. その後に決済、カート、メディアライブラリなどを拡張
