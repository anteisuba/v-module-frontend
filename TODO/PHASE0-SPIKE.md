# Phase 0 Spike：架构决策记录

> 日期：2026-03-22
> 状态：✅ 完成

---

## 1. Renderer 字段盘点

### Hero Section — ✅ 全部消费

| 字段 | 已消费 | 位置 |
|---|---|---|
| `layout.heightVh` | ✅ | HeroSection.tsx:50 |
| `layout.backgroundColor` | ✅ | HeroSection.tsx:55,70-71 |
| `layout.backgroundOpacity` | ✅ | HeroSection.tsx:56,70-71 |
| `layout.parallax` | ✅ | HeroSection.tsx:53,132,143 |

### News Section — ✅ 全部消费

| 字段 | 已消费 | 位置 |
|---|---|---|
| `layout.paddingY` | ✅ | NewsCarousel.tsx:88-89 |
| `layout.paddingX` | ✅ | NewsCarousel.tsx:88 |
| `layout.backgroundColor` | ✅ | NewsCarousel.tsx:90 |
| `layout.backgroundOpacity` | ✅ | NewsCarousel.tsx:91 |
| `layout.maxWidth` | ✅ | NewsCarousel.tsx:92 |

### Video Section — ⚠️ maxWidth 未消费

| 字段 | 已消费 | 位置 |
|---|---|---|
| `layout.paddingY` | ✅ | VideoSection.tsx:20-21 |
| `layout.paddingX` | ✅ | VideoSection.tsx:20 |
| `layout.backgroundColor` | ✅ | VideoSection.tsx:22 |
| `layout.backgroundOpacity` | ✅ | VideoSection.tsx:23 |
| `layout.maxWidth` | ❌ | 类型声明了但渲染未使用 |
| `display.columns` | ✅ | VideoSection.tsx:27 |
| `display.gap` | ✅ | VideoSection.tsx:28 |

### Gallery Section — ⚠️ 无背景色支持

| 字段 | 已消费 | 位置 |
|---|---|---|
| `columns` | ✅ | GallerySectionRenderer.tsx:12-16 |
| `gap` | ✅ | GallerySectionRenderer.tsx:18-22 |
| `backgroundColor` | ❌ | 类型中未声明，渲染中硬编码 `bg-black/12` |

### Menu Section — ❌ 完全未渲染

registry.tsx 中 `menu` 类型直接 `return null`。`backdropBlur`、`buttonVariant` 全部未使用。Menu 通过 `FloatingMenu` 组件在 layout 层渲染，不走 section renderer。

### 待修复项

- [ ] Video: 接入 `layout.maxWidth` 或从类型中移除
- [ ] Gallery: 增加 `backgroundColor` / `backgroundOpacity` 支持
- [ ] Menu: 保留类型声明（FloatingMenu 使用），注释说明 renderer 不渲染

---

## 2. CSS 变量注入策略

### 当前状态

```
服务端 layout.tsx ──▶ inline style on <div>
  --theme-primary, --theme-primary-foreground,
  --theme-primary-hover, --theme-primary-active,
  --theme-font-family

客户端 ThemeProvider.tsx ──▶ document.documentElement.style
  --theme-primary (重复)
  --theme-primary-hover = themeColor (BUG: 未做亮度调整)
  --theme-primary-active = themeColor (BUG: 未做亮度调整)
  --font-sans, --theme-color, --theme-font-family (重复)
```

### 决策

**服务端 `layout.tsx` 是唯一的 CSS 变量注入点。**

Phase 1 扩展注入列表：
```css
/* 已有 */
--theme-primary
--theme-primary-foreground
--theme-primary-hover
--theme-primary-active
--theme-font-family

/* 新增：覆写 editorial 变量 */
--color-bg         ← theme.backgroundColor
--color-surface    ← theme.surfaceColor
--color-text       ← theme.textColor
--color-muted      ← theme.mutedColor (可选)
--color-border     ← theme.borderColor (可选)
--color-accent     ← theme.primaryColor (= themeColor)

/* 新增：字体 */
--font-body        ← theme.bodyFont
--font-display     ← theme.headingFont
```

ThemeProvider 精简为只提供 `useTheme()` Context，移除 `useEffect` 中的 DOM 操作。

### Theme 作用范围

✅ 所有 `/u/[slug]/*` 子页面（blog、shop、news、checkout、order-success）都继承 `layout.tsx` 注入的变量。
❌ Admin 页面不受影响（使用全局默认值）。
✅ Admin preview `/admin/preview/[slug]` 使用 ThemeProvider，需同步更新。

