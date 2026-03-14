# バックログ

- 简体中文: [后续待办](../../zh-CN/overview/backlog.md)
- 最終更新: 2026-03-14

## 目的

コード走査の結果を、優先度付きの改善タスクへ変換します。順番は「基線安定化 -> Stripe 運用閉ループ -> 新機能」です。

## 適用範囲

- リリース計画
- 開発スプリント設計
- 技術的負債の整理

## 参照根拠

- [現状](./current-status.md)
- `pnpm build`
- `pnpm lint`
- ルートと API、Stripe Connect 関連コード

## 関連文書

- [現状](./current-status.md)
- [改善レポート](./optimization-report.md)
- [ルートと API](../development/routes-and-api.md)

## P0: 直ちに処理する項目

- 現時点で新しい P0 はなし。主要経路は build / check / test / lint を通過

## P1: 工学安定性と Stripe 運用閉ループ

- 既存の Playwright シナリオを継続実行へ正式に組み込む。GitHub Actions で PR / push 時に `check / test / build / lint` を回し、`11` 個の e2e spec を Chromium / Firefox / WebKit 行列で実行し、失敗時は Playwright 成果物をアップロードするようになった。README badge と高リスク経路の一段目テスト拡張も完了し、次は flaky 分析と残る高リスク経路の補測を優先する
- Stripe Connect を正式路線として継続し、照合ページの routing / account 軸フィルタ、精算照合ページの payout 状態グルーピング、異常メール / Slack アラート、注文 CSV の Connect 項目出力、payout settings の説明文追加、onboarding 進捗表示は完了済みとして、次は異常状態の案内を補強する
- `scripts/run-node-tool.mjs`、`scripts/run-prisma-generate.mjs`、preload 互換層を維持し、Next / Playwright / Prisma のツールノイズを主経路へ戻さない

## TODO: 決済拡張

- Stripe Connect と現行運用が安定した後で、PayPal / ローカル決済やより深い dispute 証拠提出フローを評価する

## P2: 体験拡張

- カートと複数商品決済
- 在庫アラート
- 配信スケジュール
- Turnstile / CAPTCHA
- SEO と公開入口の強化
- 監視、ログ、エラートラッキング強化

## 文書運用ルール

- 中国語 `docs/zh-CN` を canonical とし、日本語はミラーとして同期する
- 新機能、監査結果、優先順位が変わったら [現状](./current-status.md) と本ページを更新する
- 旧計画は `history/` と `reference/` に限定し、入口文書へ戻さない
