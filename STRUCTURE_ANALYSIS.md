# 项目结构优化分析报告

## A. 当前目录树与标注

```
vtuber-site/
├── app/                                    【页面级组件 + 路由】
│   ├── page.tsx                            → 页面级组件（首页）
│   ├── layout.tsx                          → 页面级组件（根布局）
│   ├── admin/
│   │   ├── page.tsx                        → 页面级组件（登录页）
│   │   ├── register/page.tsx               → 页面级组件（注册页）
│   │   └── cms/page.tsx                    → 页面级组件（CMS管理页）
│   └── api/                                【API 路由层】
│       └── admin/
│           ├── login/route.ts              → API 路由
│           ├── register/route.ts           → API 路由
│           ├── me/route.ts                 → API 路由
│           └── hero/
│               ├── slides/route.ts         → API 路由
│               ├── upload/route.ts          → API 路由
│               └── slide/route.ts           → API 路由
│
├── components/                             【组件层 - 当前混乱】
│   ├── home/                               → 功能级组件（首页相关）
│   │   ├── HomeHero.tsx                    → 页面级组件（服务端，组合层）
│   │   ├── HeroSection.tsx                → 功能级组件（客户端，Hero主组件）
│   │   └── hero/                           → 功能级组件（Hero子组件）
│   │       ├── components/                 → 通用UI组件（但只在Hero用）
│   │       │   ├── HeroBackground.tsx      → 功能级组件（Hero专用）
│   │       │   ├── HeroHeader.tsx          → 功能级组件（Hero专用）
│   │       │   ├── HeroMenu.tsx            → 功能级组件（Hero专用）
│   │       │   └── HeroThumbStrip.tsx      → 功能级组件（Hero专用）
│   │       └── hooks/                      → 功能级hooks（Hero专用）
│   │           ├── useHeroSlides.ts        → 功能级hook（Hero专用，但导出类型）
│   │           ├── useStickyProgress.ts    → 通用hook（可复用，但放错位置）
│   │           └── useHeroMenu.ts         → 功能级hook（Hero专用）
│   └── login/                              → 功能级组件（登录相关）
│       ├── AdminAuthPanel.tsx              → 功能级组件（登录表单）
│       └── RegisterPanel.tsx               → 功能级组件（注册表单）
│
├── lib/                                     【工具层 - 混合】
│   ├── prisma.ts                           → 工具函数（DB客户端）
│   ├── session.ts                           → 工具函数（Session管理）
│   ├── fileUtils.ts                        → 工具函数（文件操作）
│   └── siteConfig.ts                       → Domain层（业务逻辑+类型+常量）
│       ├── HeroSlideDB (type)              → Domain类型
│       ├── DEFAULT_HERO_SLIDES (const)     → Domain常量
│       ├── normalizeSlides()               → Domain函数
│       ├── fillSlidesWithDefaults()        → Domain函数
│       └── getPublicHeroSlides()            → Domain函数
│
└── prisma/                                  【数据层】
    └── schema.prisma                        → Domain模型（数据库Schema）
```

### 标注说明

- **页面级组件**：直接用于 `app/` 路由的组件，负责组合和布局
- **功能级组件**：属于特定功能域（如 Hero、Login），不能跨域复用
- **通用 UI 组件**：理论上可复用，但当前没有真正的通用组件
- **hooks**：分为通用 hooks（可跨功能复用）和功能级 hooks（仅限特定功能）
- **domain/model**：业务类型、常量、业务逻辑函数、数据模型

---

## B. 当前混乱/风险点

### 1. **components/home 边界不清**

- `components/home/HomeHero.tsx` 是服务端组件，应该放在 `app/` 或 `features/`
- `components/home/HeroSection.tsx` 是客户端组件，与 `hero/` 子目录层级混乱
- `components/home/hero/components/` 下的组件都是 Hero 专用，但命名像通用组件

**风险**：未来新增其他首页功能（如 About、Works）时，`components/home/` 会变成垃圾场

### 2. **hooks 放置位置不稳定**

