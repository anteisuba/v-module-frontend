# VTuber CMS 系统 - 可用性设计规范

> 基于尼尔森十大可用性原则的界面设计规范  
> 版本：1.0 | 更新日期：2025-01-21

---

## 📋 目录

1. [设计目标与原则](#设计目标与原则)
2. [系统状态可见性](#01-系统状态可见性)
3. [系统与现实世界的匹配](#02-系统与现实世界的匹配)
4. [用户控制与自由](#03-用户控制与自由)
5. [一致性与标准](#04-一致性与标准)
6. [防错设计](#05-防错设计)
7. [识别优于回忆](#06-识别优于回忆)
8. [灵活性与效率](#07-灵活性与效率)
9. [审美与简约设计](#08-审美与简约设计)
10. [错误识别与恢复](#09-帮助用户识别诊断和恢复错误)
11. [帮助与文档](#10-帮助与文档)
12. [组件设计规范](#组件设计规范)
13. [实施检查清单](#实施检查清单)

---

## 设计目标与原则

### 核心目标
- **降低认知成本**：让用户无需学习即可理解和使用
- **减少误操作与挫败感**：通过设计预防错误，而非依赖提示
- **提升操作效率**：兼顾新手友好与高频用户效率
- **增强安全感与可控感**：让用户始终清楚"系统在做什么、我能做什么"
- **符合现实世界认知模型**：贴近真实语言、行为和心理预期

### 整体风格
**清晰 · 克制 · 专业 · 可执行 · 可复制**

---

## 01. 系统状态可见性

### 设计原则
系统的当前状态必须在合理时间内清晰呈现，避免任何"不确定感"。

### 实施规范

#### 1.1 Loading 状态
**当前问题**：仅显示文本"加载中"，无视觉反馈

**改进方案**：
```typescript
// 组件：LoadingState.tsx
interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100，可选
  type?: "spinner" | "skeleton" | "progress";
}

// 使用场景：
// - 页面初始化：Skeleton 骨架屏
// - 数据保存：进度条 + 百分比
// - 图片上传：进度条 + 文件名
```

**视觉规范**：
- **Skeleton 骨架屏**：用于页面/区块加载，使用浅灰色占位，动画闪烁
- **Spinner 加载器**：用于按钮/操作反馈，尺寸 16px-24px，颜色与按钮一致
- **进度条**：用于上传/保存，显示百分比（如：`保存中... 45%`）

#### 1.2 操作反馈
**必须反馈的操作**：
- ✅ 保存草稿 → 显示"已保存"（3秒后自动消失）
- ✅ 发布页面 → 显示"发布中..." → "发布成功"
- ✅ 图片上传 → 显示上传进度 → "上传成功"
- ✅ 删除操作 → 显示"已删除"（支持撤销）

**反馈位置**：
- 全局 Toast（右上角，不遮挡内容）
- 内联提示（操作区域附近）
- 按钮状态（禁用/加载中）

#### 1.3 状态指示器
**保存状态**：
```
[未保存] → [保存中...] → [已保存] → [已发布]
```
- 未保存：显示"未保存"标签（黄色）
- 保存中：按钮显示 spinner + "保存中..."
- 已保存：显示"已保存"（绿色，3秒后消失）
- 已发布：显示"已发布"（绿色，常驻）

**实施代码示例**：
```tsx
// CMSHeader 组件增强
<div className="flex items-center gap-2">
  {saving && (
    <span className="text-xs text-blue-600 flex items-center gap-1">
      <Spinner size="12" /> 保存中...
    </span>
  )}
  {lastSaved && !saving && (
    <span className="text-xs text-green-600">
      ✓ 已保存 {formatTime(lastSaved)}
    </span>
  )}
</div>
```

---

## 02. 系统与现实世界的匹配

### 设计原则
界面语言与逻辑应符合用户的现实经验，而非技术或内部视角。

### 实施规范

#### 2.1 文案规范
**禁止使用**：
- ❌ "Hero Section" → ✅ "首页横幅"
- ❌ "Social Links" → ✅ "社交链接"
- ❌ "Object Position" → ✅ "图片位置"
- ❌ "Background Opacity" → ✅ "背景透明度"
- ❌ "Enabled/Disabled" → ✅ "显示/隐藏"

**使用生活化语言**：
- "上传图片" 而非 "Upload Image"
- "保存草稿" 而非 "Save Draft"
- "预览页面" 而非 "Preview Page"
- "删除" 而非 "Remove Item"

#### 2.2 图标与隐喻
**图标选择原则**：
- 📸 图片上传 → 相机图标
- 🔗 链接 → 链条图标
- 🎨 颜色选择 → 调色板图标
- 👁️ 显示/隐藏 → 眼睛图标
- ✏️ 编辑 → 铅笔图标

**避免使用**：
- ❌ 技术术语图标（如 `</>` 代码图标）
- ❌ 抽象符号（如 `⚙️` 设置，除非确实是设置）

#### 2.3 操作流程
**符合现实顺序**：
1. 先上传图片 → 再调整位置
2. 先填写内容 → 再保存
3. 先预览 → 再发布

**当前问题**：某些操作顺序不直观

**改进**：在 UI 中通过视觉引导（箭头、步骤指示）明确操作顺序

---

## 03. 用户控制与自由

### 设计原则
用户必须随时拥有"退出、撤销、回退"的控制权。

### 实施规范

#### 3.1 撤销/重做功能
**必须支持的操作**：
- ✅ 删除内容 → 显示"撤销删除"按钮（5秒内）
- ✅ 修改配置 → 支持"重置为默认值"
- ✅ 批量操作 → 支持"取消所有更改"

**实施方案**：
```typescript
// hooks/useUndoRedo.ts
interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

// 使用场景：
// - 删除新闻项 → 显示撤销按钮
// - 修改 Hero 图片 → 支持撤销
// - 保存前 → 显示"放弃更改"选项
```

#### 3.2 退出与取消
**所有模态/表单必须包含**：
- ✅ 明确的"取消"按钮
- ✅ 右上角"×"关闭按钮
- ✅ ESC 键关闭（键盘支持）

**危险操作确认**：
- 删除操作 → 显示确认对话框
- 放弃未保存更改 → 显示警告
- 发布页面 → 显示预览确认

#### 3.3 回退导航
**当前实现**：✅ BackButton 组件已实现

**增强建议**：
- 添加面包屑导航（如：`首页 > 管理后台 > 页面编辑`）
- 支持浏览器前进/后退按钮
- 保存导航历史（用户可返回之前编辑的页面）

---

## 04. 一致性与标准

### 设计原则
相同概念在全产品中保持一致，遵循平台与行业规范。

### 实施规范

#### 4.1 按钮样式统一
**当前问题**：按钮样式不统一（有些用 `bg-black`，有些用 `bg-white/70`）

**标准按钮规范**：
```typescript
// 主按钮（Primary）
className="bg-black text-white px-4 py-2 rounded-lg hover:bg-black/90"

// 次按钮（Secondary）
className="border border-black/20 bg-white/70 text-black px-4 py-2 rounded-lg hover:bg-white/80"

// 危险按钮（Danger）
className="border border-red-300 bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"

// 文本按钮（Text）
className="text-black/70 hover:text-black underline"
```

**按钮尺寸**：
- 大按钮：`px-4 py-2.5 text-sm`（主要操作）
- 中按钮：`px-3 py-1.5 text-xs`（次要操作）
- 小按钮：`px-2 py-1 text-[10px]`（内联操作）

#### 4.2 表单元素统一
**输入框**：
```typescript
className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30"
```

**标签**：
```typescript
className="block text-xs font-medium text-black mb-1.5"
```

**辅助文本**：
```typescript
className="text-[10px] text-black/50 mt-1"
```

#### 4.3 图标与颜色
**颜色语义**：
- ✅ 成功：`text-green-600` / `bg-green-50`
- ❌ 错误：`text-red-600` / `bg-red-50`
- ⚠️ 警告：`text-yellow-600` / `bg-yellow-50`
- ℹ️ 信息：`text-blue-600` / `bg-blue-50`

**图标尺寸**：
- 16px：内联图标
- 20px：按钮图标
- 24px：区块标题图标

#### 4.4 间距系统
**统一间距**：
- 区块间距：`mb-6`（24px）
- 元素间距：`gap-3`（12px）
- 内边距：`p-4`（16px）或 `p-5`（20px）

---

## 05. 防错设计

### 设计原则
通过设计提前避免错误，而不是事后报错。

### 实施规范

#### 5.1 表单验证
**实时验证**（输入时）：
```typescript
// URL 输入框
<input
  type="url"
  pattern="https?://.+"
  onBlur={(e) => {
    if (e.target.value && !e.target.value.startsWith('http')) {
      setError('请输入完整的网址（以 http:// 或 https:// 开头）');
    }
  }}
/>
```

**禁用无效操作**：
- 图片未上传 → 禁用"保存"按钮
- URL 格式错误 → 禁用"添加链接"按钮
- 必填项为空 → 禁用"发布"按钮

#### 5.2 输入限制提示
**图片上传**：
- 显示文件大小限制（如：`最大 5MB`）
- 显示支持的格式（如：`支持 JPG、PNG、GIF`）
- 超出限制 → 立即提示，不触发上传

**文本输入**：
- 显示字符限制（如：`标题：0/50 字符`）
- 超出限制 → 输入框变红，显示错误提示

#### 5.3 确认对话框
**需要确认的操作**：
- 删除内容 → 显示："确定要删除这条内容吗？此操作无法撤销。"
- 放弃未保存更改 → 显示："您有未保存的更改，确定要离开吗？"
- 发布页面 → 显示："确定要发布页面吗？发布后将对所有访客可见。"

**确认按钮文案**：
- 主操作：`确定删除` / `确定发布`
- 取消：`取消`

---

## 06. 识别优于回忆

### 设计原则
让用户"看到即可理解"，而非依赖记忆。

### 实施规范

#### 6.1 可视化选项
**当前问题**：某些设置需要用户记住选项

**改进方案**：
- 图片位置选择 → 使用可视化网格（9宫格）
- 颜色选择 → 显示颜色预览 + 常用颜色快捷选择
- 布局选项 → 使用缩略图预览

**实施示例**：
```tsx
// 图片位置选择器（已实现 ImagePositionEditor）
// 显示 9 个位置选项，用户点击即可选择
<div className="grid grid-cols-3 gap-2">
  {positions.map(pos => (
    <button
      key={pos}
      onClick={() => onChange(pos)}
      className={selected === pos ? 'ring-2 ring-black' : ''}
    >
      <PositionIcon position={pos} />
    </button>
  ))}
</div>
```

#### 6.2 历史记录与最近使用
**实施功能**：
- 最近上传的图片 → 显示缩略图列表
- 最近使用的颜色 → 显示颜色历史
- 最近编辑的页面 → 显示在仪表板

#### 6.3 标签与提示
**所有输入框必须包含**：
- ✅ 清晰的标签（如：`图片链接`）
- ✅ 占位符提示（如：`https://example.com/image.jpg`）
- ✅ 辅助说明（如：`支持 JPG、PNG 格式，最大 5MB`）

**开关控件**：
- ✅ 显示当前状态（如：`显示 Logo：开启`）
- ✅ 使用视觉反馈（开关颜色变化）

---

## 07. 灵活性与效率

### 设计原则
同一系统同时服务新手与专家用户。

### 实施规范

#### 7.1 快捷方式
**键盘快捷键**：
- `Ctrl/Cmd + S` → 保存草稿
- `Ctrl/Cmd + P` → 发布页面
- `Ctrl/Cmd + Z` → 撤销
- `Ctrl/Cmd + Y` → 重做
- `Esc` → 关闭模态/取消操作

**实施代码**：
```typescript
// hooks/useKeyboardShortcuts.ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSaveDraft();
    }
    // ... 其他快捷键
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### 7.2 批量操作
**支持的操作**：
- 批量上传图片（拖拽多个文件）
- 批量删除新闻项（选择多个 → 删除）
- 批量启用/禁用区块

#### 7.3 模板与预设
**提供预设配置**：
- 默认 Hero 配置（3张图片轮播）
- 常用颜色方案（深色/浅色主题）
- 布局模板（单栏/双栏/网格）

**新手引导**：
- 首次使用 → 显示引导提示
- 空状态 → 显示"开始创建"按钮 + 示例

---

## 08. 审美与简约设计

### 设计原则
只呈现当前任务所需的信息，避免视觉与信息噪音。

### 实施规范

#### 8.1 信息层级
**视觉层级**：
1. **主要操作**：大按钮、深色背景（如：发布按钮）
2. **次要操作**：中等按钮、浅色背景（如：保存草稿）
3. **辅助信息**：小字、浅色（如：提示文本）

**当前问题**：某些页面信息密度过高

**改进方案**：
- 使用折叠面板（Accordion）组织内容
- 使用标签页（Tabs）分组相关设置
- 使用卡片（Card）分隔不同功能区块

#### 8.2 留白与间距
**规范**：
- 区块之间：`mb-6`（24px）
- 元素之间：`gap-3`（12px）
- 文本行距：`leading-relaxed`（1.625）

**避免**：
- ❌ 元素紧贴边缘
- ❌ 文字过密
- ❌ 按钮过小

#### 8.3 视觉焦点
**突出重点**：
- 当前编辑的区块 → 高亮边框
- 未保存的更改 → 显示"未保存"标签
- 错误字段 → 红色边框 + 错误提示

---

## 09. 帮助用户识别、诊断和恢复错误

### 设计原则
错误提示必须"可理解 + 可行动"。

### 实施规范

#### 9.1 错误提示规范
**当前实现**：✅ Alert 组件已实现

**增强要求**：
- ✅ 使用自然语言（避免错误码）
- ✅ 明确指出原因
- ✅ 提供解决路径

**错误提示模板**：
```typescript
// ❌ 错误示例
"Error 500"
"Upload failed"

// ✅ 正确示例
"图片上传失败：文件大小超过 5MB 限制。请选择较小的图片重试。"
"保存失败：网络连接异常。请检查网络后重试，或稍后再试。"
```

#### 9.2 字段级错误
**实施规范**：
```tsx
<div>
  <input
    className={hasError ? 'border-red-500' : 'border-black/10'}
    aria-invalid={hasError}
    aria-describedby={hasError ? 'error-message' : undefined}
  />
  {hasError && (
    <div id="error-message" className="text-xs text-red-600 mt-1">
      {errorMessage}
    </div>
  )}
</div>
```

#### 9.3 恢复建议
**常见错误与恢复**：
- 图片上传失败 → 显示"重试"按钮
- 保存失败 → 显示"重试" + "保存为草稿"选项
- 网络错误 → 显示"检查网络"提示 + 自动重试

---

## 10. 帮助与文档

### 设计原则
帮助应在需要时出现，并快速解决问题。

### 实施规范

#### 10.1 上下文帮助
**实施位置**：
- 输入框旁 → 显示"?"图标，悬停显示提示
- 区块标题 → 显示"帮助"链接
- 首次使用 → 显示引导提示

**帮助内容**：
- 简短说明（1-2句话）
- 示例（如：`示例：https://example.com/image.jpg`）
- 链接到详细文档（如：`了解更多 →`）

#### 10.2 操作演示
**实施功能**：
- 图片上传 → 显示"拖拽图片到这里"提示
- 空状态 → 显示"开始创建"按钮 + 示例图片
- 首次编辑 → 显示操作提示（可关闭）

#### 10.3 文档与教程
**提供内容**：
- 快速开始指南（5分钟上手）
- 常见问题（FAQ）
- 视频教程（可选）

**访问入口**：
- 页面底部：`帮助中心` 链接
- 设置菜单：`使用教程` 选项

---

## 组件设计规范

### 通用组件

#### Button 按钮
```tsx
// 主按钮
<button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed">
  {loading ? <Spinner /> : label}
</button>

// 次按钮
<button className="border border-black/20 bg-white/70 text-black px-4 py-2 rounded-lg hover:bg-white/80">
  {label}
</button>
```

#### Input 输入框
```tsx
<div>
  <label className="block text-xs font-medium text-black mb-1.5">
    {label}
    {required && <span className="text-red-500">*</span>}
  </label>
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/30"
    aria-invalid={hasError}
    aria-describedby={hasError ? `${id}-error` : undefined}
  />
  {helpText && (
    <p className="text-[10px] text-black/50 mt-1">{helpText}</p>
  )}
  {hasError && (
    <p id={`${id}-error`} className="text-xs text-red-600 mt-1">
      {errorMessage}
    </p>
  )}
</div>
```

#### Toggle 开关
```tsx
<button
  type="button"
  onClick={onChange}
  disabled={disabled}
  className={[
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
    enabled ? "bg-black" : "bg-black/30",
    disabled && "opacity-50 cursor-not-allowed",
  ].join(" ")}
  aria-label={enabled ? "关闭" : "开启"}
>
  <span
    className={[
      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
      enabled ? "translate-x-6" : "translate-x-1",
    ].join(" ")}
  />
</button>
```

#### Alert 提示
```tsx
<div className={[
  "rounded-lg border px-3 py-2 text-xs",
  type === "error" && "border-red-500/30 bg-red-50 text-red-700",
  type === "success" && "border-emerald-500/30 bg-emerald-50 text-emerald-700",
].join(" ")}>
  <div className="flex items-center justify-between">
    <span>{message}</span>
    {onClose && (
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ×
      </button>
    )}
  </div>
</div>
```

#### Loading 加载
```tsx
// Spinner
<div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />

// Skeleton
<div className="animate-pulse bg-black/10 rounded-lg h-20" />

// Progress
<div className="w-full bg-black/10 rounded-full h-2">
  <div
    className="bg-black h-2 rounded-full transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 实施检查清单

### 优先级 P0（必须实施）
- [ ] **01. 系统状态可见性**
  - [ ] 所有异步操作显示 Loading 状态
  - [ ] 保存/发布操作显示进度反馈
  - [ ] 图片上传显示进度条

- [ ] **05. 防错设计**
  - [ ] 表单输入实时验证
  - [ ] 无效操作禁用按钮
  - [ ] 危险操作显示确认对话框

- [ ] **09. 错误识别与恢复**
  - [ ] 错误提示使用自然语言
  - [ ] 字段级错误显示
  - [ ] 提供恢复建议

### 优先级 P1（重要）
- [ ] **02. 系统与现实世界的匹配**
  - [ ] 统一使用生活化文案
  - [ ] 图标选择符合用户认知

- [ ] **04. 一致性与标准**
  - [ ] 统一按钮样式
  - [ ] 统一表单元素样式
  - [ ] 统一颜色语义

- [ ] **06. 识别优于回忆**
  - [ ] 所有输入框添加标签和提示
  - [ ] 可视化选项（颜色、位置选择）

### 优先级 P2（增强）
- [ ] **03. 用户控制与自由**
  - [ ] 实现撤销/重做功能
  - [ ] 添加面包屑导航

- [ ] **07. 灵活性与效率**
  - [ ] 实现键盘快捷键
  - [ ] 支持批量操作

- [ ] **08. 审美与简约设计**
  - [ ] 优化信息层级
  - [ ] 使用折叠面板组织内容

- [ ] **10. 帮助与文档**
  - [ ] 添加上下文帮助
  - [ ] 提供操作演示

---

## 总结

本设计规范基于尼尔森十大可用性原则，针对 VTuber CMS 系统的实际使用场景，提供了可直接落地的设计指导。

**核心改进方向**：
1. **状态反馈**：所有操作必须有明确的视觉反馈
2. **错误预防**：通过设计提前避免错误
3. **一致性**：统一视觉语言和交互模式
4. **用户控制**：提供撤销、取消、回退等控制权
5. **帮助引导**：在需要时提供上下文帮助

**实施建议**：
- 优先实施 P0 优先级项目（状态反馈、防错、错误处理）
- 逐步完善 P1 和 P2 优先级项目
- 定期进行可用性测试，收集用户反馈
- 持续迭代优化

---

**文档维护**：
- 本文档应与代码同步更新
- 新增组件时，需遵循本规范
- 定期审查实施情况，更新检查清单

