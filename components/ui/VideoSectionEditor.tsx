// components/ui/VideoSectionEditor.tsx

"use client";

import { useState, useEffect } from "react";
import { ConfirmDialog, Button, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { detectPlatform } from "@/features/video-section";
import VideoPlayer from "@/features/video-section/components/VideoPlayer";
import type { PageConfig, VideoSectionProps } from "@/domain/page-config/types";

interface VideoSectionEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
}

// 通用开关组件
function ToggleSwitch({
  enabled,
  onChange,
  disabled,
  label,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-black/70">{label}</label>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2",
          enabled ? "bg-black" : "bg-black/30",
          disabled && "opacity-50 cursor-not-allowed",
        ].join(" ")}
        aria-label="Toggle"
      >
        <span
          className={[
            "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-5" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function VideoSectionEditor({
  config,
  onConfigChange,
  disabled = false,
  onToast,
  onError,
}: VideoSectionEditorProps) {
  const { t } = useI18n();
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null);
  
  // 获取 video section（不自动创建）
  function getVideoSection() {
    return config.sections.find((s) => s.type === "video");
  }

  // 确保 video section 存在
  function ensureVideoSection() {
    let videoSection = getVideoSection();
    if (!videoSection) {
      const newSection = {
        id: `video-${Date.now()}`,
        type: "video" as const,
        enabled: false, // 默认关闭（因为没有视频）
        order: Math.max(...config.sections.map((s) => s.order), -1) + 1,
        props: {
          items: [],
        },
      };
      onConfigChange({
        ...config,
        sections: [...config.sections, newSection],
      });
      videoSection = getVideoSection();
    }
    return videoSection;
  }

  // 检查是否有有效视频（URL 不为空）
  function hasValidVideos(items: VideoSectionProps["items"]): boolean {
    return items.some((item) => item.url && item.url.trim() !== "");
  }

  // 初始化时检查并更新 enabled 状态（只在组件首次加载时检查一次）
  useEffect(() => {
    const videoSection = getVideoSection();
    if (videoSection && videoSection.type === "video") {
      const hasValid = hasValidVideos(videoSection.props.items);
      // 如果状态不一致，更新它（但只在首次加载时）
      if (videoSection.enabled !== hasValid) {
        // 使用 setTimeout 避免在渲染过程中更新状态
        setTimeout(() => {
          onConfigChange({
            ...config,
            sections: config.sections.map((s) =>
              s.id === videoSection.id && s.type === "video"
                ? { ...s, enabled: hasValid }
                : s
            ),
          });
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时检查一次

  // 切换 section 的 enabled 状态
  function toggleSectionEnabled(sectionId: string) {
    onConfigChange({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  }

  // 添加视频
  function addVideoItem() {
    const videoSection = getVideoSection();
    const newItem = {
      id: `video-item-${Date.now()}`,
      url: "",
      platform: "auto" as const,
    };

    if (!videoSection) {
      const newSection = {
        id: `video-${Date.now()}`,
        type: "video" as const,
        enabled: false, // 新添加的视频 URL 为空，所以默认关闭
        order: Math.max(...config.sections.map((s) => s.order), -1) + 1,
        props: {
          items: [newItem],
        },
      };
      onConfigChange({
        ...config,
        sections: [...config.sections, newSection],
      });
      return;
    }

    const updatedItems = [...videoSection.props.items, newItem];
    const hasValid = hasValidVideos(updatedItems);
    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === videoSection.id && s.type === "video") {
          return {
            ...s,
            type: "video" as const,
            enabled: hasValid, // 自动更新 enabled 状态
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

  // 删除视频
  function removeVideoItem(itemId: string) {
    const videoSection = getVideoSection();
    if (!videoSection || videoSection.type !== "video") return;

    const updatedItems = videoSection.props.items.filter((item) => item.id !== itemId);
    const hasValid = hasValidVideos(updatedItems);
    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === videoSection.id && s.type === "video") {
          return {
            ...s,
            type: "video" as const,
            enabled: hasValid, // 自动更新 enabled 状态
            props: {
              ...s.props,
              items: updatedItems,
            },
          };
        }
        return s;
      }),
    });
    setDeleteConfirmItemId(null);
  }

  // 更新视频
  function updateVideoItem(
    itemId: string,
    updates: Partial<VideoSectionProps["items"][0]>
  ) {
    const videoSection = getVideoSection();
    if (!videoSection || videoSection.type !== "video") {
      ensureVideoSection();
      return;
    }

    const updatedItems = videoSection.props.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const hasValid = hasValidVideos(updatedItems);
    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === videoSection.id && s.type === "video") {
          return {
            ...s,
            type: "video" as const,
            enabled: hasValid, // 自动更新 enabled 状态
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

  const videoSection = getVideoSection();

  return (
    <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">视频区块</h2>
        <div className="flex items-center gap-3">
          {videoSection && (
            <ToggleSwitch
              enabled={videoSection.enabled}
              onChange={() => toggleSectionEnabled(videoSection.id)}
              disabled={disabled}
              label="显示"
            />
          )}
          <Button
            variant="primary"
            size="md"
            onClick={addVideoItem}
            disabled={disabled}
          >
            添加视频
          </Button>
        </div>
      </div>

      {/* 布局配置 */}
      {videoSection && (
        <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
          <h3 className="text-xs font-semibold text-black mb-2">布局设置</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 上下内边距 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                上下内边距: {videoSection.props.layout?.paddingY ?? 64}px
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={videoSection.props.layout?.paddingY ?? 64}
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
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
                  videoSection.props.layout?.backgroundColor || "#000000"
                }
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
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
                背景透明度:{" "}
                {((videoSection.props.layout?.backgroundOpacity ?? 1) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={
                  (videoSection.props.layout?.backgroundOpacity ?? 1) * 100
                }
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              layout: {
                                ...s.props.layout,
                                backgroundOpacity: parseInt(e.target.value) / 100,
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
                value={videoSection.props.layout?.maxWidth || "7xl"}
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
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
                <option value="7xl">7xl</option>
                <option value="6xl">6xl</option>
                <option value="5xl">5xl</option>
                <option value="4xl">4xl</option>
              </select>
            </div>
            {/* 宽高比 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">
                宽高比
              </label>
              <select
                value={videoSection.props.layout?.aspectRatio || "16:9"}
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              layout: {
                                ...s.props.layout,
                                aspectRatio: e.target.value as "16:9" | "4:3" | "1:1" | "auto",
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
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
                <option value="auto">自动</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 显示配置（多视频时） */}
      {videoSection && videoSection.props.items.length > 1 && (
        <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
          <h3 className="text-xs font-semibold text-black mb-2">显示设置</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* 列数 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">列数</label>
              <select
                value={videoSection.props.display?.columns || 1}
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              display: {
                                ...s.props.display,
                                columns: parseInt(e.target.value) as 1 | 2 | 3,
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
                <option value="1">1 列</option>
                <option value="2">2 列</option>
                <option value="3">3 列</option>
              </select>
            </div>
            {/* 间距 */}
            <div>
              <label className="block text-xs text-black/70 mb-2">间距</label>
              <select
                value={videoSection.props.display?.gap || "md"}
                onChange={(e) => {
                  const videoSection = ensureVideoSection();
                  if (!videoSection || videoSection.type !== "video") return;
                  onConfigChange({
                    ...config,
                    sections: config.sections.map((s) =>
                      s.id === videoSection.id && s.type === "video"
                        ? {
                            ...s,
                            props: {
                              ...s.props,
                              display: {
                                ...s.props.display,
                                gap: e.target.value as "sm" | "md" | "lg",
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
                <option value="sm">小</option>
                <option value="md">中</option>
                <option value="lg">大</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 视频列表 */}
      <div className="space-y-4">
        {(videoSection?.props.items || []).map((item, index) => {
          const detectedPlatform = detectPlatform(item.url);
          const platformName = detectedPlatform === 'youtube' ? 'YouTube' : detectedPlatform === 'bilibili' ? 'Bilibili' : '未知';
          
          return (
            <div
              key={item.id}
              className="rounded-lg border border-black/10 bg-white/70 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-medium text-black">
                  视频 {index + 1}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteConfirmItemId(item.id)}
                  disabled={disabled}
                >
                  删除
                </Button>
              </div>

              {/* 视频 URL 输入 */}
              <div className="mb-3">
                <Input
                  label="视频链接"
                  value={item.url}
                  onChange={(e) =>
                    updateVideoItem(item.id, { url: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=... 或 https://www.bilibili.com/video/BV..."
                  helpText="支持 YouTube 和 Bilibili 链接"
                  disabled={disabled}
                />
                {item.url && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-black/70">
                    <span>平台：</span>
                    <span className="font-medium">{platformName}</span>
                  </div>
                )}
              </div>

              {/* 视频预览 */}
              {item.url && item.url.trim() && detectPlatform(item.url) && (
                <div className="mb-3 aspect-[16/9] rounded-lg border border-black/10 overflow-hidden bg-black/5 relative">
                  <VideoPlayer item={item} className="absolute inset-0" />
                </div>
              )}

              {/* 视频选项 */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <ToggleSwitch
                    enabled={item.autoplay ?? false}
                    onChange={() =>
                      updateVideoItem(item.id, {
                        autoplay: !item.autoplay,
                      })
                    }
                    disabled={disabled}
                    label="自动播放"
                  />
                  <ToggleSwitch
                    enabled={item.muted ?? false}
                    onChange={() =>
                      updateVideoItem(item.id, { muted: !item.muted })
                    }
                    disabled={disabled}
                    label="静音"
                  />
                  <ToggleSwitch
                    enabled={item.loop ?? false}
                    onChange={() =>
                      updateVideoItem(item.id, { loop: !item.loop })
                    }
                    disabled={disabled}
                    label="循环播放"
                  />
                  <ToggleSwitch
                    enabled={item.controls !== false}
                    onChange={() =>
                      updateVideoItem(item.id, {
                        controls: item.controls === false,
                      })
                    }
                    disabled={disabled}
                    label="显示控制条"
                  />
                </div>
                
                {/* 开始时间 */}
                <div>
                  <label className="block text-xs text-black/70 mb-1">
                    开始时间（秒）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.startTime || 0}
                    onChange={(e) =>
                      updateVideoItem(item.id, {
                        startTime: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-black/10 bg-white/70 px-2 py-1 text-xs text-black"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {(!videoSection || videoSection.props.items.length === 0) && (
          <div className="py-6 text-center text-xs text-black/50">
            暂无视频，点击"添加视频"按钮添加
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirmItemId !== null}
        title="确认删除"
        message="确定要删除这个视频吗？此操作无法撤销。"
        variant="danger"
        confirmLabel="确定删除"
        cancelLabel="取消"
        onConfirm={() => {
          if (deleteConfirmItemId) {
            removeVideoItem(deleteConfirmItemId);
          }
        }}
        onCancel={() => setDeleteConfirmItemId(null)}
      />
    </div>
  );
}

