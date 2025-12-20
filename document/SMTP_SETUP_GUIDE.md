# SMTP 配置指南

## 📋 概述

本项目使用 `nodemailer` 发送邮件，支持多种 SMTP 服务。本文档介绍如何配置不同的 SMTP 服务来发送密码重置邮件。

## 🚀 推荐的 SMTP 服务

### 1. Resend（推荐首选）⭐

**优点**：
- ✅ 专为开发者设计，API 清晰简洁
- ✅ 免费层：3000 封/月
- ✅ 配置最简单
- ✅ 优秀的文档和开发者体验
- ✅ 无需验证域名即可开始（但有发送限制）

**免费层限制**：
- 3000 封/月
- 每天最多 100 封（新账号可能更少）

**配置步骤**：

1. **注册账号**
   - 访问 https://resend.com
   - 注册账号并验证邮箱

2. **获取 API Key**
   - 登录后进入 Dashboard
   - 点击 "API Keys" → "Create API Key"
   - 输入名称（如 "vtuber-site"）
   - 复制生成的 API Key（只显示一次）

3. **配置环境变量**

   在 `.env` 文件中添加：

   ```bash
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASSWORD=re_你的API_KEY_这里
   SMTP_FROM=noreply@resend.dev
   ```

   **注意**：
   - `SMTP_USER` 固定为 `resend`
   - `SMTP_PASSWORD` 是你的 API Key（以 `re_` 开头）
   - `SMTP_FROM` 可以先用 `noreply@resend.dev`（Resend 提供的测试域名）

4. **验证域名（可选，生产环境推荐）**

   - 如果想使用自己的域名（如 `noreply@yourdomain.com`）
   - 在 Resend Dashboard → Domains 添加域名
   - 配置 DNS 记录（SPF、DKIM）
   - 验证通过后，将 `SMTP_FROM` 改为你的域名邮箱

---

### 2. SendGrid

**优点**：
- ✅ 成熟稳定，业界标准
- ✅ 免费层：100 封/天
- ✅ 良好的送达率
- ✅ 丰富的分析和监控功能

**免费层限制**：
- 100 封/天
- 需要验证身份

**配置步骤**：

1. **注册账号**
   - 访问 https://sendgrid.com
   - 注册账号并验证邮箱
   - 完成身份验证（可能需要提供手机号）

2. **创建 API Key**
   - 登录后进入 Settings → API Keys
   - 点击 "Create API Key"
   - 输入名称（如 "vtuber-site"）
   - 权限选择 "Full Access" 或 "Mail Send"
   - 复制生成的 API Key（只显示一次）

