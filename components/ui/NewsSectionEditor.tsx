// components/ui/NewsSectionEditor.tsx

"use client";

import { ImagePositionEditor } from "@/components/ui";
import type { PageConfig, NewsSectionProps } from "@/domain/page-config/types";

interface NewsSectionEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<{ src: string }>;
  uploadingIndex?: number | null;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
}

// 通用开关组件
function ToggleSwitch({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-black/70">是否显示</label>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2",
          enabled ? "bg-black" : "bg-black/30",
          disabled && "opacity-50 cursor-not-allowed",
        ].join(" ")}
        aria-label="Toggle visibility"
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function NewsSectionEditor({
  config,
  onConfigChange,
  disabled = false,
  onUploadImage,
  uploadingIndex = null,
  onToast,
  onError,
}: NewsSectionEditorProps) {
  // 获取 news section（不自动创建）
  function getNewsSection() {
    return config.sections.find((s) => s.type === "news");
  }

  // 确保 news section 存在
  function ensureNewsSection() {
    let newsSection = getNewsSection();
    if (!newsSection) {
      onConfigChange({
        ...config,
        sections: [
          ...config.sections,
          {
            id: `news-${Date.now()}`,
            type: "news" as const,
            enabled: true,
            order:
              Math.max(...config.sections.map((s) => s.order), -1) + 1,
            props: {
              items: [],
            },
          },
        ],
      });
      newsSection = getNewsSection();
    }
    return newsSection;
  }

  // 切换 section 的 enabled 状态
  function toggleSectionEnabled(sectionId: string) {
    onConfigChange({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  }

  // 更新 news section 的 items
  function updateNewsItems(
    items: Array<{ id: string; src: string; alt?: string; href: string }>
  ) {
    ensureNewsSection();

    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.type === "news") {
          return {
            ...s,
            type: "news" as const,
            props: {
              ...s.props,
              items: items,
            },
          };
        }
        return s;
      }),
    });
  }

  // 添加新闻图片
  function addNewsItem() {
    const newsSection = getNewsSection();
    const newItem = {
      id: `news-item-${Date.now()}`,
      src: "",
      alt: "",
      href: "",
    };

    if (!newsSection) {
      onConfigChange({
        ...config,
        sections: [
          ...config.sections,
          {
            id: `news-${Date.now()}`,
            type: "news" as const,
            enabled: true,
            order:
              Math.max(...config.sections.map((s) => s.order), -1) + 1,
            props: {
              items: [newItem],
            },
          },
        ],
      });
      return;
    }

    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === newsSection.id && s.type === "news") {
          return {
            ...s,
            type: "news" as const,
            props: {
              ...s.props,
              items: [...s.props.items, newItem],
            },
          };
        }
        return s;
      }),
    });
  }

  // 删除新闻图片
  function removeNewsItem(itemId: string) {
    const newsSection = getNewsSection();
    if (!newsSection || newsSection.type !== "news") return;

    updateNewsItems(
      newsSection.props.items.filter((item) => item.id !== itemId)
    );
  }

  // 更新新闻图片
  function updateNewsItem(
    itemId: string,
    updates: {
      src?: string;
      alt?: string;
      href?: string;
      objectPosition?: string;
    }
  ) {
    ensureNewsSection();

    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.type === "news") {
          return {
            ...s,
            type: "news" as const,
            props: {
              ...s.props,
              items: s.props.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            },
          };
        }
        return s;
      }),
    });
  }

  // 上传新闻图片
  async function uploadNewsImage(itemId: string, file: File) {
    if (!onUploadImage) return;
    try {
      const result = await onUploadImage(file);
      updateNewsItem(itemId, { src: result.src });
      onToast?.("图片上传成功");
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "上传失败");
      throw e; // 重新抛出错误，让父组件知道上传失败
    }
  }

  const newsSection = getNewsSection();

  return (
    <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">图片导航</h2>
        <div className="flex items-center gap-3">
          {newsSection && (
            <ToggleSwitch
              enabled={newsSection.enabled}
              onChange={() => toggleSectionEnabled(newsSection.id)}
              disabled={disabled}
            />
          )}
          <button
            type="button"
            onClick={addNewsItem}
            disabled={disabled}
            className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加图片
          </button>
        </div>
      </div>

      {/* 布局配置 */}
      {newsSection && (
        <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
          <h3 className="text-xs font-semibold text-black mb-2">布局设置</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 上下内边距 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                上下内边距（px）：{newsSection.props.layout?.paddingY ?? 64}
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={newsSection.props.layout?.paddingY ?? 64}
                onChange={(e) => {
                  const newsSection = ensureNewsSection();
                  if (!newsSection || newsSection.type !== "news") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === newsSection.id && s.type === "news"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              layout: {
                                ...s.props.layout,
                                paddingY: parseInt(e.target.value),
                              },
                            },
                          }
                        : s
                    ),
                  });
                }}
                className="w-full"
                disabled={disabled}
              />
            </div>
            {/* 背景颜色 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                背景颜色
              </label>
              <input
                type="color"
                value={
                  newsSection.props.layout?.backgroundColor || "#000000"
                }
                onChange={(e) => {
                  const newsSection = ensureNewsSection();
                  if (!newsSection || newsSection.type !== "news") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === newsSection.id && s.type === "news"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              layout: {
                                ...s.props.layout,
                                backgroundColor: e.target.value,
                              },
                            },
                          }
                        : s
                    ),
                  });
                }}
                className="w-full h-8 rounded border border-black/10"
                disabled={disabled}
              />
            </div>
            {/* 背景透明度 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                背景透明度：
                {(
                  (newsSection.props.layout?.backgroundOpacity ?? 1) * 100
                ).toFixed(0)}
                %
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={
                  (newsSection.props.layout?.backgroundOpacity ?? 1) * 100
                }
                onChange={(e) => {
                  const newsSection = ensureNewsSection();
                  if (!newsSection || newsSection.type !== "news") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === newsSection.id && s.type === "news"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              layout: {
                                ...s.props.layout,
                                backgroundOpacity:
                                  parseInt(e.target.value) / 100,
                              },
                            },
                          }
                        : s
                    ),
                  });
                }}
                className="w-full"
                disabled={disabled}
              />
            </div>
            {/* 最大宽度 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                最大宽度
              </label>
              <select
                value={newsSection.props.layout?.maxWidth || "7xl"}
                onChange={(e) => {
                  const newsSection = ensureNewsSection();
                  if (!newsSection || newsSection.type !== "news") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === newsSection.id && s.type === "news"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              layout: {
                                ...s.props.layout,
                                maxWidth: e.target.value,
                              },
                            },
                          }
                        : s
                    ),
                  });
                }}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
                disabled={disabled}
              >
                <option value="full">全宽</option>
                <option value="7xl">7xl (最大)</option>
                <option value="6xl">6xl</option>
                <option value="5xl">5xl</option>
                <option value="4xl">4xl</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(newsSection?.props.items || []).map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-black/10 bg-white/70 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium text-black">
                图片 {index + 1}
              </div>
              <button
                type="button"
                onClick={() => removeNewsItem(item.id)}
                disabled={disabled}
                className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 transition-colors duration-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                删除
              </button>
            </div>

            {/* 预览 - 可拖拽编辑位置 */}
            <div className="mb-3">
              {item.src ? (
                <div className="aspect-[4/3] max-h-48 overflow-hidden rounded-lg border border-black/10">
                  <ImagePositionEditor
                    src={item.src}
                    alt={item.alt || `News ${index + 1}`}
                    objectPosition={item.objectPosition || "center"}
                    onChange={(position) =>
                      updateNewsItem(item.id, { objectPosition: position })
                    }
                    disabled={uploadingIndex === -1 || disabled}
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] max-h-48 flex items-center justify-center rounded-lg border border-black/10 bg-black/5 text-xs text-black/50">
                  暂无图片
                </div>
              )}
            </div>

            {/* 表单字段 */}
            <div className="space-y-2">
              {/* 上传文件 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  上传图片
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-[10px] text-black/80 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-black file:px-2 file:py-1 file:text-[10px] file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
                  disabled={uploadingIndex === -1 || disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    const inputElement = e.currentTarget;
                    if (file) {
                      uploadNewsImage(item.id, file);
                      if (inputElement) {
                        inputElement.value = "";
                      }
                    }
                  }}
                />
              </div>

              {/* 图片链接 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  图片链接
                </label>
                <input
                  type="text"
                  value={item.src || ""}
                  onChange={(e) =>
                    updateNewsItem(item.id, { src: e.target.value })
                  }
                  placeholder="图片 URL"
                  className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] text-black placeholder:text-black/30"
                  disabled={uploadingIndex === -1 || disabled}
                />
              </div>

              {/* 外部链接 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  外部链接
                </label>
                <input
                  type="text"
                  value={item.href || ""}
                  onChange={(e) =>
                    updateNewsItem(item.id, { href: e.target.value })
                  }
                  placeholder="跳转 URL"
                  className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] text-black placeholder:text-black/30"
                  disabled={uploadingIndex === -1 || disabled}
                />
              </div>

              {/* Alt 文本 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  Alt 文本
                </label>
                <input
                  type="text"
                  value={item.alt || ""}
                  onChange={(e) =>
                    updateNewsItem(item.id, { alt: e.target.value })
                  }
                  placeholder="图片描述"
                  className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] text-black placeholder:text-black/30"
                  disabled={uploadingIndex === -1 || disabled}
                />
              </div>
            </div>

            {uploadingIndex === -1 && (
              <div className="mt-2 text-xs text-black/60">上传中...</div>
            )}
          </div>
        ))}

        {(!newsSection || newsSection.props.items.length === 0) && (
          <div className="py-6 text-center text-xs text-black/50">
            暂无图片，点击"添加图片"开始添加
          </div>
        )}
      </div>
    </div>
  );
}

