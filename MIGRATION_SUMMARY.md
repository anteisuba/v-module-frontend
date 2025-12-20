# 项目结构迁移总结

## ✅ 迁移完成状态

所有文件已成功迁移到 Feature-Sliced Design 结构。

## 📁 新目录结构

```
vtuber-site/
├── app/                          # 路由层（页面组合）
│   ├── page.tsx                  ✅ 已更新 import
│   ├── admin/
│   │   ├── page.tsx              ✅ 已更新 import
│   │   ├── register/page.tsx     ✅ 已更新 import
│   │   └── cms/page.tsx          (保持不变)
│   └── api/                      # API路由（保持原位置）
│
├── features/                      # 功能域（新增）
│   ├── home-hero/                ✅ Hero功能域
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HeroBackground.tsx
│   │   │   ├── HeroHeader.tsx
│   │   │   ├── HeroMenu.tsx
│   │   │   └── HeroThumbStrip.tsx
│   │   ├── hooks/
│   │   │   ├── useHeroSlides.ts
│   │   │   └── useHeroMenu.ts
│   │   ├── HomeHero.tsx
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── index.ts              ✅ 对外接口
│   │
│   └── admin-auth/                ✅ Admin认证功能域
│       ├── components/
│       │   ├── AdminAuthPanel.tsx
│       │   └── RegisterPanel.tsx
│       └── index.ts               ✅ 对外接口
│
├── domain/                        # 业务领域层（新增）
│   └── hero/
│       ├── types.ts               ✅ HeroSlideDB类型
│       ├── constants.ts           ✅ DEFAULT_HERO_SLIDES
│       ├── services.ts            ✅ 业务逻辑函数
│       └── index.ts               ✅ 统一导出
│
├── lib/                           # 工具层
│   ├── hooks/                     # 通用hooks（新增）
│   │   └── useStickyProgress.ts   ✅ 从components迁移
│   ├── prisma.ts
│   ├── session.ts
│   ├── fileUtils.ts
│   └── siteConfig.ts              ✅ 兼容层（重导出domain/hero）
│
└── components/                     # 旧目录（保留，待测试后删除）
    ├── home/                      ⚠️ 已迁移，可删除
    └── login/                     ⚠️ 已迁移，可删除
```

## 🔄 已更新的 Import 路径

### App 路由层

- `app/page.tsx`: `@/components/home/HomeHero` → `@/features/home-hero`
- `app/admin/page.tsx`: `@/components/login/AdminAuthPanel` → `@/features/admin-auth`
- `app/admin/register/page.tsx`: `@/components/login/RegisterPanel` → `@/features/admin-auth`

### Features 内部

- `features/home-hero/HomeHero.tsx`: `@/lib/siteConfig` → `@/domain/hero`
- `features/home-hero/components/HeroSection.tsx`:
  - `./hero/hooks/useStickyProgress` → `@/lib/hooks/useStickyProgress`
  - 所有相对路径已更新为绝对路径
- `features/home-hero/hooks/useHeroSlides.ts`: 类型从 `types.ts` 导入
- `features/home-hero/components/HeroThumbStrip.tsx`: 类型从 `types.ts` 导入

## 📝 关键变更

### 1. Domain 层分离

- ✅ `HeroSlideDB` 类型 → `domain/hero/types.ts`
- ✅ `DEFAULT_HERO_SLIDES` 常量 → `domain/hero/constants.ts`
- ✅ 业务逻辑函数 → `domain/hero/services.ts`
- ✅ `lib/siteConfig.ts` 保留为兼容层（重导出）

### 2. 通用 Hook 迁移

- ✅ `useStickyProgress` → `lib/hooks/useStickyProgress.ts`
- ✅ 所有引用已更新为 `@/lib/hooks/useStickyProgress`

### 3. Hero 功能内聚

- ✅ 所有 Hero 组件 → `features/home-hero/components/`
- ✅ Hero hooks → `features/home-hero/hooks/`
- ✅ Hero 类型 → `features/home-hero/types.ts`
- ✅ Hero 常量 → `features/home-hero/constants.ts`
- ✅ 通过 `index.ts` 控制对外接口

### 4. Admin 功能内聚

- ✅ Admin 组件 → `features/admin-auth/components/`
- ✅ 通过 `index.ts` 控制对外接口

## ⚠️ 注意事项

### 旧目录保留

- `components/home/` 和 `components/login/` 目录已保留
- 这些目录中的文件已不再被使用
- **建议**：测试通过后删除这些目录

### API 路由位置

- API 路由保持在 `app/api/` 下（Next.js 要求）
- 未来如需关联，可通过注释或文档说明

### 兼容层

- `lib/siteConfig.ts` 保留为兼容层，重导出 `domain/hero`
- 如果确认没有其他地方使用，可以删除

## 🧪 测试检查清单

### 功能测试

- [ ] 首页 Hero 区域正常显示
- [ ] Hero 轮播功能正常
- [ ] Hero 菜单功能正常
- [ ] 登录页面正常显示
- [ ] 注册页面正常显示
- [ ] CMS 页面正常显示
- [ ] 上传 Hero 图片功能正常
- [ ] 删除 Hero 图片功能正常

### Import 检查

- [ ] 所有页面正常加载（无 import 错误）
- [ ] 所有组件正常渲染
- [ ] 所有 hooks 正常工作
- [ ] TypeScript 编译无错误

### 构建测试

- [ ] `pnpm build` 成功
- [ ] `pnpm dev` 启动正常
- [ ] 无 linter 错误

## 🗑️ 清理步骤（测试通过后）

1. 删除旧目录：

   ```bash
   rm -rf components/home
   rm -rf components/login
   ```

2. 删除兼容层（可选）：

   ```bash
   # 如果确认没有其他地方使用 lib/siteConfig
   # 可以删除 lib/siteConfig.ts
   ```

3. 更新文档：
   - 更新 README.md 中的目录结构说明
   - 更新开发规范文档

## 📚 后续建议

1. **新增功能时**：

   - 在 `features/` 下创建新的功能域
   - 遵循相同的目录结构规范
   - 通过 `index.ts` 控制对外接口

2. **通用组件**：

   - 未来可复用的 UI 组件放在 `components/ui/`
   - 通用 hooks 放在 `lib/hooks/`

3. **类型管理**：
   - Domain 类型放在 `domain/[domain]/types.ts`
   - Feature 类型放在 `features/[feature]/types.ts`

## ✅ 迁移完成

所有文件已成功迁移，import 路径已更新。请进行功能测试，确认无误后可删除旧目录。