3. **配置环境变量**

   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.你的API_KEY_这里
   SMTP_FROM=noreply@yourdomain.com
   ```

   **注意**：
   - `SMTP_USER` 固定为 `apikey`
   - `SMTP_PASSWORD` 是你的 API Key（以 `SG.` 开头）
   - `SMTP_FROM` 需要使用已验证的发件人邮箱

4. **验证发件人邮箱**

   - 进入 Settings → Sender Authentication
   - 选择 "Single Sender Verification"
   - 添加并验证你的邮箱地址
   - 验证通过后，使用该邮箱作为 `SMTP_FROM`

---

### 3. Brevo (原 Sendinblue)

**优点**：
- ✅ 免费层：300 封/天
- ✅ 界面友好
- ✅ 支持 SMTP 和 API

**免费层限制**：
- 300 封/天
- 需要验证邮箱

**配置步骤**：

1. **注册账号**
   - 访问 https://www.brevo.com
   - 注册账号并验证邮箱

2. **获取 SMTP 密码**
   - 登录后进入 Settings → SMTP & API
   - 找到 "SMTP" 部分
   - 如果还没有 SMTP 密码，点击 "Generate" 生成
   - 复制 SMTP Server、Port、Login、Password

3. **配置环境变量**

   ```bash
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=你的登录邮箱
   SMTP_PASSWORD=你的SMTP密码
   SMTP_FROM=noreply@yourdomain.com
   ```

   **注意**：
   - `SMTP_USER` 是你的 Brevo 登录邮箱
   - `SMTP_PASSWORD` 是 SMTP 密码（不是登录密码）
   - `SMTP_FROM` 可以使用已验证的邮箱

---

### 4. AWS SES

**优点**：
- ✅ 成本极低（$0.10/1000 封）
- ✅ 与 AWS RDS 集成方便
- ✅ 高可靠性和送达率

**缺点**：
- ⚠️ 初始配置较复杂
- ⚠️ 新账号在沙盒模式（只能发送给已验证的邮箱）

**配置步骤**：

1. **创建 AWS 账号**（如果还没有）

2. **进入 SES 服务**
   - 登录 AWS Console
   - 进入 Simple Email Service (SES)

3. **验证邮箱或域名**
   - 如果使用单个邮箱：Email Addresses → Verify a New Email Address
   - 如果使用域名：Domains → Verify a New Domain（推荐生产环境）

4. **创建 SMTP 凭证**
   - 进入 SMTP Settings
   - 点击 "Create SMTP Credentials"
   - 输入 IAM 用户名（如 "ses-smtp-user"）
   - 下载或复制 SMTP 用户名和密码

5. **配置环境变量**

   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=你的SMTP用户名
   SMTP_PASSWORD=你的SMTP密码
   SMTP_FROM=verified-email@yourdomain.com
   ```

   **注意**：
   - `SMTP_HOST` 根据你的 AWS 区域不同而不同（如 `email-smtp.us-east-1.amazonaws.com`）
   - `SMTP_FROM` 必须使用已验证的邮箱或域名下的邮箱

6. **申请移出沙盒模式**（生产环境必需）

   - 新账号默认在沙盒模式，只能发送给已验证的邮箱
   - 申请移出沙盒模式需要提交使用案例
   - 进入 Account dashboard → Request production access

---

### 5. Gmail SMTP（仅开发环境，不推荐生产）

**优点**：
- ✅ 免费，已有 Gmail 账号即可使用

**缺点**：
- ⚠️ 每日发送限制（约 500 封/天）
- ⚠️ 需要应用专用密码
- ⚠️ 不推荐用于生产环境

**配置步骤**：

1. **启用两步验证**
   - Google 账号 → 安全性 → 两步验证

2. **生成应用专用密码**
   - Google 账号 → 安全性 → 应用专用密码
   - 选择应用：邮件
   - 选择设备：其他（自定义名称）
   - 复制生成的 16 位密码

3. **配置环境变量**

   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=你的16位应用专用密码
   SMTP_FROM=your-email@gmail.com
   ```

---

## 🔧 本地测试配置

### 开发环境（不需要真实发送邮件）

在开发环境中，如果没有配置 SMTP，邮件内容会自动输出到控制台：

```bash
# .env 文件可以省略 SMTP 配置
# 邮件内容会显示在控制台
```

### 测试 SMTP 配置

1. **配置环境变量**

   在 `.env` 文件中添加 SMTP 配置（选择一个服务）

2. **测试发送**

   ```bash
   # 启动开发服务器
   pnpm dev

   # 访问忘记密码页面
   http://localhost:3000/admin/forgot-password

   # 输入测试邮箱，点击发送
   # 检查邮箱收件箱（或控制台输出）
   ```

3. **查看日志**

   - 如果配置正确，邮件会发送成功
   - 如果配置错误，会显示错误信息
   - 开发环境下，邮件内容也会输出到控制台

---

## 🚀 生产环境配置（Vercel）

### 在 Vercel 中配置环境变量

1. **进入 Vercel 项目设置**
   - 登录 Vercel
   - 选择你的项目
   - 进入 Settings → Environment Variables

2. **添加环境变量**

   添加以下变量（根据你选择的 SMTP 服务填写）：

   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASSWORD=re_你的API_KEY
   SMTP_FROM=noreply@resend.dev
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   ```

3. **环境范围**

   选择环境范围：
   - Production：生产环境
   - Preview：预览环境（PR、分支部署）
   - Development：开发环境

   建议：Production 和 Preview 都添加

