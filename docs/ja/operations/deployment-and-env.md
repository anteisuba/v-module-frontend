# デプロイと環境変数

- 简体中文: [部署与环境变量](../../zh-CN/operations/deployment-and-env.md)
- 最終更新: 2026-03-14

## 目的

現在推奨するデプロイ構成、環境変数、運用時の注意点を整理します。

## 適用範囲

- 新環境デプロイ
- 本番設定チェック
- 運用引き継ぎ

## 参照根拠

- `env.example`
- `lib/env.ts`
- `next.config.ts`
- build ログと旧デプロイ文書

## 関連文書

- [ローカル開発とコマンド](../development/setup-and-commands.md)
- [デプロイと配信の履歴](./deployment-and-delivery-history.md)

## 推奨構成

- フロント / API: Vercel
- データベース: PostgreSQL
- メール: Resend 優先、SMTP 予備
- アップロード: Cloudflare R2、未設定時はローカルへフォールバック

## 主要環境変数

### 必須

- `DATABASE_URL`
- `SESSION_PASSWORD`
- `NEXT_PUBLIC_BASE_URL`

### メール

- `RESEND_API_KEY`
- `RESEND_FROM`
- または SMTP 一式
- 財務異常メールアラートは上記メール設定を再利用し、対象売り手のメールアドレスへ送信する

### 運用アラート

- `FINANCE_ALERT_SLACK_WEBHOOK_URL`（任意）

### ストレージ

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`（任意）

## 現在の検証動作

- `lib/env.ts` がサーバ起動時に環境変数を検証する
- 本番 / Vercel では不正設定を即時エラーにする
- メールや R2 がない場合は警告を出す

## 運用上の注意

- リクエスト境界は `proxy.ts` を使う。Next.js 16 では `middleware.ts` と併存させない
- build 中に Prisma Client 生成が走る
- 本番では HTTPS の `NEXT_PUBLIC_BASE_URL` を使う
- アップロード、パスワードリセット、メール送信はそれぞれ個別に設定確認が必要
- 支払い照合 / 精算異常をチーム向け Slack にも流したい場合は `FINANCE_ALERT_SLACK_WEBHOOK_URL` を設定する。未設定でも売り手メールアラートは動作する
