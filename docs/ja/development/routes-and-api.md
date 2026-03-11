# ルートと API

- 简体中文: [路由与 API](../../zh-CN/development/routes-and-api.md)
- 最終更新: 2026-03-11

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
| `/u/[slug]/shop/order-success/[orderId]` | 注文成功 / 詳細ページ。`buyerEmail` 参照と `session_id` による補確認に対応 |
| `/blog` | 全体の公開ブログ入口。公開済みブログを集約表示 |
| `/shop` | 全体の公開ショップ入口。公開済み商品を集約表示 |

注記: `/test`、`/test/stripe-hosted` は内部検証用で、プロダクトの正式入口ではない。

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
| `/admin/comments` | コメント審査 |
| `/admin/media` | 統合メディアライブラリ |
| `/admin/shop` | 商品一覧 |
| `/admin/shop/new` | 商品新規作成 |
| `/admin/shop/[id]` | 商品編集 |
| `/admin/orders` | 注文一覧 |
| `/admin/orders/[id]` | 注文詳細、返金、支払いタイムライン |
| `/admin/orders/reconciliation` | Stripe 支払い照合 |
| `/admin/orders/reconciliation/settlements` | Stripe 精算照合 |
| `/admin/settings/payouts` | Stripe Connect 収益口座設定 |

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
- `GET /api/blog/comments`
- `PUT/DELETE /api/blog/comments/[id]`
- `GET/POST /api/blog/posts/[id]/like`

### メディアライブラリ

- `GET/PATCH/DELETE /api/media-assets`
- `POST /api/media-assets/replace`

### ショップ / 注文

- `GET/POST /api/shop/products`
- `GET/PUT/DELETE /api/shop/products/[id]`
- `POST /api/shop/checkout`
- `GET /api/shop/orders`
- `GET /api/shop/orders/[id]`
- `PUT /api/shop/orders/[id]`
- `POST /api/shop/orders/[id]/confirm`
- `POST /api/shop/orders/[id]/refunds`

### 決済、照合、Connect

- `POST /api/payments/stripe/webhook`
- `POST /api/payments/stripe/connect/webhook`
- `POST /api/payments/connect/accounts`
- `GET /api/payments/connect/accounts/me`
- `GET/POST /api/payments/connect/accounts/onboarding-link`
- `POST /api/payments/connect/accounts/dashboard-link`
- `POST /api/payments/connect/accounts/sync`
- `GET /api/shop/payments/reconciliation`
- `GET/POST/PATCH /api/shop/payments/settlements`

### 内部ジョブ

- `POST /api/internal/cron/stripe-finance-sync`

## 権限メモ

- `middleware.ts` は `/admin/*` を保護し、ログイン系だけ例外
- ブログのコメントといいねは匿名利用を許容
- `GET /api/blog/comments` と `PUT/DELETE /api/blog/comments/[id]` は売り手自身の審査画面向け
- `GET/PATCH/DELETE /api/media-assets` と `POST /api/media-assets/replace` は管理画面のメディアライブラリ専用
- `POST /api/shop/checkout` は匿名訪問者向けの公開チェックアウト入口で、注文確保、在庫減算、Stripe Checkout Session 作成を行う
- `POST /api/shop/orders/[id]/confirm` は公開注文成功ページから `session_id` を使って支払い確定を補うための API
- `GET /api/shop/orders/[id]` は売り手セッションでも、`buyerEmail` を明示した公開参照でも利用できる
- `PUT /api/shop/orders/[id]` と `POST /api/shop/orders/[id]/refunds` は売り手管理用。Stripe 未決済注文を手動で `PAID` にはできない
- `POST /api/payments/stripe/webhook` は Checkout 成功、非同期成功 / 失敗、期限切れ、dispute を処理する
- `POST /api/payments/stripe/connect/webhook` と `/api/payments/connect/accounts/*` は売り手の Stripe Connect 口座同期 / onboarding 用
- `GET /api/shop/payments/reconciliation` と `GET/POST/PATCH /api/shop/payments/settlements` は支払い運用向けで、`paymentRoutingMode`、connected account、charge / transfer、platform fee、seller net のスナップショットを返す
- `POST /api/internal/cron/stripe-finance-sync` は内部同期用で、公開 API として扱わない