- `useStickyProgress` 是通用滚动进度 hook，但放在 `components/home/hero/hooks/`
- `useHeroSlides` 导出 `HeroSlide` 类型，但类型定义在 hook 文件里
- 没有统一的 hooks 目录，通用 hooks 和功能 hooks 混在一起

**风险**：其他功能需要滚动进度时，会重复实现或错误 import

### 3. **类型散落各处**

- `HeroSlide` 类型在 `components/home/hero/hooks/useHeroSlides.ts`
- `HeroSlideDB` 类型在 `lib/siteConfig.ts`
- 没有统一的类型定义位置

**风险**：类型不一致、难以维护、难以发现类型定义位置

### 4. **lib/siteConfig.ts 职责过重**

- 混合了类型定义（`HeroSlideDB`）
- 混合了常量（`DEFAULT_HERO_SLIDES`）
- 混合了业务逻辑（`normalizeSlides`, `fillSlidesWithDefaults`）
- 混合了数据访问（`getPublicHeroSlides`）

**风险**：难以测试、难以复用、职责不清

### 5. **API 路由与功能组件分离**

- API 路由在 `app/api/admin/hero/`
- Hero 组件在 `components/home/hero/`
- 两者没有明确的关联关系

**风险**：修改 Hero 功能时，需要在多个目录间跳转，容易遗漏

---

## C. 两套目录规范方案

### 方案 1：Feature-Sliced Design（推荐）⭐

**核心理念**：按功能域（Feature）组织代码，每个功能自包含（组件、hooks、API、类型）

#### 目录树示例

```
vtuber-site/
├── app/                                    【路由层 - 只放页面组合】
│   ├── page.tsx                            → import from features/home-hero
│   ├── layout.tsx
│   ├── admin/
│   │   ├── page.tsx                        → import from features/admin-auth
│   │   ├── register/page.tsx                → import from features/admin-auth
│   │   └── cms/page.tsx                     → import from features/admin-cms
│   └── api/                                 【API路由 - 可放在features或app】
│       └── admin/
│           └── hero/                        → 可移到 features/home-hero/api/
│
├── features/                                【功能域 - 自包含】
│   ├── home-hero/                           → Hero功能域
│   │   ├── components/                      → Hero专用组件
│   │   │   ├── HeroSection.tsx              → 主组件（客户端）
│   │   │   ├── HeroBackground.tsx
│   │   │   ├── HeroHeader.tsx
│   │   │   ├── HeroMenu.tsx
│   │   │   └── HeroThumbStrip.tsx
│   │   ├── hooks/                           → Hero专用hooks
│   │   │   ├── useHeroSlides.ts
│   │   │   └── useHeroMenu.ts
│   │   ├── api/                             → Hero相关API（可选）
│   │   │   └── route.ts
│   │   ├── types.ts                         → Hero类型定义
│   │   ├── constants.ts                     → Hero常量（如FALLBACK_SLIDES）
│   │   └── index.ts                         → 对外暴露接口（只暴露HeroSection）
│   │
│   ├── admin-auth/                          → 登录/注册功能域
│   │   ├── components/
│   │   │   ├── AdminAuthPanel.tsx
│   │   │   └── RegisterPanel.tsx
│   │   ├── api/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   └── index.ts
│   │
│   └── admin-cms/                            → CMS管理功能域
│       ├── components/
│       │   └── CMSPage.tsx                  → 可提取为组件
│       ├── api/
│       │   ├── hero/slides/route.ts
│       │   ├── hero/upload/route.ts
│       │   └── hero/slide/route.ts
│       └── index.ts
│
├── components/ui/                            【通用UI组件 - 原子级】
│   └── (未来可放 Button, Card, Input 等)
│
├── lib/                                      【通用工具层】
│   ├── hooks/                               → 通用hooks
│   │   └── useStickyProgress.ts             → 从features移过来
│   ├── prisma.ts
│   ├── session.ts
│   └── fileUtils.ts
│
├── domain/                                   【业务领域层】
│   ├── hero/                                 → Hero业务域
│   │   ├── types.ts                         → HeroSlideDB等类型
│   │   ├── constants.ts                     → DEFAULT_HERO_SLIDES
│   │   └── services.ts                      → getPublicHeroSlides等
│   └── admin/                                → Admin业务域
│       └── types.ts
│
└── prisma/                                   【数据层】
    └── schema.prisma
```

