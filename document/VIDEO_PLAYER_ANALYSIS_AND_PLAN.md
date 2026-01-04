# 视频播放器组件开发 - 项目分析与实现计划

> **阶段：Phase 1 - 研究与计划**  
> **日期：2025-01-21**  
> **状态：待审批**

---

## 📋 目录

1. [项目上下文分析](#1-项目上下文分析)
2. [技术研究](#2-技术研究)
3. [实现计划](#3-实现计划)
4. [风险评估与建议](#4-风险评估与建议)

---

## 1. 项目上下文分析

### 1.1 渲染逻辑分析

#### 当前实现模式

项目采用 **Feature-Sliced Design (FSD)** 架构，渲染逻辑位于 `features/page-renderer`：

**核心文件结构：**
```
features/page-renderer/
├── registry.tsx              # 类型安全的渲染注册表
├── components/
│   ├── PageRenderer.tsx      # 主渲染器组件
│   └── renderers/
│       ├── HeroSectionRenderer.tsx
│       ├── GallerySectionRenderer.tsx
│       └── NewsSectionRenderer.tsx
└── index.ts
```

**渲染流程：**
1. `PageRenderer` 接收 `PageConfig`，按 `order` 排序 sections
2. `registry.tsx` 中的 `renderSection()` 函数根据 `section.type` 分发到对应的 Renderer
3. 每个 Renderer 负责将配置数据转换为 React 组件
4. 使用 TypeScript 的 discriminated union 确保类型安全

**关键代码模式：**
```typescript
// registry.tsx 中的分发逻辑
export function renderSection(section: SectionConfig, pageConfig?: PageConfig) {
  if (section.type === "hero") {
    return <HeroSectionRenderer ... />;
  }
  if (section.type === "gallery") {
    return <GallerySectionRenderer ... />;
  }
  // ... 其他类型
}
```

#### 视频组件集成点

**需要修改的文件：**
- `features/page-renderer/registry.tsx` - 添加 `video` 类型处理
- `features/page-renderer/components/renderers/VideoSectionRenderer.tsx` - 新建视频渲染器

**集成模式：**
遵循现有的 `NewsSectionRenderer` 和 `GallerySectionRenderer` 模式：
- 接收 `props: VideoSectionProps` 和 `id: string`
- 使用 `data-section-id` 和 `data-section-type` 属性
- 支持 `enabled` 状态控制

---

### 1.2 数据模式分析

#### 当前数据结构

**Domain 层类型定义** (`domain/page-config/types.ts`)：
```typescript
export type SectionType = 'hero' | 'links' | 'gallery' | 'news';

export type SectionConfig = 
  | { id: string; type: 'hero'; props: HeroSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'gallery'; props: GallerySectionProps; enabled: boolean; order: number }
  | { id: string; type: 'news'; props: NewsSectionProps; enabled: boolean; order: number };
```

**现有 Section Props 模式：**
- `HeroSectionProps`: `slides[]`, `title`, `subtitle`, `layout`, `carousel`
- `GallerySectionProps`: `items[]`, `columns`, `gap`
- `NewsSectionProps`: `items[]`, `layout`

#### 视频数据结构设计

**建议的 `VideoSectionProps` 结构：**
```typescript
export type VideoSectionProps = {
  items: Array<{
    id: string;                    // 唯一标识
    url: string;                   // 视频 URL（支持完整链接或短链接）
    platform: 'youtube' | 'bilibili' | 'auto'; // 平台类型，auto 表示自动检测
    title?: string;                // 视频标题（可选，用于显示）
    thumbnail?: string;             // 自定义缩略图（可选）
    autoplay?: boolean;             // 自动播放（默认 false）
    muted?: boolean;                // 静音（默认 false）
    loop?: boolean;                // 循环播放（默认 false）
    controls?: boolean;             // 显示控制条（默认 true）
    startTime?: number;             // 开始时间（秒）
  }>;
  // 布局配置（参考 NewsSectionProps）
  layout?: {
    paddingY?: number;              // 上下内边距（px），默认 64
    backgroundColor?: string;      // 背景颜色，默认 "black"
    backgroundOpacity?: number;     // 背景透明度（0-1），默认 1
    maxWidth?: string;              // 最大宽度，默认 "7xl"
    aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto'; // 宽高比，默认 "16:9"
  };
  // 显示配置
  display?: {
    columns?: 1 | 2 | 3;            // 网格列数（多视频时），默认 1
    gap?: 'sm' | 'md' | 'lg';      // 间距，默认 "md"
  };
};
```

**数据库存储：**
- 视频配置存储在 `Page.draftConfig` 和 `Page.publishedConfig`（JSON 字段）
- 无需修改 Prisma Schema（使用现有的 JSON 字段）
- 视频 URL 和元数据直接存储在 JSON 中

**验证 Schema** (`lib/validation/pageConfigSchema.ts`)：
需要添加 `VideoSectionPropsSchema` 和更新 `SectionConfigSchema`：
```typescript
const VideoSectionPropsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      url: z.string().url(), // 必须是有效的 URL
      platform: z.enum(['youtube', 'bilibili', 'auto']).optional(),
      title: z.string().optional(),
      thumbnail: z.string().url().optional(),
      autoplay: z.boolean().optional(),
      muted: z.boolean().optional(),
      loop: z.boolean().optional(),
      controls: z.boolean().optional(),
      startTime: z.number().min(0).optional(),
    })
  ).min(1).max(10), // 至少 1 个，最多 10 个视频
  layout: z.object({
    paddingY: z.number().min(0).max(200).optional(),
    backgroundColor: z.string().optional(),
    backgroundOpacity: z.number().min(0).max(1).optional(),
    maxWidth: z.string().optional(),
    aspectRatio: z.enum(['16:9', '4:3', '1:1', 'auto']).optional(),
  }).optional(),
  display: z.object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    gap: z.enum(['sm', 'md', 'lg']).optional(),
  }).optional(),
});
```

---

### 1.3 样式与 UI 模式分析

#### 现有样式系统

**技术栈：**
- **Tailwind CSS v4** - 使用 `@tailwindcss/postcss`
- **响应式设计** - 移动端优先（`md:`, `lg:` 断点）
- **设计系统** - 遵循 `document/UX_DESIGN_GUIDELINES.md` 规范

**现有媒体组件样式模式：**

1. **GallerySectionRenderer** (`features/page-renderer/components/renderers/GallerySectionRenderer.tsx`)：
   ```tsx
   <section className="py-16 px-6 max-w-7xl mx-auto">
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {/* 图片网格 */}
     </div>
   </section>
   ```

2. **NewsSectionRenderer** (`features/page-renderer/components/renderers/NewsSectionRenderer.tsx`)：
   ```tsx
   <section style={{ paddingTop, paddingBottom, backgroundColor }}>
     <div className="mx-auto px-6" style={{ maxWidth }}>
       {/* 轮播容器 */}
     </div>
   </section>
   ```

**响应式宽高比实现：**
- 使用 `aspect-[16/9]` 类（Tailwind CSS v4 原生支持）
- 或使用 `aspect-w-16 aspect-h-9`（如果使用 aspect-ratio 插件）

**UI 组件规范：**
- 按钮：使用 `components/ui/Button.tsx`（primary, secondary, danger, text）
- 输入框：使用 `components/ui/Input.tsx`（内置标签、帮助文本、错误提示）
- 颜色选择器：使用 `components/ui/ColorPicker.tsx`
- 开关：使用自定义 `ToggleSwitch` 组件

---

## 2. 技术研究

### 2.1 库 vs 原生实现对比

#### 方案 A：使用 react-player 库

**优点：**
- ✅ **统一 API**：支持 YouTube、Bilibili、Vimeo、Twitch 等 30+ 平台
- ✅ **自动平台检测**：根据 URL 自动识别平台
- ✅ **内置功能**：播放控制、全屏、响应式、加载状态
- ✅ **维护成本低**：社区维护，定期更新
- ✅ **TypeScript 支持**：完整的类型定义

**缺点：**
- ❌ **包体积**：增加 ~50KB（gzipped）
- ❌ **定制性限制**：某些平台特定功能可能受限
- ❌ **依赖管理**：需要管理第三方依赖

**安装：**
```bash
pnpm add react-player
```

**使用示例：**
```tsx
import ReactPlayer from 'react-player';

<ReactPlayer
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  width="100%"
  height="100%"
  controls={true}
  playing={false}
/>
```

#### 方案 B：自定义 iframe 封装

**优点：**
- ✅ **零依赖**：不增加包体积
- ✅ **完全控制**：可以精确控制每个平台的参数
- ✅ **性能优化**：可以按需加载（lazy loading）

**缺点：**
- ❌ **开发复杂度高**：需要处理每个平台的 URL 解析和嵌入代码
- ❌ **维护成本高**：平台 API 变更需要手动更新
- ❌ **功能重复**：需要自己实现播放控制、响应式等

**实现复杂度：**
- YouTube：需要解析 `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/` 等格式
- Bilibili：需要解析 `bilibili.com/video/BV`, `b23.tv/` 短链接，处理 `aid` 和 `bvid` 参数

#### 推荐方案

**建议采用：react-player（方案 A）**

**理由：**
1. **开发效率**：快速实现，减少 70% 的开发时间
2. **稳定性**：社区维护，经过大量项目验证
3. **扩展性**：未来支持更多平台无需修改代码
4. **包体积影响**：50KB 在 Next.js 项目中可接受（可通过代码分割优化）

**优化策略：**
- 使用动态导入（`next/dynamic`）实现代码分割
- 仅在需要时加载播放器组件

---

### 2.2 Bilibili 兼容性研究

#### Bilibili 嵌入方式

**标准嵌入 URL 格式：**
```
https://player.bilibili.com/player.html?aid={aid}&bvid={BV号}&page=1
```

**URL 解析挑战：**
1. **多种 URL 格式**：
   - `https://www.bilibili.com/video/BV1xx411c7mu`
   - `https://www.bilibili.com/video/av123456`
   - `https://b23.tv/xxxxx`（短链接，需要解析）

2. **参数提取**：
   - `BV` 号：从 URL 路径提取
   - `aid`：从 URL 路径或通过 API 获取
   - `page`：分 P 视频的页码（默认 1）

#### iframe 属性要求

**必需的 sandbox 属性：**
```html
<iframe
  src="https://player.bilibili.com/player.html?bvid=BV1xx411c7mu"
  sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox"
  allowfullscreen
  scrolling="no"
  border="0"
  frameborder="no"
  framespacing="0"
></iframe>
```

**高质量流参数：**
- `high_quality=1`：启用高质量播放
- `autoplay=1`：自动播放（需要用户交互）
- `muted=1`：静音（配合 autoplay）

#### react-player 对 Bilibili 的支持

**当前状态：**
- ✅ react-player 2.x+ 版本支持 Bilibili
- ✅ 自动处理 URL 解析和 iframe 属性
- ⚠️ 需要验证 sandbox 属性是否自动设置

**验证方法：**
在实现前，需要测试 react-player 在 Next.js 环境中对 Bilibili 的支持情况。

---

### 2.3 响应式设计实现

#### 16:9 宽高比实现

**Tailwind CSS v4 原生支持：**
```tsx
<div className="aspect-[16/9] w-full">
  <ReactPlayer url={url} width="100%" height="100%" />
</div>
```

**备选方案（如果 v4 不支持）：**
```tsx
<div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 = 56.25% */}
  <div className="absolute inset-0">
    <ReactPlayer url={url} width="100%" height="100%" />
  </div>
</div>
```

#### 响应式网格布局

**多视频网格（参考 GallerySectionRenderer）：**
```tsx
<div className={`
  grid 
  ${columns === 1 ? 'grid-cols-1' : ''}
  ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : ''}
  ${columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
  ${gap === 'sm' ? 'gap-2' : gap === 'md' ? 'gap-4' : 'gap-6'}
`}>
  {items.map(item => (
    <div className="aspect-[16/9]">
      <VideoPlayer url={item.url} />
    </div>
  ))}
</div>
```

---

## 3. 实现计划

### 3.1 FSD 结构规划

#### 新功能目录结构

```
features/
└── video-section/
    ├── components/
    │   ├── VideoSection.tsx           # 主组件（类似 NewsCarouselSection）
    │   ├── VideoPlayer.tsx             # 单个视频播放器组件（封装 react-player）
    │   └── VideoGrid.tsx               # 多视频网格布局组件
    ├── hooks/
    │   └── useVideoUrlParser.ts       # URL 解析和平台检测 Hook
    ├── utils/
    │   ├── urlParser.ts                # URL 解析工具函数
    │   └── platformDetector.ts         # 平台检测工具函数
    ├── types.ts                        # 类型定义
    ├── constants.ts                    # 常量定义
    └── index.ts                        # 导出

domain/
└── page-config/
    └── types.ts                        # 添加 VideoSectionProps 类型

features/
└── page-renderer/
    ├── registry.tsx                    # 添加 video 类型处理
    └── components/
        └── renderers/
            └── VideoSectionRenderer.tsx # 新建视频渲染器

components/
└── ui/
    └── VideoSectionEditor.tsx          # 新建视频编辑器组件

lib/
└── validation/
    └── pageConfigSchema.ts             # 添加 VideoSectionPropsSchema
```

#### 文件职责说明

1. **`features/video-section/components/VideoPlayer.tsx`**
   - 封装 `react-player`，处理单个视频播放
   - 支持 YouTube 和 Bilibili
   - 处理加载状态、错误状态
   - 响应式设计（16:9 宽高比）

2. **`features/video-section/components/VideoSection.tsx`**
   - 主组件，处理多视频布局
   - 支持单视频和多视频网格
   - 应用布局配置（padding, background, maxWidth）

3. **`features/video-section/hooks/useVideoUrlParser.ts`**
   - 解析视频 URL，提取平台和视频 ID
   - 统一 URL 格式（转换为标准嵌入 URL）

4. **`components/ui/VideoSectionEditor.tsx`**
   - 管理后台编辑器组件
   - 视频 URL 输入、平台检测、预览
   - 布局和显示配置

---

### 3.2 集成计划

#### 步骤 1：更新 Domain 层

**文件：`domain/page-config/types.ts`**

```typescript
// 添加 VideoSectionProps 类型定义
export type VideoSectionProps = { ... };

// 更新 SectionType
export type SectionType = 'hero' | 'links' | 'gallery' | 'news' | 'video';

// 更新 SectionConfig
export type SectionConfig = 
  | { id: string; type: 'hero'; props: HeroSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'gallery'; props: GallerySectionProps; enabled: boolean; order: number }
  | { id: string; type: 'news'; props: NewsSectionProps; enabled: boolean; order: number }
  | { id: string; type: 'video'; props: VideoSectionProps; enabled: boolean; order: number };
```

#### 步骤 2：更新验证 Schema

**文件：`lib/validation/pageConfigSchema.ts`**

- 添加 `VideoSectionPropsSchema`
- 更新 `SectionConfigSchema`，添加 video 类型

#### 步骤 3：创建视频组件

**文件：`features/video-section/components/VideoPlayer.tsx`**

- 封装 react-player
- 处理平台检测和 URL 解析
- 实现响应式布局

#### 步骤 4：创建视频渲染器

**文件：`features/page-renderer/components/renderers/VideoSectionRenderer.tsx`**

- 遵循现有 Renderer 模式
- 接收 `VideoSectionProps` 和 `id`
- 渲染 `VideoSection` 组件

#### 步骤 5：更新渲染注册表

**文件：`features/page-renderer/registry.tsx`**

```typescript
import VideoSectionRenderer from "./components/renderers/VideoSectionRenderer";

export function renderSection(section: SectionConfig, pageConfig?: PageConfig) {
  // ... 现有代码 ...
  
  if (section.type === "video") {
    return (
      <VideoSectionRenderer
        key={section.id}
        id={section.id}
        props={section.props}
      />
    );
  }
  
  // ... 其他类型 ...
}
```

#### 步骤 6：创建编辑器组件

**文件：`components/ui/VideoSectionEditor.tsx`**

- 参考 `NewsSectionEditor.tsx` 的实现模式
- 视频 URL 输入框
- 自动平台检测和预览
- 布局配置（padding, background, maxWidth, aspectRatio）
- 显示配置（columns, gap）

---

### 3.3 编辑器 UI 设计

#### 用户交互流程

1. **添加视频 Section**
   - 点击"添加视频区块"按钮
   - 自动创建新的 video section（如果不存在）

2. **添加视频**
   - 点击"添加视频"按钮
   - 显示视频输入表单

3. **输入视频 URL**
   - 用户粘贴视频链接（支持多种格式）
   - 系统自动检测平台（YouTube / Bilibili）
   - 显示平台图标和视频预览（如果可用）

4. **配置视频选项**
   - 标题（可选）
   - 自动播放、静音、循环、控制条
   - 开始时间（秒）

5. **配置布局**
   - 上下内边距（滑块，0-200px）
   - 背景颜色（颜色选择器）
   - 背景透明度（滑块，0-100%）
   - 最大宽度（下拉选择：full, 7xl, 6xl, 5xl, 4xl）
   - 宽高比（下拉选择：16:9, 4:3, 1:1, auto）

6. **配置显示（多视频时）**
   - 列数（1, 2, 3）
   - 间距（sm, md, lg）

#### UI 组件设计

**参考现有编辑器模式：**

```tsx
// 视频输入区域
<div className="rounded-lg border border-black/10 bg-white/70 p-3">
  <div className="mb-2 flex items-center justify-between">
    <label className="text-xs font-medium text-black">视频 URL</label>
    <Button variant="danger" size="sm" onClick={removeVideo}>删除</Button>
  </div>
  
  {/* URL 输入框 */}
  <Input
    label="视频链接"
    value={video.url}
    onChange={(e) => updateVideo({ url: e.target.value })}
    placeholder="https://www.youtube.com/watch?v=..."
    helpText="支持 YouTube 和 Bilibili 链接"
  />
  
  {/* 平台检测显示 */}
  {detectedPlatform && (
    <div className="mt-2 flex items-center gap-2 text-xs text-black/70">
      <span>平台：</span>
      <span className="font-medium">{detectedPlatform === 'youtube' ? 'YouTube' : 'Bilibili'}</span>
    </div>
  )}
  
  {/* 视频预览（可选） */}
  {video.url && (
    <div className="mt-3 aspect-[16/9] rounded-lg border border-black/10 overflow-hidden">
      <VideoPlayer url={video.url} controls={true} width="100%" height="100%" />
    </div>
  )}
  
  {/* 视频选项 */}
  <div className="mt-3 space-y-2">
    <ToggleSwitch
      label="自动播放"
      enabled={video.autoplay ?? false}
      onChange={() => updateVideo({ autoplay: !video.autoplay })}
    />
    {/* ... 其他选项 ... */}
  </div>
</div>
```

#### URL 解析功能

**需要实现的解析逻辑：**

1. **YouTube URL 格式：**
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - `https://www.youtube.com/embed/VIDEO_ID`

2. **Bilibili URL 格式：**
   - `https://www.bilibili.com/video/BV1xx411c7mu`
   - `https://www.bilibili.com/video/av123456`
   - `https://b23.tv/xxxxx`（需要解析短链接）

**实现位置：**
- `features/video-section/utils/urlParser.ts`
- `features/video-section/hooks/useVideoUrlParser.ts`

---

## 4. 风险评估与建议

### 4.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| react-player 对 Bilibili 支持不完整 | 高 | 中 | 提前测试，如不支持则采用自定义 iframe |
| Bilibili 短链接解析失败 | 中 | 低 | 提供手动输入 BV 号的备选方案 |
| 包体积增加 | 低 | 高 | 使用动态导入，代码分割 |
| 跨域问题 | 中 | 低 | 使用 iframe sandbox 属性，遵循平台要求 |

### 4.2 实施建议

#### Phase 1：MVP 实现（当前阶段）
1. ✅ 使用 react-player 实现基础功能
2. ✅ 支持 YouTube 和 Bilibili
3. ✅ 单视频显示
4. ✅ 基础布局配置

#### Phase 2：增强功能（后续）
1. 多视频网格布局
2. 视频缩略图预览
3. 视频标题和描述显示
4. 播放列表支持
5. 更多平台支持（Vimeo, Twitch 等）

#### Phase 3：性能优化（后续）
1. 懒加载（Intersection Observer）
2. 预加载策略
3. 视频缓存

### 4.3 测试计划

**单元测试：**
- URL 解析函数测试
- 平台检测函数测试
- 组件渲染测试

**集成测试：**
- 编辑器保存和加载
- 页面渲染器集成
- 多视频布局

**E2E 测试：**
- 用户添加视频流程
- 视频播放功能
- 响应式布局

---

## 5. 总结

### 5.1 关键决策

1. **技术选型**：使用 `react-player` 库（推荐）
2. **数据结构**：遵循现有 Section Props 模式
3. **组件架构**：遵循 FSD 架构，创建独立的 `video-section` feature
4. **编辑器 UI**：参考 `NewsSectionEditor` 的实现模式

### 5.2 下一步行动

**待审批事项：**
- [ ] 确认技术选型（react-player vs 自定义 iframe）
- [ ] 确认数据结构设计
- [ ] 确认 UI/UX 设计

**审批通过后：**
1. 安装依赖：`pnpm add react-player`
2. 创建 feature 目录结构
3. 实现 URL 解析工具
4. 实现视频播放器组件
5. 实现视频渲染器
6. 实现编辑器组件
7. 更新类型定义和验证 Schema
8. 集成到 page-renderer

---

**文档版本：** 1.0  
**最后更新：** 2025-01-21  
**作者：** AI Assistant  
**状态：** 待审批

