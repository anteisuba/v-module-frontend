# Cloudflare R2 存储配置指南

本指南将帮助你配置 Cloudflare R2 存储服务，用于在生产环境中存储用户上传的图片。

## 为什么选择 Cloudflare R2？

- ✅ **免费额度大**：10GB 存储空间，1000 万次读取/月
- ✅ **无出口费用**：与其他云存储不同，R2 不收取数据传输费用
- ✅ **S3 兼容**：可以使用标准的 AWS S3 SDK
- ✅ **全球 CDN**：自动使用 Cloudflare 的全球网络

## 配置步骤

### 1. 创建 R2 Bucket

**方法 1：通过左侧菜单**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在左侧菜单找到 **Build** 部分（如果没有展开，点击展开）
3. 点击 **Storage & databases**（存储和数据库）
4. 在下拉菜单中选择 **R2**

**方法 2：直接访问 R2 页面**

1. 直接访问：https://dash.cloudflare.com/?to=/:account/r2
2. 或者点击左侧菜单的 **Workers & Pages**，然后选择 **R2**

**如果看不到 R2 选项：**

- 确保你登录的是正确的账户
- 可能需要先启用 R2 功能（R2 通常对所有账户可用）
- 使用顶部搜索框（⌘K 或 Ctrl+K）搜索 "R2"

**创建 Bucket：**

1. 进入 R2 页面后，点击 **Create bucket** 按钮
2. 输入 bucket 名称（例如：`vtuber-site-uploads`）
   - 名称必须是全局唯一的
   - 只能包含小写字母、数字和连字符
3. 选择区域（推荐选择离你用户最近的区域，例如 `APAC` 或 `WNAM`）
4. 点击 **Create bucket**

### 2. 创建 R2 API Token

**重要：R2 的 API Token 需要在 R2 页面内创建，不是在账户设置的 API Tokens 页面。**

1. **返回 R2 页面**：

   - 如果当前在账户 API Tokens 页面，需要先返回到 R2 页面
   - 在左侧菜单：**Build** → **Storage & databases** → **R2**
   - 或者直接访问：`https://dash.cloudflare.com/?to=/:account/r2`

2. **进入 API Tokens 管理**：

   - 在 R2 页面顶部，找到 **Manage R2 API Tokens** 按钮（通常在右上角或页面顶部导航栏）
   - 点击后会打开 R2 API Tokens 管理页面

3. **选择 Token 类型**：

   - **推荐：Account API Tokens**（账户 API Tokens）
     - 更适合生产环境（recommended for production systems）
     - 即使离开组织也保持活跃
     - 点击 **Create Account API token** 按钮
   - **或者：User API Tokens**（用户 API Tokens）
     - 仅适合个人开发或临时使用
     - 如果离开组织会失效
     - 点击 **Create User API token** 按钮

4. **填写 Token 配置表单**：

   - **Token name**: 输入一个描述性名称（例如：`vtuber-site-upload-token`）
   - **Permissions**: 选择 **Object Read & Write**（读写权限）
   - **TTL**（可选）: 可以留空表示永久有效，或设置过期时间
   - **Bucket access**:
     - 选择 **Specific bucket**
     - 在下拉菜单中选择你刚创建的 bucket（例如：`vtuber-site-uploads`）
   - **Admin permissions**（可选）: 通常不需要，保持默认即可
   - 点击 **Create API Token** 按钮

5. **保存凭证信息**（非常重要）：

   - 创建成功后，会显示以下信息（**这些信息只会显示一次，请立即保存**）：
     - **Access Key ID**：类似 `a1b2c3d4e5f6g7h8i9j0`
     - **Secret Access Key**：类似 `xYz123AbC456DeF789GhI012JkL345MnO`
   - **立即复制并保存这些信息**到安全的地方（文本文件或密码管理器）
   - 关闭页面后，Secret Access Key 将无法再次查看

6. **获取 Account ID**：
   - Account ID 在 Cloudflare Dashboard 的右侧边栏可以找到
   - 或者在 R2 页面的 URL 中可以看到（URL 格式：`/accounts/{account-id}/r2`）
   - Account ID 格式类似：`9612b02a044205fbf51978e285bcb0ae`

