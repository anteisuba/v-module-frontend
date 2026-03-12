# システム構成

- 简体中文: [系统架构](../../zh-CN/architecture/system-architecture.md)
- 最終更新: 2026-03-07

## 目的

ランタイム階層、主要データフロー、モジュール境界を説明し、改修入口を素早く見つけられるようにします。

## 適用範囲

- 構造理解
- 新機能の配置判断
- 障害調査

## 参照根拠

- `app/**`
- `features/**`
- `domain/**`
- `lib/**`
- `prisma/schema.prisma`

## 関連文書

- [モジュールマップ](./module-map.md)
- [ルートと API](../development/routes-and-api.md)
- [データベースと基盤](../development/database-and-infra.md)

## レイヤ構成

- `app/`: Next.js App Router のページ / API 入口
- `features/`: UI と機能単位の表示・操作
- `domain/`: 業務サービスと型
- `components/`: エディタと共通 UI
- `hooks/`: 共有 hook
- `lib/`: セッション、API client、context、env、utility
- `prisma/`: schema、migration、seed、補助 SQL

## 主要フロー

### 公開ページ

1. `/u/[slug]` にアクセス
2. `domain/page-config` が `publishedConfig` を読む
3. `ThemeProvider` がテーマカラーとフォントを適用
4. `features/page-renderer` が section type ごとに描画
5. 必要に応じてニュース一覧などを追加表示

### 管理画面

1. `/admin/*` にアクセス
2. `proxy.ts` が `iron-session` を検証
3. ページが `lib/api` 経由で route handler を呼ぶ
4. route handler が `domain/*` または Prisma で処理
5. `Page` や各コンテンツ表に保存

### ショップと注文

1. 売り手が管理画面で商品と注文状態を管理
2. 公開側で商品一覧 / 詳細を表示
3. 注文ページが注文作成 API を呼ぶ
4. `Order` / `OrderItem` に保存
5. 現在は匿名注文と API 認証が食い違っている

## 基盤

- セッション: `iron-session`
- DB: PostgreSQL + Prisma
- メール: Resend / SMTP
- アップロード: Cloudflare R2 またはローカル
- i18n: `next-intl`

## 現在の制約

- 管理画面と公開画面が 1 つの App Router プロジェクトに同居している
- 一部 API は route 内で直接 Prisma を使い、domain 層へ統一されていない
- JSON 設定駆動のため、型の一貫性が重要
