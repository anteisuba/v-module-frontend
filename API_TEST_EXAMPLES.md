# API 测试示例

## 前置条件

1. 确保开发服务器运行：`pnpm dev`
2. 确保数据库已初始化并运行 seed：`pnpm db:seed`
3. 测试用户信息：
   - Email: `test@example.com`
   - Password: `123456`
   - Slug: `testuser`

---

## 1. 用户注册 API

### POST /api/user/register

注册新用户。

```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "123456",
    "displayName": "New User",
    "slug": "newuser"
  }'
```

**响应**：
```json
{
  "ok": true,
  "user": {
    "id": "clx...",
    "slug": "newuser"
  }
}
```

---

## 2. 用户登录 API

### POST /api/user/login

用户登录并创建 session。

```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt
```

**响应**：
```json
{ "ok": true }
```

---

## 3. 获取当前用户信息

### GET /api/user/me

获取当前登录用户信息（需要认证）。

```bash
curl http://localhost:3000/api/user/me \
  -b cookies.txt
```

**响应**：
```json
{
  "ok": true,
  "user": {
    "id": "clx...",
    "slug": "testuser",
    "email": "test@example.com",
    "displayName": "Test User"
  }
}
```

---

## 4. 忘记密码 API

### POST /api/user/forgot-password

发送密码重置邮件。

```bash
curl -X POST http://localhost:3000/api/user/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**响应（邮箱已注册）**：
```json
{
  "message": "我们已发送重置密码链接到您的邮箱",
  "emailExists": true
}
```

**响应（邮箱未注册）**：
```json
{
  "message": "该邮箱未注册",
  "emailExists": false
}
```
状态码：`404`

---

## 5. 重置密码 API

### POST /api/user/reset-password

使用 token 重置密码。

```bash
curl -X POST http://localhost:3000/api/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-reset-token-from-email",
    "password": "newpassword123"
  }'
```

**响应**：
```json
{
  "message": "密码重置成功"
}
```

---

## 6. 获取公开页面配置

### GET /api/page/[slug]

获取用户的公开页面配置（无需认证）。

```bash
curl http://localhost:3000/api/page/testuser
```

**响应**：
```json
{
  "slug": "testuser",
  "displayName": "Test User",
  "config": {
    "background": {
      "type": "color",
      "value": "#000000"
    },
    "sections": [
      {
        "id": "hero-1",
        "type": "hero",
        "enabled": true,
        "order": 0,
        "props": {
          "slides": [
            {
              "src": "/hero/nakajima.jpeg",
              "alt": "Hero 1"
            }
          ],
          "title": "Welcome",
          "subtitle": "VTuber Personal Page"
        }
      }
    ],
    "meta": {
      "title": "My VTuber Page",
      "description": "Welcome to my personal page"
    }
  }
}
```

**测试不存在的用户**：
```bash
curl http://localhost:3000/api/page/nonexistent
```
预期响应：`404 Not Found`

---

## 7. 获取草稿配置

### GET /api/page/me

获取当前登录用户的草稿配置（需要认证）。

```bash
curl http://localhost:3000/api/page/me \
  -b cookies.txt
```

**响应**：
```json
{
  "draftConfig": {
    "background": {...},
    "sections": [...],
    "meta": {...}
  }
}
```

---

## 8. 更新草稿配置

### PUT /api/page/me

更新当前登录用户的草稿配置（需要认证）。

```bash
curl -X PUT http://localhost:3000/api/page/me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "draftConfig": {
      "background": {
        "type": "color",
        "value": "#1a1a2e"
      },
      "sections": [
        {
          "id": "hero-1",
          "type": "hero",
          "enabled": true,
          "order": 0,
          "props": {
            "slides": [
              {
                "src": "/hero/nakajima.jpeg",
                "alt": "Hero 1"
              },
              {
                "src": "/hero/2.jpeg",
                "alt": "Hero 2"
              },
              {
                "src": "/hero/3.jpeg",
                "alt": "Hero 3"
              }
            ],
            "title": "My Custom Title",
            "subtitle": "My Custom Subtitle"
          }
        },
        {
          "id": "links-1",
          "type": "links",
          "enabled": true,
          "order": 1,
          "props": {
            "items": [
              {
                "id": "link-1",
                "label": "Twitter",
                "href": "https://twitter.com/example",
                "icon": "🐦"
              }
            ],
            "layout": "grid"
          }
        },
        {
          "id": "gallery-1",
          "type": "gallery",
          "enabled": true,
          "order": 2,
          "props": {
            "items": [],
            "columns": 3,
            "gap": "md"
          }
        }
      ],
      "meta": {
        "title": "My Updated Page",
        "description": "This is my updated page description"
      }
    }
  }'