### 3. 配置公共访问（可选但推荐）

为了能够通过 URL 直接访问上传的图片，需要配置公共访问。有两种方式：

**方式 1：启用 Public Development URL（开发/测试推荐）**

1. 在 R2 页面，点击你的 bucket 名称（例如：`vtuber-site-uploads`）
2. 进入 **Settings** 标签
3. 在左侧菜单找到 **Public Development URL**
4. 点击 **Enable** 按钮
5. 启用后，会显示一个公共 URL，格式类似：`https://pub-{随机字符}.r2.dev`
6. 复制这个 URL，稍后需要配置到环境变量 `R2_PUBLIC_URL`

**方式 2：配置 Custom Domain（生产环境推荐）**

1. 在 Settings 标签页，左侧菜单找到 **Custom Domains**
2. 点击 **+ Add** 按钮
3. 输入你的自定义域名（例如：`r2.avatar-hub.com`）
4. 按照提示配置 DNS 记录（需要添加 CNAME 记录）
5. 配置完成后，使用自定义域名作为 `R2_PUBLIC_URL`

**建议：**

- 开发/测试环境：使用 **Public Development URL**（简单快速）
- 生产环境：使用 **Custom Domain**（更专业，可以自定义域名）

**注意：** 如果使用 Public Development URL，记得将 URL 配置到环境变量 `R2_PUBLIC_URL` 中。

### 4. 配置环境变量

在 Vercel Dashboard 中配置以下环境变量：

1. 进入你的 Vercel 项目
2. 点击 **Settings** -> **Environment Variables**
3. 添加以下变量：

```
R2_ACCOUNT_ID=你的Account ID
R2_ACCESS_KEY_ID=你的Access Key ID
R2_SECRET_ACCESS_KEY=你的Secret Access Key
R2_BUCKET_NAME=你的bucket名称（例如：vtuber-site-uploads）
```

可选（如果启用了公共访问）：

```
R2_PUBLIC_URL=你的公共URL
```

**R2_PUBLIC_URL 的值：**

- 如果启用了 **Public Development URL**：使用启用后显示的 URL（例如：`https://pub-abc123.r2.dev`）
- 如果配置了 **Custom Domain**：使用你的自定义域名（例如：`https://r2.avatar-hub.com`）
- 如果未配置：代码会自动使用默认格式的 URL

4. 确保这些变量在 **Production** 环境中可用
5. 点击 **Save**
6. 重新部署应用使环境变量生效

### 5. 本地开发（可选）

如果你想在本地也使用 R2（而不是本地文件系统），可以在 `.env` 文件中添加上述环境变量。

## 验证配置

1. 部署应用后，尝试上传一张图片
2. 检查图片是否能正常显示
3. 图片 URL 格式：
   - 如果配置了 `R2_PUBLIC_URL`：`{R2_PUBLIC_URL}/uploads/{user-slug}/{filename}`
   - 如果未配置 `R2_PUBLIC_URL`：代码会自动生成 URL，但需要确保已启用 Public Development URL 或配置了 Custom Domain

## 费用说明

- **存储**：前 10GB 免费
- **读取操作**：前 1000 万次/月免费
- **写入操作**：前 100 万次/月免费
- **数据传输**：完全免费（无出口费用）

对于个人项目或小型项目，通常完全免费。

## 故障排查

### 上传失败

1. 检查环境变量是否正确配置
2. 检查 API Token 权限是否正确（需要 Object Read & Write）
3. 检查 bucket 名称是否正确
4. 查看 Vercel 函数日志中的错误信息

### 图片无法访问

1. 确认已配置公共访问
2. 检查 `R2_PUBLIC_URL` 是否正确（如果使用自定义域名）
3. 检查图片 URL 格式是否正确

### 权限错误

1. 确认 API Token 有对应 bucket 的访问权限
2. 确认 API Token 未过期
3. 重新创建 API Token 并更新环境变量

## 更多信息

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [R2 定价](https://developers.cloudflare.com/r2/pricing/)
