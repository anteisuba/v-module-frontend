# API 测试示例

## 前置条件

1. 确保开发服务器运行：`pnpm dev`
2. 确保数据库已初始化并运行 seed：`pnpm db:seed`
3. 测试用户信息：
   - Email: `test@example.com`
   - Password: `123456`
   - Slug: `testuser`

---

## 1. GET /api/page/[slug] - 公开 API（无需认证）

获取用户的公开页面配置。

### 请求示例

```bash
curl http://localhost:3000/api/page/testuser
```

### 预期响应

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
          "slides": [...],
          "title": "Welcome",
          "subtitle": "VTuber Personal Page"
        }
      },
      ...
    ],
    "meta": {
      "title": "My VTuber Page",
      "description": "Welcome to my personal page"
    }
  }
}
```

### 测试不存在的用户

```bash
curl http://localhost:3000/api/page/nonexistent
```

预期响应：`404 Not Found`

---

## 2. PUT /api/page/me - 更新草稿配置（需要认证）

更新当前登录用户的草稿配置。

### 步骤 1：先登录获取 session cookie

```bash
# 登录并保存 cookie
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt
```

预期响应：

```json
{ "ok": true }
```

### 步骤 2：更新草稿配置

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
              },
              {
                "id": "link-2",
                "label": "GitHub",
                "href": "https://github.com/example",
                "icon": "💻"
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

预期响应：

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

### 测试无效配置（zod 校验）

```bash
# 测试无效的背景颜色格式
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

### 测试未登录

```bash
curl -X PUT http://localhost:3000/api/page/me \
  -H "Content-Type: application/json" \
  -d '{"draftConfig": {...}}'
```

预期响应：`401 Unauthorized`

---

## 3. POST /api/page/me/publish - 发布配置（需要认证）

将草稿配置复制到发布配置。

### 请求示例

```bash
curl -X POST http://localhost:3000/api/page/me/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

预期响应：

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

### 验证发布结果

发布后，访问公开 API 应该看到更新后的配置：

```bash
curl http://localhost:3000/api/page/testuser
```

或者访问页面：

```
http://localhost:3000/u/testuser
```

### 测试没有草稿配置的情况

如果用户没有草稿配置：

```bash
# 创建一个新用户（没有 page 记录）
# 然后尝试发布
curl -X POST http://localhost:3000/api/page/me/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

预期响应：`400 Bad Request` - "No draft config found"

### 测试未登录

```bash
curl -X POST http://localhost:3000/api/page/me/publish
```

预期响应：`401 Unauthorized`

---

## 完整测试流程示例

```bash
# 1. 登录
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  -c cookies.txt

# 2. 查看当前公开配置
curl http://localhost:3000/api/page/testuser

# 3. 更新草稿配置
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

# 4. 发布配置
curl -X POST http://localhost:3000/api/page/me/publish \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 5. 验证公开配置已更新
curl http://localhost:3000/api/page/testuser
```

---

## 注意事项

1. **Cookie 文件**：使用 `-c cookies.txt` 保存 cookie，使用 `-b cookies.txt` 发送 cookie
2. **Content-Type**：PUT 和 POST 请求必须设置 `Content-Type: application/json`
3. **Zod 校验**：所有写入的 JSON 配置都会经过 zod 校验，无效配置会被拒绝
4. **权限校验**：PUT 和 POST API 都需要登录，会检查 `session.user.id`
5. **数据隔离**：用户只能修改自己的配置（通过 `userId` 验证）
