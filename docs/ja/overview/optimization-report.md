# 改善レポート

- 简体中文: [优化报告](../../zh-CN/overview/optimization-report.md)
- 最終更新: 2026-03-11

## 目的

今すぐ取り組むべき工学改善項目をまとめ、次の開発が弱い土台の上に積み上がらないようにします。

## 適用範囲

- 技術的負債の解消
- リスク評価
- コード健全性改善

## 参照根拠

- `pnpm build`
- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm lint`
- 主要画面と API の抜き取り確認

## 関連文書

- [現状](./current-status.md)
- [バックログ](./backlog.md)
- [システム構成](../architecture/system-architecture.md)

## P0: 現時点で新しい阻害要因なし

- 公開チェックアウト / 注文 API の意味衝突、固定 slug、メディアライブラリ欠落、lint error 阻害はこのラウンドで解消済み
- 現在は `pnpm build`、`pnpm check`、`pnpm test`、`pnpm lint`、`pnpm test:e2e` がすべて実行可能

## P1: 継続実行と長期保守性

- `pnpm lint` warning と `middleware` / Prisma 設定の非推奨項目は解消済みで、今後はこの基線を崩さないことが重要
- Playwright シナリオは CMS、公開コンテンツ、注文、Connect onboarding まであり、このラウンドで `11` 個の Chromium シナリオを安定実行済み。次は CI と複数ブラウザ回帰
- Stripe Connect の routing / account スナップショットは注文、照合、精算に表示済みで、次はフィルタ、エクスポート、異常アラートを補強する段階

## P2: プラットフォーム互換層と次段階

- 現在は `proxy.ts`、`prisma.config.ts`、スクリプト層 preload により Next / Prisma / Playwright の出力を安定化している。Next / Browserslist を更新する際はこの互換層を再点検する
- デプロイ環境では引き続き HTTPS `NEXT_PUBLIC_BASE_URL`、R2、Stripe などの設定整合性を維持する必要がある

## 推奨実行順

1. Playwright の継続実行と CI / 複数ブラウザ回帰を補う
2. Stripe Connect 運用画面をさらに磨く
3. その後にカート、在庫アラート、`ScheduleBlock`、SEO / 監視などを進める
