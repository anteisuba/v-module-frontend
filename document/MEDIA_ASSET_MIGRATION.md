# MediaAsset 表扩展迁移说明

## 概述

扩展 `MediaAsset` 表以支持普通用户（User），实现 S3/R2 存储与数据库的联动。

## 变更内容

### Schema 变更

1. **MediaAsset 表扩展**：
   - `adminUserId` 改为可选（`String?`）
   - 新增 `userId` 字段（可选，`String?`）
   - 新增 `user` 关系，关联到 `User` 表
   - 新增索引：`@@index([userId, createdAt])`

2. **User 表扩展**：
   - 新增 `mediaAssets` 关系，关联到 `MediaAsset` 表

## 迁移步骤

1. **生成迁移**：
   ```bash
   npx prisma migrate dev --name add_user_media_asset
   ```

2. **应用迁移**：
   ```bash
   npx prisma migrate deploy
   ```

3. **生成 Prisma Client**：
   ```bash
   npx prisma generate
   ```

## 功能说明

### S3 和数据库联动

当用户上传图片时：

1. **上传到 S3/R2**：
   - 图片文件上传到 Cloudflare R2（生产环境）
   - 或保存到本地文件系统（开发环境）
   - 返回公开访问的 URL

2. **记录到数据库**：
   - 自动在 `MediaAsset` 表中创建记录
   - 存储图片 URL、文件类型、大小等信息
   - 关联到对应的用户（`userId`）

3. **数据关联**：
   - 图片 URL 存储在 `PageConfig` 的 JSON 字段中（用于页面配置）
   - 图片元数据存储在 `MediaAsset` 表中（用于管理和查询）

### 使用场景

- **图片管理**：查询用户上传的所有图片
- **存储统计**：统计用户使用的存储空间
- **图片清理**：删除未使用的图片
- **审计追踪**：记录图片上传历史

## 注意事项

- 如果 `MediaAsset` 创建失败，不会影响图片上传流程（只记录警告）
- 图片 URL 同时存储在配置 JSON 和 `MediaAsset` 表中
- 删除用户时，关联的 `MediaAsset` 记录会自动删除（CASCADE）

