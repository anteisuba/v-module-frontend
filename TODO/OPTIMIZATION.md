# 代码质量与架构优化

> 最后更新：2026-03-14
> 持续改进项，不阻断功能开发但长期影响维护成本

---

## 1. 架构优化

### 1.1 领域层统一
- [ ] 部分 API route handler 直接使用 Prisma，未经过 `domain/*` 服务 → 统一走 domain 层
- [ ] `components/ui/` 混合通用控件和业务编辑器 → 拆分为 `ui/` 和 `editors/`
- [ ] `features/` 与 `domain/` 边界不够清晰 → 明确 features 只做 UI 渲染，domain 只做业务逻辑

### 1.2 类型与校验
- [ ] 统一所有 API 返回值的序列化处理（`Decimal` → `string`，`Date` → ISO string，`Json` → typed）
- [ ] 补充缺失的 Zod schema（目前仅部分 API 有输入校验）
- [ ] 页面配置 section 类型与渲染器注册表的一致性校验自动化

### 1.3 Error Handling
- [ ] API 错误码和消息格式统一（当前部分返回 `{ error }` 部分返回 `{ message }`）
- [ ] 全局错误边界覆盖后台和公开页
- [ ] 网络错误重试和断连恢复策略

---

## 2. 性能优化

### 2.1 数据库
- [ ] 审查常用查询的索引覆盖
- [ ] N+1 查询检测与修复
- [ ] 大列表查询添加分页参数限制
- [ ] Prisma 查询选择字段（`select` / `include` 精确化）

### 2.2 前端
- [ ] 确认 Next.js 页面的缓存策略（SSR / ISR / SSG）
- [ ] 组件级别的代码拆分（`dynamic import`）
- [ ] 图片格式标准化（WebP / AVIF）
- [ ] Bundle 分析与体积优化

---

## 3. 代码质量

### 3.1 代码规范
- [ ] 守住 lint 全绿基线，添加 pre-commit hook
- [ ] 统一文件命名约定（目前 PascalCase 和 camelCase 混用）
- [ ] 补充关键函数/模块的 JSDoc 注释
- [ ] 移除未使用的依赖和死代码

### 3.2 安全
- [ ] 依赖项安全审计（`pnpm audit`）
- [ ] 确认所有环境变量在生产环境的安全配置
- [ ] API 路由 rate limiting 覆盖检查
- [ ] XSS / CSRF 防护审查（特别是用户生成内容）

---

## 4. 文档维护

- [ ] 中文 `docs/zh-CN/` 是 canonical，确保日文 `docs/ja/` 镜像同步
- [ ] 保持 `current-status.md` 与实际能力同步
- [ ] 新增模块时同步更新 `module-map.md`
- [ ] API 文档自动生成（考虑引入 OpenAPI / Swagger）

---

## 5. 部署与基础设施

### 5.1 当前已知
- [ ] 保持 `NEXT_PUBLIC_BASE_URL` 指向公网 HTTPS 地址
- [ ] R2 / Stripe 配置在部署环境中的健康检查
- [ ] 数据库迁移脚本在生产环境的执行策略

### 5.2 增强
- [ ] 配置 staging 环境
- [ ] 数据库备份策略
- [ ] 环境变量管理（考虑 Vercel Environment Variables 或 Vault）
- [ ] CDN 配置与缓存策略
