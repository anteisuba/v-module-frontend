# ルートと API

- 简体中文: [路由与 API](../../zh-CN/development/routes-and-api.md)
- 最終更新: 2026-03-07

## 目的

公開ルート、管理画面ルート、API ルートの実際の入口と注意点を 1 か所に整理します。

## 適用範囲

- ページ調査
- API 呼び出し
- 権限制御の確認

## 参照根拠

- `app/**`
- `pnpm build` の route 一覧

## 関連文書

- [システム構成](../architecture/system-architecture.md)
- [モジュールマップ](../architecture/module-map.md)
- [現状](../overview/current-status.md)

## 公開ページ

| ルート | 説明 |
| --- | --- |
| `/` | 現在は `/admin` へリダイレクト |
| `/news` | ニュース一覧 |
| `/news/[id]` | ニュース詳細 |
| `/u/[slug]` | ユーザー公開トップ |
| `/u/[slug]/blog` | ブログ一覧 |
| `/u/[slug]/blog/[id]` | ブログ詳細 |
| `/u/[slug]/shop` | 商品一覧 |
| `/u/[slug]/shop/[id]` | 商品詳細 |
| `/u/[slug]/shop/[id]/checkout` | 公開注文ページ |
| `/u/[slug]/shop/order-success/[orderId]` | 注文成功の仮ページ |
| `/blog` | 現在 `/u/xiuruisu/blog` へ固定リダイレクト |
| `/shop` | 現在 `/u/xiuruisu/shop` へ固定リダイレクト |

## 管理画面

| ルート | 説明 |
| --- | --- |
| `/admin` | ログイン |
| `/admin/register` | 登録 |
| `/admin/forgot-password` | パスワード再設定要求 |
| `/admin/reset-password` | パスワード再設定 |
| `/admin/dashboard` | 管理画面入口 |
| `/admin/cms` | 公開ページ CMS |
| `/admin/blog` | ブログ一覧 |
| `/admin/blog/new` | ブログ新規作成 |
| `/admin/blog/[id]` | ブログ編集 |
| `/admin/shop` | 商品一覧 |
| `/admin/shop/new` | 商品新規作成 |
| `/admin/shop/[id]` | 商品編集 |
| `/admin/orders` | 注文一覧 |

## API 分類

### ユーザー / セッション

- `POST /api/user/register`
- `POST /api/user/login`
- `POST /api/user/logout`
- `GET /api/user/me`
- `POST /api/user/forgot-password`
- `POST /api/user/reset-password`

### ページ設定

- `GET /api/page/[slug]`
- `GET /api/page/me`
- `PUT /api/page/me`
- `POST /api/page/me/publish`
- `POST /api/page/me/upload`

### ニュース

- `GET /api/news`
- `GET/POST /api/news/articles`
- `GET/PUT/DELETE /api/news/articles/[id]`

### ブログ

- `GET/POST /api/blog/posts`
- `GET/PUT/DELETE /api/blog/posts/[id]`
- `GET/POST /api/blog/posts/[id]/comments`
- `GET/POST /api/blog/posts/[id]/like`

### ショップ / 注文

- `GET/POST /api/shop/products`
- `GET/PUT/DELETE /api/shop/products/[id]`
- `POST /api/shop/checkout`
- `GET /api/shop/orders`
- `PUT /api/shop/orders/[id]`

## 権限メモ

- `middleware.ts` は `/admin/*` を保護し、ログイン系だけ例外
- ブログのコメントといいねは匿名利用を許容
- `POST /api/shop/checkout` は匿名訪問者向けの公開チェックアウト入口
- `/api/shop/orders*` は売り手管理向けの注文一覧 / 状態更新だけを担当する
