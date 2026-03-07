# モジュールマップ

- 简体中文: [模块地图](../../zh-CN/architecture/module-map.md)
- 最終更新: 2026-03-07

## 目的

ディレクトリ単位の役割を一覧化し、どこを触ればよいかをすぐ判断できるようにします。

## 適用範囲

- ファイル探索
- 改修箇所の選定
- レビュー準備

## 参照根拠

- `git ls-files`
- トップレベルディレクトリ走査

## 関連文書

- [システム構成](./system-architecture.md)
- [ルートと API](../development/routes-and-api.md)

## ディレクトリ責務

| パス | 役割 | 代表ファイル |
| --- | --- | --- |
| `app/` | ページと API の入口 | `app/u/[slug]/page.tsx`, `app/api/shop/orders/route.ts` |
| `components/ui/` | 共通 UI とエディタ部品 | `CMSHeader.tsx`, `NewsArticleEditor.tsx` |
| `components/blog/` | ブログ管理 UI | `BlogEditor.tsx` |
| `components/shop/` | 商品管理 UI | `ProductEditor.tsx` |
| `features/home-hero/` | Hero 表示とメニュー | `HomeHero.tsx`, `useHeroMenu.ts` |
| `features/page-renderer/` | 公開ページ section レンダラ | `PageRenderer.tsx`, `registry.tsx` |
| `features/blog/` | ブログ公開 UI | `BlogList.tsx`, `BlogDetail.tsx` |
| `features/shop/` | ショップ公開 UI | `ProductList.tsx`, `ProductDetail.tsx` |
| `features/video-section/` | 動画再生と URL 解析 | `VideoPlayer.tsx`, `urlParser.ts` |
| `domain/page-config/` | ページ設定の型とサービス | `services.ts`, `types.ts` |
| `domain/news/` | ニュースサービス | `services.ts` |
| `domain/blog/` | ブログサービス | `services.ts` |
| `domain/shop/` | 商品 / 注文サービス | `services.ts` |
| `lib/api/` | ブラウザ向け API client | `client.ts`, `endpoints.ts` |
| `lib/session/` | セッション設定 | `userSession.ts` |
| `lib/context/` | user / toast / inspector context | `UserContext.tsx`, `ToastContext.tsx` |
| `lib/env.ts` | 環境変数検証 | `lib/env.ts` |
| `prisma/` | schema、migration、seed、SQL | `schema.prisma`, `seed.ts` |

## 主な入口

- 公開ページ入口: `app/u/[slug]/page.tsx`
- 管理画面入口: `app/admin/dashboard/page.tsx`
- CMS 入口: `app/admin/cms/page.tsx`
- 注文 API 入口: `app/api/shop/orders/route.ts`
- セッションガード入口: `middleware.ts`

## 境界上の注意

- page 層と route handler 層で責務が完全には揃っていない
- `components/ui/` が重く、共通 UI と業務編集 UI が混在している
- `features/` と `domain/` の分離は始まっているが、まだ統一途中
