# デプロイと配信の履歴

- 简体中文: [部署与投递历史](../../zh-CN/operations/deployment-and-delivery-history.md)
- 最終更新: 2026-03-07

> 履歴文書です。現行手順は [デプロイと環境変数](./deployment-and-env.md) を優先してください。

## 目的

旧デプロイ手順、メール送信、R2 設定、ドメイン関連の背景を残しておくための文書です。

## 適用範囲

- 過去の運用判断の追跡
- メール配信方式の振り返り
- R2 採用背景の確認

## 参照根拠

- 旧 `DEPLOYMENT_*`
- 旧 `SMTP_SETUP_GUIDE.md`
- 旧 `RESEND_*`
- 旧 `CLOUDFLARE_R2_SETUP.md`

## 関連文書

- [デプロイと環境変数](./deployment-and-env.md)
- [文書移行マップ](../reference/doc-migration-map.md)

## 残しておくべきポイント

- Vercel + PostgreSQL + 独自ドメインが長く標準想定だった
- メール送信は Resend と SMTP の両案を持っていた
- R2 は本番アップロード先として想定され、開発ではローカル fallback が許容されていた
- DNS 検証やチェックリストなどの運用メモが多数あった

## 何が現行文書へ吸収されたか

- 現在のデプロイ構成と env: [デプロイと環境変数](./deployment-and-env.md)
- 現在のアップロード基盤: [データベースと基盤](../development/database-and-infra.md)
- 現在の製品状態: [現状](../overview/current-status.md)
