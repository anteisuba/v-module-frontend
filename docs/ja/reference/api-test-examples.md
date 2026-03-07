# API テスト例

- 简体中文: [API 测试示例](../../zh-CN/reference/api-test-examples.md)
- 最終更新: 2026-03-07

## 目的

代表的な API を最小コマンドで確認できるようにするための例です。

## 適用範囲

- ローカル疎通確認
- Postman / curl 手動検証
- 回帰テストの補助

## 参照根拠

- `app/api/**`
- `lib/api/endpoints.ts`

## 関連文書

- [ルートと API](../development/routes-and-api.md)
- [ローカル開発とコマンド](../development/setup-and-commands.md)

## 例

### 登録

```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"12345678","slug":"devuser"}'
```

### ログイン

```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt
```

### 現在ユーザー

```bash
curl http://localhost:3000/api/user/me -b cookies.txt
```

### 現在ユーザーのページ設定

```bash
curl http://localhost:3000/api/page/me -b cookies.txt
```

### 公開ページ取得

```bash
curl http://localhost:3000/api/page/testuser
```

### ニュース一覧

```bash
curl "http://localhost:3000/api/news/articles?page=1&limit=10&published=true"
```

### ブログ一覧

```bash
curl "http://localhost:3000/api/blog/posts?page=1&limit=20" -b cookies.txt
```

### 商品一覧

```bash
curl "http://localhost:3000/api/shop/products?page=1&limit=20" -b cookies.txt
```

## 注意

- 管理系 API は cookie セッションを使うため `-c` / `-b` の併用を推奨
- ブログのコメント / いいねは匿名利用に対応
- 注文作成は公開ページと API の認証要件が一致していないため要注意
