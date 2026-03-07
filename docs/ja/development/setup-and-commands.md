# ローカル開発とコマンド

- 简体中文: [本地开发与命令](../../zh-CN/development/setup-and-commands.md)
- 最終更新: 2026-03-07

## 目的

最短手順でプロジェクトを起動し、使えるコマンドを把握できるようにします。

## 適用範囲

- 新環境セットアップ
- ローカル調査
- build / check 実行

## 参照根拠

- `package.json`
- `env.example`
- `docker-compose.yml`
- `prisma/seed.ts`

## 関連文書

- [データベースと基盤](./database-and-infra.md)
- [デプロイと環境変数](../operations/deployment-and-env.md)

## 前提条件

- Node.js `>=20`
- pnpm `>=8`
- PostgreSQL 16 または外部 PostgreSQL
- 任意で Docker Desktop

## クイックスタート

1. ローカル DB 起動
   - `docker compose up -d`
2. 環境変数を用意
   - `env.example` を参照
3. 依存関係インストール
   - `pnpm install`
4. migration 実行
   - `pnpm db:migrate`
5. seed 実行
   - `pnpm db:seed`
6. 開発サーバ起動
   - `pnpm dev`

## 主なコマンド

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm check`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:studio`
- `pnpm clear-rate-limit`

## ローカル確認のおすすめ

- `/admin` でログイン
- `/admin/cms` で下書き保存と公開
- `/u/testuser` で公開ページ表示
- `pnpm build` と `pnpm check` 実行

## 既知の状態

- `pnpm build` は成功
- `pnpm check` は成功
- `pnpm lint` は現時点で失敗
- `prisma/seed.ts` は `test@example.com / 123456 / testuser` を作成する