---

## 3. 预设与 section 级 backgroundColor 优先级

### 决策

```
优先级（高→低）：
1. section.layout.backgroundColor（用户在 CMS 显式设置的值）
2. theme 预设的 CSS 变量（--color-bg 等）
3. globals.css 默认值
```

**实现方式：** 预设通过覆写 CSS 变量下发全局风格。各 renderer 已有的 `backgroundColor` 逻辑（hex→rgba）保持不变 — 如果用户设置了 section 级背景色，它通过 inline style 覆盖 CSS 变量；如果未设置（`undefined`），renderer 回退到读取 CSS 变量 `var(--color-bg)` 而非硬编码 `#000000`。

**关键改动：** 将 Hero/News/Video 的默认值从 `"#000000"` 改为 `undefined`，让 CSS 变量生效。

---

## 4. PageRenderer 全局渐变 overlay 参数化

### 当前代码（PageRenderer.tsx:88）

```tsx
<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(8,8,6,0.38)_52%,rgba(8,8,6,0.6))]" />
```

### 决策

**改为 inline style，值来自 theme 配置。**

```tsx
// theme.overlay 字段控制
// Editorial: 保持当前暗色渐变（默认值）
// Vivid: 无 overlay（transparent）
// Mono: 极淡白色渐变
const overlayStyle = theme.overlay
  ? { background: theme.overlay }
  : undefined; // undefined = 不渲染 overlay div

{overlayStyle && (
  <div className="absolute inset-0" style={overlayStyle} />
)}
```

**默认值保守行为：** 旧数据没有 `theme.overlay` 时，normalizePageConfig 填入当前暗色渐变值，确保现有站点视觉不变。

### 预设 overlay 值

| 预设 | overlay |
|---|---|
| Editorial | `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(8,8,6,0.38) 52%, rgba(8,8,6,0.6))` |
| Vivid | `none`（不渲染 overlay） |
| Mono | `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(250,250,250,0.05))` |

---

## 5. Zod Schema 扩展

### 新增 ThemeConfigSchema

```typescript
const ThemeConfigSchema = z.object({
  presetId: z.enum(["editorial", "vivid", "mono"]).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
  borderRadius: z.string().optional(),  // "0", "1rem", "1.5rem"
  overlay: z.string().optional(),       // CSS gradient 或 "none"
}).optional();
```

### 新增 variant 字段

在每个 SectionConfig 的公共部分增加：
```typescript
variant: z.string().optional()  // "default", "grid", "list", "masonry", "featured"
```

### 不改动

- `themeColor` 和 `fontFamily` 的 DB 列保留（向后兼容）
- 现有 section layout schema 不变

---

## 6. ThemeConfig 最小字段清单

```typescript
interface ThemeConfig {
  // 预设标识
  presetId?: "editorial" | "vivid" | "mono";

  // 颜色
  primaryColor?: string;      // 强调色 → --color-accent, --theme-primary
  backgroundColor?: string;   // 页面背景 → --color-bg
  surfaceColor?: string;      // 卡片背景 → --color-surface
  textColor?: string;         // 正文颜色 → --color-text

  // 字体
  headingFont?: string;       // 标题字体 → --font-display
  bodyFont?: string;          // 正文字体 → --font-body

  // 风格
  borderRadius?: string;      // 圆角 → --radius (Tailwind)
  overlay?: string;           // 全局 overlay CSS gradient 或 "none"
}
```

**与旧字段的合并规则（normalizePageConfig）：**
```
if (pageConfig.theme?.primaryColor)  → 使用 JSON 值
else if (page.themeColor)            → 使用 DB 列值
else                                 → 使用 Editorial 预设默认值 "#c9a96e"

if (pageConfig.theme?.bodyFont)      → 使用 JSON 值
else if (page.fontFamily)            → 使用 DB 列值
else                                 → 使用 "Jost"
```

---

## 7. ThemeProvider Bug

发现 `ThemeProvider.tsx` 中 `--theme-primary-hover` 和 `--theme-primary-active` 被设置为与 `--theme-primary` 相同的值（没有做亮度调整）。服务端 `layout.tsx` 正确使用了 `adjustBrightness()`。

**Phase 1 修复：** 移除 ThemeProvider 的 `useEffect` DOM 操作，统一由 `layout.tsx` 处理。
