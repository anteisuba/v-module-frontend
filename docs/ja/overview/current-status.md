# 現状

- 简体中文: [当前状态](../../zh-CN/overview/current-status.md)
- 最終更新: 2026-03-11

## 目的

プロジェクトが実際にどこまで出来ているか、どこが部分実装か、次に何を優先すべきかを 1 ページで確認するための文書です。

## 適用範囲

- 機能評価
- 新規引き継ぎ
- 企画前の基準確認

## 参照根拠

- `pnpm build`
- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm lint`
- `git ls-files`
- 主要ルート、API、Prisma モデル、主要ページ実装

## 関連文書

- [プロジェクト概要](./project-overview.md)
- [バックログ](./backlog.md)
- [改善レポート](./optimization-report.md)
- [ルートと API](../development/routes-and-api.md)

## コマンド監査結果

- `pnpm build`: 成功。`middleware -> proxy`、`prisma.config.ts` 移行とローカル build warning は解消済みで、現在は標準 build 出力
- `pnpm check`: 成功
- `pnpm test`: 成功。現在は `27` ファイル `81` テスト
- `pnpm test:e2e`: 成功。現在は `11` 個の Chromium シナリオ
- `pnpm lint`: 成功。現在は `0 errors / 0 warnings`
- 自動テストファイル: `Vitest + Playwright` の spec があり、かつ実行済みで認証、ページ設定、メディアライブラリ、公開コンテンツ、Shop 注文、Stripe Checkout / Webhook / Connect / 照合 / 精算、payout onboarding などをカバー
- Prisma migration ディレクトリ数: 現在 `13`

## 実装済み

- ユーザー機能: 登録、ログイン、ログアウト、パスワードリセット、管理画面ガード
- ページ設定: 下書きと公開設定の分離、公開ページは `publishedConfig` を参照、legacy `links` section は読み書き時に自動清掃
- 管理画面編集骨格: CMS、ブログ、ショップの一覧 / 詳細編集をタブ + 単一展開の折りたたみパネルに統一
- 公開ページ: テーマカラー、フォント、背景、Hero、News、Video などの設定駆動表示
- 公開入口: `/blog`、`/shop` を全体の公開コンテンツ入口に変更し、固定 slug 依存を解消
- ニュース: 一覧、詳細、管理画面編集と公開 API
- ブログ: 管理画面一覧 / 編集、公開一覧 / 詳細、いいね API、コメント API と UI
- コメント審査: `PENDING / APPROVED / REJECTED` に対応し、売り手管理画面から検索、審査、削除が可能
- ショップ: 商品管理、公開商品一覧 / 詳細、公開チェックアウト、注文成功 / 詳細ページ、売り手向け注文一覧 / 詳細 / 状態更新
- 返金と dispute: `OrderPaymentAttempt`、`OrderRefund`、`OrderDispute` を保持し、管理画面で返金実行と dispute タイムライン表示が可能
- Stripe Checkout / Webhook: 公開注文で Checkout Session を生成し、支払い成功・失敗・期限切れ・dispute を注文へ反映
- 支払い照合: 管理画面に Stripe 照合ページがあり、イベント / 異常の確認と CSV エクスポートが可能
- 精算照合: Stripe `balance transactions` / `payouts` を同期し、精算状況を確認して一括で reconciliation 状態を更新可能
- Stripe Connect: 売り手収益口座モデル、onboarding / dashboard link / account sync API、`/admin/settings/payouts` 画面、destination charge と `PLATFORM` fallback がある
- Connect 運用可視性: 注文詳細、照合、精算ページで `paymentRoutingMode`、connected account、charge / transfer、platform fee、seller net のスナップショットを表示
- 内部定期同期: 売り手単位で Stripe の精算・payout・dispute を同期する内部 cron API がある
- 注文通知: 支払い確定後の購入者 / 売り手向けメール、注文状態変更メールに対応
- メディアライブラリ: 統一メディア画面、使用箇所フィルタ、参照追跡、ライブラリ内置換、タグ一括更新に対応
- メディアアップロード: ローカル / R2 分岐、`MediaAsset` 記録
- i18n 基盤: `zh`、`ja`、`en`

## 部分実装 / ギャップ

- 正式な決済ルートは現在も Stripe 単一チャネルで、PayPal / ローカル決済は後回し
- Stripe Connect の主経路は動くが、より細かい運用フィルタ、アラート、ブラウザ回帰は今後も強化余地がある
- 工学基線は「build / check / test / lint / e2e」まで安定したが、Playwright はまだローカル単一 worker・単一ブラウザ寄りで、CI / 多ブラウザ回帰までは未到達

## 未実装

- カートと複数商品決済
- 在庫アラート
- Turnstile / CAPTCHA
- 配信スケジュール `ScheduleBlock`
- PayPal / ローカル決済
- より完全な SEO、監視、ログ、エラートラッキング

## 結論

このプロジェクトはすでに「公開ページ + CMS + コンテンツ + Shop 注文 + Stripe 決済運用」が成立している段階です。次の優先順位は新機能追加よりも、Playwright の継続実行、Stripe Connect 運用の磨き込み、より広い回帰カバレッジです。
