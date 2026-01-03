# UX 改进实施示例

> 基于尼尔森十大可用性原则的代码实施示例  
> 本文档展示如何将设计规范应用到实际代码中

---

## 目录

1. [系统状态可见性改进](#系统状态可见性改进)
2. [防错设计改进](#防错设计改进)
3. [用户控制与自由改进](#用户控制与自由改进)
4. [一致性与标准改进](#一致性与标准改进)
5. [错误处理改进](#错误处理改进)

---

## 系统状态可见性改进

### 示例 1：增强 CMSHeader 组件

**改进前**：
```tsx
// 仅显示按钮文本变化
<button onClick={onSaveDraft}>
  {saving ? "保存中..." : "保存草稿"}
</button>
```

**改进后**：
```tsx
// 使用 SaveStatus 组件显示详细状态
import { SaveStatus } from "@/components/ui";
import { usePageConfig } from "@/hooks/usePageConfig";

function CMSHeader({ onSaveDraft, onPublish, ... }) {
  const { config, hasUnsavedChanges } = usePageConfig();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSaveDraft = async () => {
    await onSaveDraft();
    setLastSaved(new Date());
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1>页面编辑</h1>
        <SaveStatus
          saving={saving}
          publishing={publishing}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>
      {/* ... */}
    </div>
  );
}
```

### 示例 2：图片上传进度显示

**改进前**：
```tsx
// 仅显示"上传中"文本
{isUploading && <div>上传中...</div>}
```

**改进后**：
```tsx
import { LoadingState } from "@/components/ui";

async function uploadImage(file: File) {
  setUploading(true);
  setUploadProgress(0);

  try {
    const result = await pageApi.uploadImage(file, {
      onProgress: (progress) => {
        setUploadProgress(progress);
      },
    });
    // ...
  } finally {
    setUploading(false);
  }
}

// 在 UI 中
{isUploading ? (
  <LoadingState
    type="progress"
    progress={uploadProgress}
    message={`正在上传 ${fileName}...`}
  />
) : (
  <input type="file" onChange={handleFileSelect} />
)}
```

---

## 防错设计改进

### 示例 3：表单实时验证

**改进前**：
```tsx
// 提交时才验证
<input
  type="text"
  value={url}
  onChange={(e) => setUrl(e.target.value)}
/>
<button onClick={handleSubmit}>添加链接</button>
```

**改进后**：
```tsx
import { FormField } from "@/components/ui";
import { useState } from "react";

function SocialLinkForm({ onSubmit }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateUrl = (value: string) => {
    if (!value) {
      setError("请输入链接地址");
      return false;
    }
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      setError("链接必须以 http:// 或 https:// 开头");
      return false;
    }
    try {
      new URL(value);
      setError("");
      return true;
    } catch {
      setError("请输入有效的网址");
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    if (value) {
      validateUrl(value);
    } else {
      setError("");
    }
  };

  const handleSubmit = () => {
    if (validateUrl(url)) {
      onSubmit(url);
      setUrl("");
      setError("");
    }
  };

  return (
    <FormField
      label="社交链接"
      required
      error={error}
      helpText="示例：https://twitter.com/yourname"
    >
      <input
        type="url"
        value={url}
        onChange={handleChange}
        onBlur={() => validateUrl(url)}
        placeholder="https://example.com"
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs"
      />
    </FormField>
  );
}
```

### 示例 4：危险操作确认

**改进前**：
```tsx
// 直接删除，无确认
<button onClick={() => removeItem(itemId)}>
  删除
</button>
```

**改进后**：
```tsx
import { ConfirmDialog } from "@/components/ui";
import { useState } from "react";

function NewsItemEditor({ item, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="border border-red-300 bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
      >
        删除
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="确认删除"
        message="确定要删除这条新闻吗？此操作无法撤销。"
        variant="danger"
        confirmLabel="确定删除"
        onConfirm={() => {
          onDelete(item.id);
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
```

---

## 用户控制与自由改进

### 示例 5：键盘快捷键支持

**改进前**：
```tsx
// 无快捷键支持
function CMSPage() {
  return (
    <div>
      <button onClick={saveDraft}>保存草稿</button>
      <button onClick={publish}>发布</button>
    </div>
  );
}
```

**改进后**：
```tsx
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function CMSPage() {
  const { saving, publishing, saveDraft, publish } = usePageConfigActions();

  useKeyboardShortcuts({
    onSave: saveDraft,
    onPublish: publish,
    enabled: !saving && !publishing,
  });

  return (
    <div>
      <button onClick={saveDraft}>
        保存草稿 <span className="text-xs text-black/50">(Ctrl+S)</span>
      </button>
      <button onClick={publish}>
        发布 <span className="text-xs text-black/50">(Ctrl+P)</span>
      </button>
    </div>
  );
}
```

### 示例 6：撤销删除操作

**改进前**：
```tsx
// 删除后无法撤销
function removeNewsItem(itemId: string) {
  setItems(items.filter(item => item.id !== itemId));
}
```

**改进后**：
```tsx
import { useState, useEffect } from "react";
import { Alert } from "@/components/ui";

function NewsSectionEditor({ items, onItemsChange }) {
  const [deletedItem, setDeletedItem] = useState<NewsItem | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  const removeItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // 保存被删除的项
    setDeletedItem(item);
    
    // 从列表中移除
    onItemsChange(items.filter(i => i.id !== itemId));

    // 5秒后清除撤销选项
    const timeout = setTimeout(() => {
      setDeletedItem(null);
    }, 5000);
    setUndoTimeout(timeout);
  };

  const undoDelete = () => {
    if (deletedItem) {
      onItemsChange([...items, deletedItem]);
      setDeletedItem(null);
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
    }
  };

  return (
    <div>
      {deletedItem && (
        <Alert
          type="info"
          message={
            <span>
              已删除 "{deletedItem.title}"。
              <button
                onClick={undoDelete}
                className="ml-2 underline font-medium"
              >
                撤销
              </button>
            </span>
          }
          onClose={() => {
            setDeletedItem(null);
            if (undoTimeout) clearTimeout(undoTimeout);
          }}
        />
      )}
      {/* ... */}
    </div>
  );
}
```

---

## 一致性与标准改进

### 示例 7：统一按钮组件

**改进前**：
```tsx
// 按钮样式不统一
<button className="bg-black text-white px-3 py-1.5">保存</button>
<button className="bg-white border border-black px-4 py-2">取消</button>
<button className="text-red-600">删除</button>
```

**改进后**：
```tsx
// 创建统一的 Button 组件
// components/ui/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "text";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
  // ...其他 props
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-black text-white hover:bg-black/90",
    secondary: "border border-black/20 bg-white/70 text-black hover:bg-white/80",
    danger: "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100",
    text: "text-black/70 hover:text-black underline",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2.5 text-sm",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <LoadingState type="spinner" size="sm" /> : children}
    </button>
  );
}

// 使用
import { Button } from "@/components/ui";

<Button variant="primary" onClick={saveDraft} loading={saving}>
  保存草稿
</Button>
<Button variant="secondary" onClick={cancel}>
  取消
</Button>
<Button variant="danger" onClick={handleDelete}>
  删除
</Button>
```

---

## 错误处理改进

### 示例 8：友好的错误提示

**改进前**：
```tsx
// 技术性错误信息
catch (error) {
  setError(error.message); // "NetworkError: Failed to fetch"
}
```

**改进后**：
```tsx
import { Alert } from "@/components/ui";

function handleError(error: unknown) {
  let message = "操作失败，请稍后重试";

  if (error instanceof Error) {
    // 网络错误
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      message = "网络连接异常。请检查网络后重试，或稍后再试。";
    }
    // 权限错误
    else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      message = "登录已过期，请重新登录。";
    }
    // 服务器错误
    else if (error.message.includes("500")) {
      message = "服务器暂时无法处理请求，请稍后重试。";
    }
    // 文件大小错误
    else if (error.message.includes("413") || error.message.includes("too large")) {
      message = "文件大小超过 5MB 限制。请选择较小的文件重试。";
    }
    // 其他错误，使用原始消息（如果友好）
    else if (!error.message.includes("Error") && !error.message.includes("Exception")) {
      message = error.message;
    }
  }

  return message;
}

// 使用
try {
  await uploadImage(file);
} catch (error) {
  const friendlyMessage = handleError(error);
  setError(friendlyMessage);
}

// 在 UI 中
{error && (
  <Alert
    type="error"
    message={error}
    onClose={() => setError("")}
  />
)}
```

### 示例 9：字段级错误显示

**改进前**：
```tsx
// 全局错误提示
{error && <Alert type="error" message={error} />}
```

**改进后**：
```tsx
import { FormField } from "@/components/ui";

function HeroSectionEditor() {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");

  const validateTitle = (value: string) => {
    if (value.length > 50) {
      setTitleError("标题不能超过 50 个字符");
      return false;
    }
    setTitleError("");
    return true;
  };

  return (
    <FormField
      label="标题"
      required
      error={titleError}
      helpText={`${title.length}/50 字符`}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          validateTitle(e.target.value);
        }}
        onBlur={() => validateTitle(title)}
        maxLength={50}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs"
      />
    </FormField>
  );
}
```

---

## 完整集成示例

### 示例 10：改进后的 CMS 页面

```tsx
// app/admin/cms/page.tsx (改进版)

"use client";

import { useState } from "react";
import {
  CMSHeader,
  HeroSectionEditor,
  NewsSectionEditor,
  SaveStatus,
  ConfirmDialog,
  Alert,
} from "@/components/ui";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";

export default function CMSPage() {
  const { config, setConfig, loading, hasUnsavedChanges } = usePageConfig();
  const { saving, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [error, setError] = useState("");

  // 键盘快捷键
  useKeyboardShortcuts({
    onSave: async () => {
      try {
        await saveDraft();
        setLastSaved(new Date());
      } catch (e) {
        setError(handleError(e));
      }
    },
    onPublish: () => setShowPublishConfirm(true),
    enabled: !saving && !publishing,
  });

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      setLastSaved(new Date());
      setError("");
    } catch (e) {
      setError(handleError(e));
    }
  };

  const handlePublish = async () => {
    try {
      await publish();
      setShowPublishConfirm(false);
      setLastSaved(new Date());
      setError("");
    } catch (e) {
      setError(handleError(e));
    }
  };

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <LoadingState type="spinner" size="lg" message="加载中..." />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 头部：带状态显示 */}
        <CMSHeader
          onSaveDraft={handleSaveDraft}
          onPublish={() => setShowPublishConfirm(true)}
          saving={saving}
          publishing={publishing}
        />
        
        {/* 保存状态 */}
        <SaveStatus
          saving={saving}
          publishing={publishing}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          className="mb-4"
        />

        {/* 错误提示 */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
            className="mb-4"
          />
        )}

        {/* 编辑器 */}
        <HeroSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
        />

        {/* 发布确认对话框 */}
        <ConfirmDialog
          open={showPublishConfirm}
          title="确认发布"
          message="确定要发布页面吗？发布后将对所有访客可见。"
          confirmLabel="确定发布"
          onConfirm={handlePublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
      </div>
    </main>
  );
}
```

---

## 总结

以上示例展示了如何将尼尔森十大可用性原则应用到实际代码中：

1. **系统状态可见性**：使用 `LoadingState` 和 `SaveStatus` 组件
2. **防错设计**：使用 `FormField` 进行实时验证
3. **用户控制**：使用 `ConfirmDialog` 和键盘快捷键
4. **一致性**：统一按钮和表单样式
5. **错误处理**：友好的错误提示和字段级验证

**下一步**：
1. 逐步将这些改进应用到现有组件中
2. 进行可用性测试，收集用户反馈
3. 持续迭代优化

