# プロジェクト概要

- 简体中文: [项目概览](../../zh-CN/overview/project-overview.md)
- 最終更新: 2026-03-07

## 目的

`v-module-frontend` は VTuber / クリエイター向けのマルチユーザーサイト基盤です。管理画面、公開ページ、ニュース、ブログ、ショップ、注文の基本フローを 1 つの Next.js プロジェクトで扱います。

## 適用範囲

- 新しく引き継ぐ開発者
- 現在の製品境界を確認したい保守担当
- 実装済みと未実装を素早く切り分けたい人

## 参照根拠

- `package.json`
- `app/**`
- `domain/**`
- `features/**`
- `lib/**`
- `prisma/schema.prisma`
- 2026-03-07 の検証: `pnpm build`, `pnpm check`, `pnpm lint`

## 関連文書

- [現状](./current-status.md)
- [バックログ](./backlog.md)
- [システム構成](../architecture/system-architecture.md)
- [ローカル開発とコマンド](../development/setup-and-commands.md)

## 要約

このリポジトリは「マルチテナントのクリエイター公開ページ + CMS 管理画面」です。プロトタイプ段階は超えており、主要なコンテンツ管理は動いていますが、機能の閉ループとコード品質には未解決の課題があります。

## 現在カバーしている領域

- ユーザー登録、ログイン、ログアウト、パスワードリセット
- CMS 下書き保存と公開
- `/u/[slug]` の設定駆動レンダリング
- ニュース一覧、詳細、管理画面編集
- ブログ一覧、詳細、いいね、コメント
- ショップ商品管理、公開商品表示、基本注文、売り手向け注文管理
- 画像アップロード、ローカル / R2 切替、`MediaAsset` 記録
- `zh` / `ja` / `en` の i18n 基盤

## 技術ベース

- Next.js 16 + React 19
- TypeScript + pnpm + Turbopack
- Prisma + PostgreSQL
- `iron-session`
- Zod
- `next-intl`
- Resend / SMTP
- Cloudflare R2

## 現時点の評価

- 機能完成度: 中〜高
- 工学的健全性: 中〜低
- ドキュメント状態: 今回の再編で `docs/` に統一

## 推奨読書順

1. [システム構成](../architecture/system-architecture.md)
2. [モジュールマップ](../architecture/module-map.md)
3. [ローカル開発とコマンド](../development/setup-and-commands.md)
4. [現状](./current-status.md)
5. [バックログ](./backlog.md)
