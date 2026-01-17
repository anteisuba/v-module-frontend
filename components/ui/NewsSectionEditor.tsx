// components/ui/NewsSectionEditor.tsx

"use client";

import { useState } from "react";
import { ImagePositionEditor, ConfirmDialog, Button } from "@/components/ui";
import { SectionLayoutControl } from "@/components/ui/SectionLayoutControl";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-black/70">{t("heroEditor.slides.showThumbStrip")}</label>
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
  const { t } = useI18n();
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null);
  // 获取 news section（不自动创建）
  function getNewsSection() {
    return config.sections.find((s) => s.type === "news");
  }

  // 确保 news section 存在
  function ensureNewsSection() {
    let newsSection = getNewsSection();
    if (!newsSection) {
      const newSection = {
        id: `news-${Date.now()}`,
        type: "news" as const,
        enabled: true,
        order:
          Math.max(...config.sections.map((s) => s.order), -1) + 1,
        props: {
          items: [],
        },
      };
      onConfigChange({
        ...config,
        sections: [...config.sections, newSection],
      });
      // 直接返回新创建的 section，而不是等待状态更新
      return newSection;
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
    if (disabled) return; // 如果禁用，直接返回
    
    const newItem = {
      id: `news-item-${Date.now()}`,
      src: "",
      alt: "",
      href: "",
    };

    const newsSection = getNewsSection();
    
    if (!newsSection) {
      // 如果 section 不存在，创建新的 section 并添加第一个 item
      const newSection = {
        id: `news-${Date.now()}`,
        type: "news" as const,
        enabled: true,
        order:
          Math.max(...config.sections.map((s) => s.order), -1) + 1,
        props: {
          items: [newItem],
        },
      };
      
      onConfigChange({
        ...config,
        sections: [...config.sections, newSection],
      });
    } else {
      // 如果 section 已存在，添加新的 item
      const currentItems = newsSection.props.items || [];
      const updatedItems = [...currentItems, newItem];

      onConfigChange({
        ...config,
        sections: config.sections.map((s) => {
          if (s.id === newsSection.id && s.type === "news") {
            return {
              ...s,
              type: "news" as const,
              props: {
                ...s.props,
                items: updatedItems,
              },
            };
          }
          return s;
        }),
      });
    }
  }

  // 删除新闻图片
  function removeNewsItem(itemId: string) {
    const newsSection = getNewsSection();
    if (!newsSection || newsSection.type !== "news") return;

    updateNewsItems(
      newsSection.props.items.filter((item) => item.id !== itemId)
    );
    setDeleteConfirmItemId(null);
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
      onToast?.(t("newsSectionEditor.image.uploadSuccess"));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t("common.error"));
      throw e; // 重新抛出错误，让父组件知道上传失败
    }
  }

  const newsSection = getNewsSection();

  return (
    <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">{t("newsSectionEditor.title")}</h2>
          <div className="flex items-center gap-3">
            {newsSection && (
              <ToggleSwitch
                enabled={newsSection.enabled}
                onChange={() => toggleSectionEnabled(newsSection.id)}
                disabled={disabled}
              />
            )}
            <Button
              variant="primary"
              size="md"
              onClick={addNewsItem}
              disabled={disabled}
            >
              {t("newsSectionEditor.addImage")}
            </Button>
          </div>
        </div>
        
        {/* 布局宽度控制器 */}
        {newsSection && (
          <SectionLayoutControl
            value={(newsSection.layout?.colSpan as 1 | 2 | 3 | 4) || 4}
            onChange={(colSpan) => {
              onConfigChange({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === newsSection.id
                    ? { ...s, layout: { ...s.layout, colSpan } }
                    : s
                ),
              });
            }}
          />
        )}
      </div>

      {/* 布局配置 */}
      {newsSection && (
        <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
          <h3 className="text-xs font-semibold text-black mb-2">{t("newsSectionEditor.layout.title")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 上下内边距 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                {t("newsSectionEditor.layout.paddingY")}{newsSection.props.layout?.paddingY ?? 64}
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
                {t("newsSectionEditor.layout.backgroundColor")}
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
                {t("newsSectionEditor.layout.backgroundOpacity")}
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
                {t("newsSectionEditor.layout.maxWidth")}
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
                <option value="full">{t("newsSectionEditor.layout.full")}</option>
                <option value="7xl">{t("newsSectionEditor.layout.xl7")}</option>
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
                {t("newsSectionEditor.image.title")} {index + 1}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteConfirmItemId(item.id)}
                disabled={disabled}
              >
                {t("common.delete")}
              </Button>
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
                  {t("newsSectionEditor.image.noImages")}
                </div>
              )}
            </div>

            {/* 表单字段 */}
            <div className="space-y-2">
              {/* 上传文件 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  {t("newsSectionEditor.image.upload")}
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
                  {t("newsSectionEditor.image.link")}
                </label>
                <input
                  type="text"
                  value={item.src || ""}
                  onChange={(e) =>
                    updateNewsItem(item.id, { src: e.target.value })
                  }
                  placeholder={t("newsSectionEditor.image.linkPlaceholder")}
                  className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] text-black placeholder:text-black/30"
                  disabled={uploadingIndex === -1 || disabled}
                />
              </div>

              {/* 外部链接 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  {t("newsSectionEditor.image.externalLink")}
                </label>
                <input
                  type="text"
                  value={item.href || ""}
                  onChange={(e) =>
                    updateNewsItem(item.id, { href: e.target.value })
                  }
                  placeholder={t("newsSectionEditor.image.linkPlaceholder2")}
                  className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] text-black placeholder:text-black/30"
                  disabled={uploadingIndex === -1 || disabled}
                />
              </div>

              {/* Alt 文本 */}
              <div>
                <label className="block text-[10px] text-black/70 mb-1">
                  {t("newsSectionEditor.image.alt")}
                </label>
                <input
                  type="text"
                  value={item.alt || ""}
                  onChange={(e) =>
                    updateNewsItem(item.id, { alt: e.target.value })
                  }
                  placeholder={t("newsSectionEditor.image.altPlaceholder")}
                  className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-[10px] text-black placeholder:text-black/30"
                  disabled={uploadingIndex === -1 || disabled}
                />
              </div>
            </div>

            {uploadingIndex === -1 && (
              <div className="mt-2 text-xs text-black/60">{t("common.uploading")}</div>
            )}
          </div>
        ))}

        {(!newsSection || newsSection.props.items.length === 0) && (
          <div className="py-6 text-center text-xs text-black/50">
            {t("newsSectionEditor.image.noImages")}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirmItemId !== null}
        title={t("cms.deleteConfirm.title") || "确认删除"}
        message={t("cms.deleteConfirm.message") || "确定要删除这条内容吗？此操作无法撤销。"}
        variant="danger"
        confirmLabel={t("cms.deleteConfirm.confirm") || "确定删除"}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (deleteConfirmItemId) {
            removeNewsItem(deleteConfirmItemId);
          }
        }}
        onCancel={() => setDeleteConfirmItemId(null)}
      />
    </div>
  );
}

