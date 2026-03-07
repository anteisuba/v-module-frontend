# API 测试示例

- 日本語: [API テスト例](../../ja/reference/api-test-examples.md)
- 最后更新: 2026-03-07

## 用途

提供最常用接口的最小测试样例，方便联调或手动验证。

## 适用范围

- 本地联调
- Postman / curl 手测
- API 回归检查

## 来源依据

- `app/api/**`
- `lib/api/endpoints.ts`

## 相关链接

- [路由与 API](../development/routes-and-api.md)
- [本地开发与命令](../development/setup-and-commands.md)

## 示例

### 注册

```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"12345678","slug":"devuser"}'
```

### 登录

```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt
```

### 当前用户

```bash
curl http://localhost:3000/api/user/me -b cookies.txt
```

### 读取当前用户页面草稿

```bash
curl http://localhost:3000/api/page/me -b cookies.txt
```

### 读取公开页面

```bash
curl http://localhost:3000/api/page/testuser
```

### 获取新闻列表

```bash
curl "http://localhost:3000/api/news/articles?page=1&limit=10&published=true"
```

### 获取博客列表

```bash
curl "http://localhost:3000/api/blog/posts?page=1&limit=20" -b cookies.txt
```

### 获取商品列表

```bash
curl "http://localhost:3000/api/shop/products?page=1&limit=20" -b cookies.txt
```

## 注意事项

- 后台接口通常依赖 cookie，会话测试建议使用 `-c` / `-b`
- 公开博客评论与点赞支持匿名，但订单创建当前存在鉴权矛盾
- 接口真实返回结构以 `app/api/**` 和 `lib/api/endpoints.ts` 为准
