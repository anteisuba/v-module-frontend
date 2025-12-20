# Resend 快速配置指南

## ✅ 你已经完成的步骤

1. ✅ 注册了 Resend 账号
2. ✅ 创建了 API Key: `re_3d1hyQNn_Q5NY5Q2sBh6PrzffbyMpgwZo`

## 🔧 下一步：配置环境变量

### 在 `.env` 文件中添加以下配置

打开项目根目录的 `.env` 文件，添加：

```bash
# Resend API Key（必需）
RESEND_API_KEY=re_3d1hyQNn_Q5NY5Q2sBh6PrzffbyMpgwZo

# 发件人邮箱（可选，默认使用 onboarding@resend.dev）
RESEND_FROM=onboarding@resend.dev
```

**注意**：如果你从 Resend Dashboard 复制了 API Key，确保复制完整，应该以 `re_` 开头。

## 🧪 测试发送邮件

### 1. 启动开发服务器

```bash
pnpm dev
```

### 2. 测试密码重置功能

1. 访问忘记密码页面：
   ```
   http://localhost:3000/admin/forgot-password
   ```

2. 输入你的邮箱地址（例如：`xiuruisu@gmail.com`）

3. 点击"发送重置链接"

4. 检查你的邮箱收件箱，应该会收到密码重置邮件

### 3. 查看控制台输出

在开发环境中，邮件发送成功后，控制台会显示：

```
============================================================
📧 [邮件发送] Resend SDK
============================================================
收件人: xiuruisu@gmail.com
重置链接: http://localhost:3000/admin/reset-password?token=...
============================================================
```

## 🚀 生产环境配置（Vercel）

### 在 Vercel 中添加环境变量

1. 登录 Vercel，进入你的项目
2. 进入 Settings → Environment Variables
3. 添加以下变量：

   ```
   RESEND_API_KEY=re_3d1hyQNn_Q5NY5Q2sBh6PrzffbyMpgwZo
   RESEND_FROM=onboarding@resend.dev
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   ```

4. 选择环境范围：Production、Preview、Development
5. 保存后重新部署

## ✅ 验证配置

如果一切正常，你应该：

1. ✅ 能够发送密码重置邮件
2. ✅ 邮件能够正常收到
3. ✅ 邮件中的重置链接可以正常跳转

## 🔍 常见问题

### Q: 邮件发送失败？

**检查**：
- API Key 是否正确（以 `re_` 开头）
- `.env` 文件是否在项目根目录
- 是否重启了开发服务器（环境变量需要重启才能生效）

### Q: 邮件进入垃圾邮件文件夹？

**解决方案**：
- 首次使用 `onboarding@resend.dev` 可能会进入垃圾邮件
- 建议验证自己的域名（Resend Dashboard → Domains）
- 验证域名后可以使用自己的邮箱（如 `noreply@yourdomain.com`）

### Q: 如何验证域名？

1. 进入 Resend Dashboard → Domains
2. 点击 "Add Domain"
3. 输入你的域名（如 `yourdomain.com`）
4. 配置 DNS 记录（SPF、DKIM）
5. 验证通过后，将 `RESEND_FROM` 改为 `noreply@yourdomain.com`

## 📚 更多信息

- [Resend 文档](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/emails)
- 查看发送统计和分析