#### 文件归类规则

1. **features/**：按功能域拆分，每个 feature 自包含

   - `components/`：该功能专用的 UI 组件
   - `hooks/`：该功能专用的 hooks
   - `api/`：该功能相关的 API 路由（可选）
   - `types.ts`：该功能的类型定义
   - `constants.ts`：该功能的常量
   - `index.ts`：对外暴露的公共接口

2. **components/ui/**：纯 UI 原子组件，无业务逻辑，可跨功能复用

3. **lib/hooks/**：通用 hooks，可被多个 features 使用

4. **domain/**：业务逻辑、类型、常量，可被多个 features 共享

5. **app/**：只放路由和页面组合，不包含业务逻辑

#### Import 边界规则

```
✅ 允许：
- app/ → features/*/index.ts
- features/* → domain/*
- features/* → lib/*
- features/* → components/ui/*
- features/* 内部自由import

❌ 禁止：
- features/A → features/B（跨feature直接import）
- app/ → features/*/components/*（绕过index.ts）
- domain/* → features/*（domain不依赖features）
```

#### 优点

- ✅ 功能内聚，易于定位代码
- ✅ 新增功能时不会污染其他目录
- ✅ 通过 `index.ts` 控制对外接口，降低耦合
- ✅ 适合持续扩展的站点项目

#### 缺点

- ⚠️ 初期迁移工作量较大
- ⚠️ 需要明确功能边界

---

### 方案 2：Components 驱动（按 UI 层级）

**核心理念**：按 UI 层级组织（页面 → 功能组件 → 通用组件），API 和业务逻辑分离

#### 目录树示例

```
vtuber-site/
├── app/                                    【路由层】
│   ├── page.tsx
│   ├── layout.tsx
│   └── admin/
│       ├── page.tsx
│       ├── register/page.tsx
│       └── cms/page.tsx
│
├── components/                             【组件层 - 按页面/功能组织】
│   ├── pages/                              → 页面级组件
│   │   ├── HomePage.tsx                    → 从app/page.tsx提取
│   │   └── AdminPage.tsx                   → 从app/admin/page.tsx提取
│   │
│   ├── features/                           → 功能级组件
│   │   ├── Hero/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HeroBackground.tsx
│   │   │   ├── HeroHeader.tsx
│   │   │   ├── HeroMenu.tsx
│   │   │   └── HeroThumbStrip.tsx
│   │   └── Auth/
│   │       ├── AdminAuthPanel.tsx
│   │       └── RegisterPanel.tsx
│   │
│   └── ui/                                 → 通用UI组件
│       └── (Button, Card等)
│
├── hooks/                                   【Hooks层】
│   ├── useHeroSlides.ts
│   ├── useHeroMenu.ts
│   ├── useStickyProgress.ts
│   └── index.ts
│
├── lib/                                     【工具层】
│   ├── prisma.ts
│   ├── session.ts
│   └── fileUtils.ts
│
├── domain/                                  【业务层】
│   ├── hero/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── services.ts
│   └── admin/
│
├── app/api/                                 【API路由 - 保持原位置】
│   └── admin/
│       └── hero/
│
└── prisma/
```

#### 文件归类规则

1. **components/pages/**：页面级组件，从 `app/` 提取复杂逻辑
2. **components/features/**：功能级组件，按功能分组
3. **components/ui/**：通用 UI 组件
4. **hooks/**：所有 hooks 统一管理
5. **domain/**：业务逻辑和类型

#### Import 边界规则

```
✅ 允许：
- app/ → components/pages/*
- components/pages/* → components/features/*
- components/features/* → components/ui/*
- 所有组件 → hooks/*
- 所有组件 → domain/*
- 所有组件 → lib/*

❌ 禁止：
- components/features/A → components/features/B（跨功能）
- hooks/* → components/*（hooks不依赖组件）
```

#### 优点

- ✅ 迁移工作量较小
- ✅ UI 层级清晰
- ✅ 适合 UI 驱动的项目

#### 缺点

- ⚠️ 功能边界不够清晰
- ⚠️ 新增功能时 `components/features/` 可能膨胀
- ⚠️ hooks 统一管理，但功能 hooks 和通用 hooks 混在一起

---

## D. 最小迁移计划（采用方案 1：Feature-Sliced）

### 阶段 1：创建新目录结构（不移动文件）

1. 创建 `features/home-hero/` 目录
2. 创建 `features/admin-auth/` 目录
3. 创建 `features/admin-cms/` 目录
4. 创建 `lib/hooks/` 目录
5. 创建 `domain/hero/` 目录
6. 创建 `components/ui/` 目录（暂时为空）

### 阶段 2：迁移通用资源

#### 步骤 2.1：迁移通用 hook

- **移动**：`components/home/hero/hooks/useStickyProgress.ts` → `lib/hooks/useStickyProgress.ts`
- **更新 import**：
  - `components/home/HeroSection.tsx`: `./hero/hooks/useStickyProgress` → `@/lib/hooks/useStickyProgress`

#### 步骤 2.2：迁移 domain 层

- **创建**：`domain/hero/types.ts`
  - 从 `lib/siteConfig.ts` 提取 `HeroSlideDB` 类型
- **创建**：`domain/hero/constants.ts`
  - 从 `lib/siteConfig.ts` 提取 `DEFAULT_HERO_SLIDES`
- **创建**：`domain/hero/services.ts`
  - 从 `lib/siteConfig.ts` 提取 `normalizeSlides`, `fillSlidesWithDefaults`, `getPublicHeroSlides`
- **更新 import**：
  - `components/home/HomeHero.tsx`: `@/lib/siteConfig` → `@/domain/hero/services`
  - `app/api/admin/hero/slides/route.ts`: 如需要则更新

### 阶段 3：迁移 Hero 功能

#### 步骤 3.1：移动 Hero 组件

- **移动**：`components/home/hero/components/*` → `features/home-hero/components/`
- **移动**：`components/home/HeroSection.tsx` → `features/home-hero/components/HeroSection.tsx`
- **移动**：`components/home/HomeHero.tsx` → `features/home-hero/HomeHero.tsx`（或保留在 app/）

#### 步骤 3.2：移动 Hero hooks

- **移动**：`components/home/hero/hooks/useHeroSlides.ts` → `features/home-hero/hooks/useHeroSlides.ts`
- **移动**：`components/home/hero/hooks/useHeroMenu.ts` → `features/home-hero/hooks/useHeroMenu.ts`

#### 步骤 3.3：创建 Hero 类型和常量

- **创建**：`features/home-hero/types.ts`
  - 从 `useHeroSlides.ts` 提取 `HeroSlide` 类型
- **创建**：`features/home-hero/constants.ts`
  - 从 `HeroSection.tsx` 提取 `FALLBACK_SLIDES`

#### 步骤 3.4：创建 Hero index.ts

- **创建**：`features/home-hero/index.ts`
  ```ts
  export { default as HeroSection } from "./components/HeroSection";
  export { default as HomeHero } from "./HomeHero";
  // 不导出内部组件（HeroBackground等）
  ```

#### 步骤 3.5：更新所有 import

- `app/page.tsx`: `@/components/home/HomeHero` → `@/features/home-hero`
- `features/home-hero/components/HeroSection.tsx`: 更新所有相对路径 import
- `features/home-hero/HomeHero.tsx`: 更新 import 路径

### 阶段 4：迁移 Admin 功能

#### 步骤 4.1：移动 Admin 组件

- **移动**：`components/login/AdminAuthPanel.tsx` → `features/admin-auth/components/AdminAuthPanel.tsx`
- **移动**：`components/login/RegisterPanel.tsx` → `features/admin-auth/components/RegisterPanel.tsx`

#### 步骤 4.2：移动 Admin API（可选）

- **移动**：`app/api/admin/login/route.ts` → `features/admin-auth/api/login/route.ts`
- **移动**：`app/api/admin/register/route.ts` → `features/admin-auth/api/register/route.ts`
- **注意**：Next.js App Router 的 API 路由必须在 `app/api/` 下，所以这一步可能需要保持原位置，或使用重导出

#### 步骤 4.3：创建 Admin index.ts

- **创建**：`features/admin-auth/index.ts`
  ```ts
  export { default as AdminAuthPanel } from "./components/AdminAuthPanel";
  export { default as RegisterPanel } from "./components/RegisterPanel";
  ```

#### 步骤 4.4：更新 import

- `app/admin/page.tsx`: `@/components/login/AdminAuthPanel` → `@/features/admin-auth`
- `app/admin/register/page.tsx`: `@/components/login/RegisterPanel` → `@/features/admin-auth`

### 阶段 5：迁移 CMS 功能

#### 步骤 5.1：提取 CMS 组件（可选）

- 如果 `app/admin/cms/page.tsx` 逻辑复杂，可提取为 `features/admin-cms/components/CMSPage.tsx`

#### 步骤 5.2：移动 CMS API（可选）

- **移动**：`app/api/admin/hero/slides/route.ts` → `features/admin-cms/api/hero/slides/route.ts`
- **移动**：`app/api/admin/hero/upload/route.ts` → `features/admin-cms/api/hero/upload/route.ts`
- **移动**：`app/api/admin/hero/slide/route.ts` → `features/admin-cms/api/hero/slide/route.ts`
- **注意**：同样需要考虑 Next.js 的限制

### 阶段 6：清理旧目录

- 删除 `components/home/`（如果已全部迁移）
- 删除 `components/login/`（如果已全部迁移）
- 更新 `lib/siteConfig.ts`（如果 domain 已迁移，可删除或保留为兼容层）

### 可能踩的坑

1. **Next.js API 路由限制**

   - Next.js 要求 API 路由必须在 `app/api/` 下
   - **解决方案**：保持 API 路由在 `app/api/`，或使用符号链接，或使用 Next.js 的 route handlers

2. **相对路径 import 混乱**

   - 移动文件后，相对路径会失效
   - **解决方案**：使用 `@/` 别名，统一使用绝对路径

3. **循环依赖**

   - features 之间可能产生循环依赖
   - **解决方案**：通过 `index.ts` 控制导出，禁止跨 feature 直接 import

4. **类型定义重复**

   - `HeroSlide` 和 `HeroSlideDB` 可能重复
   - **解决方案**：在 domain 层定义基础类型，features 层扩展

5. **测试文件位置**
   - 如果有测试文件，需要同步移动
   - **解决方案**：测试文件放在对应功能目录下，如 `features/home-hero/__tests__/`

---

## E. 命名与约定清单

### 文件命名

1. **组件文件**：PascalCase

   - ✅ `HeroSection.tsx`
   - ✅ `AdminAuthPanel.tsx`
   - ❌ `heroSection.tsx`
   - ❌ `hero-section.tsx`

2. **Hook 文件**：camelCase，以 `use` 开头

   - ✅ `useHeroSlides.ts`
   - ✅ `useStickyProgress.ts`
   - ❌ `UseHeroSlides.ts`
   - ❌ `heroSlides.ts`

3. **工具函数文件**：camelCase

   - ✅ `fileUtils.ts`
   - ✅ `siteConfig.ts`
   - ❌ `FileUtils.ts`
   - ❌ `file-utils.ts`

4. **类型文件**：camelCase，通常为 `types.ts` 或具体名称

   - ✅ `types.ts`
   - ✅ `heroTypes.ts`
   - ❌ `Types.ts`

5. **常量文件**：camelCase，通常为 `constants.ts`

   - ✅ `constants.ts`
   - ✅ `heroConstants.ts`

6. **服务文件**：camelCase，通常为 `services.ts`
   - ✅ `services.ts`
   - ✅ `heroServices.ts`

### Hook 命名

1. **必须以 `use` 开头**

   - ✅ `useHeroSlides`
   - ✅ `useStickyProgress`
   - ❌ `heroSlides`
   - ❌ `getHeroSlides`

2. **功能级 hook**：`use[Feature][Action]`

   - ✅ `useHeroSlides`
   - ✅ `useHeroMenu`
   - ✅ `useAdminAuth`

3. **通用 hook**：`use[Action]`
   - ✅ `useStickyProgress`
   - ✅ `useDebounce`
   - ✅ `useLocalStorage`

### 组件导出规范

1. **默认导出**：用于主要组件

   ```ts
   // HeroSection.tsx
   export default function HeroSection() { ... }
   ```

2. **命名导出**：用于工具组件或 hooks

   ```ts
   // useHeroSlides.ts
   export function useHeroSlides() { ... }
   export type HeroSlide = { ... }
   ```

3. **Barrel Exports（index.ts）**：用于控制对外接口
   ```ts
   // features/home-hero/index.ts
   export { default as HeroSection } from "./components/HeroSection";
   export { default as HomeHero } from "./HomeHero";
   // 不导出内部实现细节
   ```

### Barrel Exports 使用规则

1. **features 必须使用 index.ts**

   - ✅ `features/home-hero/index.ts` 控制对外接口
   - ❌ 直接从 `features/home-hero/components/HeroSection` import

2. **lib/hooks 可以使用 index.ts（可选）**

   - 如果 hooks 较多，可以创建 `lib/hooks/index.ts`
   - 统一导出所有通用 hooks

3. **domain 可以使用 index.ts（可选）**

   - `domain/hero/index.ts` 统一导出类型、常量、服务

4. **禁止在 app/使用 barrel exports**
   - `app/` 下的文件应该直接 import 具体文件

### 类型定义规范

1. **Domain 类型**：放在 `domain/[feature]/types.ts`

   - ✅ `domain/hero/types.ts` → `HeroSlideDB`
   - ✅ `domain/admin/types.ts` → `AdminUser`

2. **Feature 类型**：放在 `features/[feature]/types.ts`

   - ✅ `features/home-hero/types.ts` → `HeroSlide`（UI 层类型）

3. **组件 Props 类型**：可以内联或提取
   - 简单 Props：内联在组件文件
   - 复杂 Props：提取到 `types.ts`

### Import 路径规范

1. **统一使用 `@/` 别名**

   - ✅ `@/features/home-hero`
   - ✅ `@/lib/hooks/useStickyProgress`
   - ✅ `@/domain/hero/services`
   - ❌ `../../features/home-hero`
   - ❌ `../../../lib/hooks/useStickyProgress`

2. **从 index.ts 导入**

   - ✅ `import { HeroSection } from '@/features/home-hero'`
   - ❌ `import HeroSection from '@/features/home-hero/components/HeroSection'`

3. **禁止跨 feature 直接 import**
   - ❌ `features/admin-cms` → `features/home-hero/components/HeroBackground`
   - ✅ `features/admin-cms` → `@/features/home-hero`（通过 index.ts）

### 目录结构约定

1. **features 目录结构**

   ```
   features/[feature-name]/
   ├── components/          # 功能专用组件
   ├── hooks/               # 功能专用hooks
   ├── api/                 # 功能相关API（可选）
   ├── types.ts             # 功能类型
   ├── constants.ts         # 功能常量
   └── index.ts             # 对外接口
   ```

2. **domain 目录结构**
   ```
   domain/[domain-name]/
   ├── types.ts             # 领域类型
   ├── constants.ts         # 领域常量
   └── services.ts          # 领域服务
   ```

---

## 总结

**推荐方案**：**方案 1（Feature-Sliced Design）**

**理由**：

1. 适合持续扩展的站点项目
2. 功能边界清晰，易于维护
3. 通过 index.ts 控制耦合，降低复杂度
4. 未来新增功能（About、Works、Blog）时不会污染现有结构

**迁移策略**：分阶段迁移，先迁移通用资源，再迁移功能，最后清理

**关键原则**：

- 最小改动：优先移动文件+更新 import
- 控制边界：通过 index.ts 禁止跨 feature 直接 import
- 类型集中：domain 层定义基础类型，features 层扩展

等待确认后开始执行迁移。