```

**响应**：
```json
{
  "ok": true,
  "pageConfig": {
    "background": {...},
    "sections": [...],
    "meta": {...}
  }
}
```

**测试无效配置（zod 校验）**：
```bash
curl -X PUT http://localhost:3000/api/page/me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "draftConfig": {
      "background": {
        "type": "color",
        "value": "invalid-color"
      },
      "sections": []
    }
  }'
```
预期响应：`400 Bad Request` 包含验证错误详情

**测试未登录**：
```bash
curl -X PUT http://localhost:3000/api/page/me \
  -H "Content-Type: application/json" \
  -d '{"draftConfig": {...}}'
```
预期响应：`401 Unauthorized`

---

## 9. 发布配置

### POST /api/page/me/publish

将草稿配置复制到发布配置（需要认证）。

```bash
curl -X POST http://localhost:3000/api/page/me/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**响应**：
```json
{
  "ok": true,
  "publishedConfig": {
    "background": {...},
    "sections": [...],
    "meta": {...}
  }
}
```

**验证发布结果**：
发布后，访问公开 API 应该看到更新后的配置：
```bash
curl http://localhost:3000/api/page/testuser
```

或访问页面：
```
http://localhost:3000/u/testuser
```

---

## 10. 图片上传 API

### POST /api/page/me/upload

上传图片到用户专属目录（需要认证）。

```bash
curl -X POST http://localhost:3000/api/page/me/upload \
  -F "file=@/path/to/image.jpg" \
  -b cookies.txt
```

**响应**：
```json
{
  "ok": true,
  "src": "/uploads/testuser/1734701234567-abc123.jpg"
}
```

**文件限制**：
- 只支持图片格式（image/*）
- 最大文件大小：10MB
- 文件保存到：`public/uploads/{userSlug}/`

---

## 完整测试流程示例

```bash
# 1. 注册新用户
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "displayName": "Test User",
    "slug": "testuser"
  }'

# 2. 登录
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt

# 3. 查看当前公开配置
curl http://localhost:3000/api/page/testuser

# 4. 获取草稿配置
curl http://localhost:3000/api/page/me -b cookies.txt

# 5. 更新草稿配置
curl -X PUT http://localhost:3000/api/page/me \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "draftConfig": {
      "background": {"type": "color", "value": "#1a1a2e"},
      "sections": [
        {
          "id": "hero-1",
          "type": "hero",
          "enabled": true,
          "order": 0,
          "props": {
            "slides": [
              {"src": "/hero/nakajima.jpeg", "alt": "Hero 1"}
            ],
            "title": "Updated Title"
          }
        }
      ]
    }
  }'

# 6. 上传图片
curl -X POST http://localhost:3000/api/page/me/upload \
  -F "file=@/path/to/image.jpg" \
  -b cookies.txt

# 7. 发布配置
curl -X POST http://localhost:3000/api/page/me/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 8. 验证公开配置已更新
curl http://localhost:3000/api/page/testuser
```

---

## 注意事项

1. **Cookie 文件**：使用 `-c cookies.txt` 保存 cookie，使用 `-b cookies.txt` 发送 cookie
2. **Content-Type**：PUT 和 POST 请求必须设置 `Content-Type: application/json`（文件上传除外）
3. **Zod 校验**：所有写入的 JSON 配置都会经过 zod 校验，无效配置会被拒绝
4. **权限校验**：PUT 和 POST API 都需要登录，会检查 `session.user.id`
5. **数据隔离**：用户只能修改自己的配置（通过 `userId` 验证）
6. **图片上传**：使用 `multipart/form-data` 格式，字段名为 `file`