4. **重新部署**

   - 添加环境变量后，Vercel 会自动触发重新部署
   - 或手动触发：Deployments → Redeploy

---

## ✅ 验证邮件发送

### 测试步骤

1. **访问忘记密码页面**
   ```
   https://your-app.vercel.app/admin/forgot-password
   ```

2. **输入测试邮箱**
   - 输入一个真实可用的邮箱地址
   - 点击"发送重置链接"

3. **检查邮箱**
   - 检查收件箱（包括垃圾邮件文件夹）
   - 应该收到密码重置邮件
   - 点击邮件中的链接应该可以跳转到重置密码页面

### 常见问题排查

#### 问题 1：邮件发送失败

**检查清单**：
- [ ] 环境变量是否都正确设置
- [ ] SMTP_HOST、PORT、USER、PASSWORD 是否正确
- [ ] SMTP_FROM 邮箱是否已验证（某些服务要求）
- [ ] 查看 Vercel 日志中的错误信息

#### 问题 2：邮件进入垃圾邮件文件夹

**解决方案**：
- 配置 SPF、DKIM DNS 记录
- 使用自己的域名发送邮件
- 避免使用 "noreply" 等常见前缀
- 邮件内容避免触发垃圾邮件关键词

#### 问题 3：SendGrid 发送失败

**可能原因**：
- API Key 权限不足
- 发件人邮箱未验证
- 达到每日发送限制

**解决**：
- 检查 API Key 权限（需要 Mail Send 权限）
- 验证发件人邮箱
- 检查发送统计

#### 问题 4：AWS SES 发送失败

**可能原因**：
- 账号仍在沙盒模式（只能发送给已验证的邮箱）
- 发件人邮箱未验证
- SMTP 凭证错误

**解决**：
- 检查收件人邮箱是否已验证
- 申请移出沙盒模式
- 验证发件人邮箱或域名

---

## 📊 各服务对比

| 服务 | 免费层 | 配置难度 | 送达率 | 推荐场景 |
|------|--------|----------|--------|----------|
| **Resend** | 3000/月 | ⭐ 最简单 | ⭐⭐⭐⭐ | 推荐首选，适合大多数项目 |
| **SendGrid** | 100/天 | ⭐⭐ 简单 | ⭐⭐⭐⭐⭐ | 需要高送达率和分析功能 |
| **Brevo** | 300/天 | ⭐⭐ 简单 | ⭐⭐⭐⭐ | 免费层额度较高 |
| **AWS SES** | 需申请 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ | 已有 AWS 基础设施 |
| **Gmail** | 500/天 | ⭐⭐ 简单 | ⭐⭐ | 仅开发环境 |

---

## 🎯 推荐方案

### 开发环境
- 不需要配置 SMTP，邮件会自动输出到控制台

### 生产环境（小型项目）
- **首选：Resend**
  - 配置最简单
  - 免费层足够
  - 开发者体验好

### 生产环境（中大型项目）
- **首选：SendGrid 或 AWS SES**
  - SendGrid：如果重视分析和监控
  - AWS SES：如果已有 AWS 基础设施，成本更低

---

## 📚 参考资源

- [Resend 文档](https://resend.com/docs)
- [SendGrid 文档](https://docs.sendgrid.com/)
- [Brevo 文档](https://developers.brevo.com/)
- [AWS SES 文档](https://docs.aws.amazon.com/ses/)
- [Nodemailer 文档](https://nodemailer.com/about/)

---

## 🔒 安全建议

1. **API Key 安全**
   - 不要在代码中硬编码 API Key
   - 使用环境变量存储
   - 定期轮换 API Key
   - 不要将 API Key 提交到 Git

2. **邮箱验证**
   - 生产环境使用已验证的域名
   - 配置 SPF、DKIM DNS 记录
   - 提高邮件送达率

3. **速率限制**
   - 代码中已实现 15 分钟速率限制
   - 避免被标记为垃圾邮件发送者

