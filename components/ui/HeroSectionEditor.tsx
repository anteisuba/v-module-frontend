// components/ui/HeroSectionEditor.tsx

"use client";

import { ImagePositionEditor, IconPicker } from "@/components/ui";
import type {
  PageConfig,
  HeroSectionProps,
  SocialLinkItem,
} from "@/domain/page-config/types";

interface HeroSectionEditorProps {
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

export default function HeroSectionEditor({
  config,
  onConfigChange,
  disabled = false,
  onUploadImage,
  uploadingIndex = null,
  onToast,
  onError,
}: HeroSectionEditorProps) {
  // 获取 hero section
  function getHeroSection() {
    return config.sections.find((s) => s.type === "hero");
  }

  // 确保 hero section 存在
  function ensureHeroSection(): {
    id: string;
    type: "hero";
    enabled: boolean;
    order: number;
    props: HeroSectionProps;
  } {
    const heroSection = getHeroSection();
    if (!heroSection) {
      const newHeroSection: {
        id: string;
        type: "hero";
        enabled: boolean;
        order: number;
        props: HeroSectionProps;
      } = {
        id: `hero-${Date.now()}`,
        type: "hero",
        enabled: true,
        order: 0,
        props: {
          slides: [],
          title: "",
          subtitle: "",
        },
      };
      onConfigChange({
        ...config,
        sections: [...config.sections, newHeroSection],
      });
      return newHeroSection;
    }
    return heroSection;
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

  // 切换 Logo 显示
  function toggleLogoEnabled() {
    const currentValue = config.showLogo !== false;
    onConfigChange({
      ...config,
      showLogo: !currentValue,
    });
  }

  // 切换社交链接显示
  function toggleSocialLinksEnabled() {
    const currentValue = config.showSocialLinks !== false;
    onConfigChange({
      ...config,
      showSocialLinks: !currentValue,
    });
  }

  // 更新 hero section 的图片
  function updateHeroSlide(
    index: number,
    updates: {
      src?: string;
      alt?: string;
      objectPosition?: string;
    }
  ) {
    const heroSection = ensureHeroSection();
    if (heroSection.type !== "hero") return;

    const slides = [...(heroSection.props.slides || [])];

    // 确保至少有 index+1 个元素
    while (slides.length <= index) {
      slides.push({ src: "", alt: "" });
    }

    slides[index] = {
      ...slides[index],
      ...(updates.src !== undefined && { src: updates.src.trim() }),
      ...(updates.alt !== undefined && {
        alt: updates.alt?.trim() || slides[index]?.alt?.trim() || "",
      }),
      ...(updates.objectPosition !== undefined && {
        objectPosition: updates.objectPosition,
      }),
    };

    onConfigChange({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === heroSection.id && s.type === "hero") {
          return {
            ...s,
            type: "hero" as const,
            props: {
              ...s.props,
              slides: slides,
            },
          };
        }
        return s;
      }),
    });
  }

  // 上传图片
  async function uploadImage(index: number, file: File) {
    if (!onUploadImage) return;
    try {
      const result = await onUploadImage(file);
      updateHeroSlide(index, { src: result.src });
      onToast?.(`图片 ${index + 1} 上传成功`);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "上传失败");
    }
  }

  // 使用图片链接
  function useImageUrl(index: number, url: string) {
    updateHeroSlide(index, { src: url });
    onToast?.(`图片 ${index + 1} 已更新`);
  }

  const heroSection = getHeroSection();
  let heroSlides = heroSection?.props.slides || [];

  // 确保至少有 3 个位置（用于 UI 显示），但允许空的 src
  while (heroSlides.length < 3) {
    heroSlides.push({ src: "", alt: "" });
  }

  // 限制为最多 3 张
  heroSlides = heroSlides.slice(0, 3);

  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-black">
          顶部内容 (Hero Section)
        </h2>
        {heroSection ? (
          <ToggleSwitch
            enabled={heroSection.enabled}
            onChange={() => toggleSectionEnabled(heroSection.id)}
            disabled={disabled}
          />
        ) : null}
      </div>

      {/* Logo 编辑（左上角） */}
      <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-black">Logo（左上角）</h3>
          <ToggleSwitch
            enabled={config.showLogo !== false}
            onChange={toggleLogoEnabled}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs text-black/70 mb-2">
            Logo 图片 URL（留空则显示文字 "ano"）
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={config.logo?.src || ""}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  logo: {
                    ...config.logo,
                    src: e.target.value || undefined,
                    alt: config.logo?.alt || "Logo",
                  },
                })
              }
              placeholder="/path/to/logo.png 或 https://example.com/logo.png"
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
            />
            {/* Logo 预览 */}
            <div className="h-12 w-12 rounded-sm bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 overflow-hidden flex-shrink-0">
              {config.logo?.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.logo.src}
                  alt={config.logo.alt || "Logo"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-white text-xs tracking-[0.25em]">
                  ano
                </span>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs text-black/70 mb-2">
            上传 Logo 图片
          </label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-xs text-black/80 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
            disabled={disabled}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              const inputElement = e.currentTarget;
              if (file && onUploadImage) {
                try {
                  const result = await onUploadImage(file);
                  onConfigChange({
                    ...config,
                    logo: {
                      ...config.logo,
                      src: result.src,
                      alt: config.logo?.alt || "Logo",
                    },
                  });
                  onToast?.("Logo 上传成功");
                } catch (err) {
                  onError?.(err instanceof Error ? err.message : "上传失败");
                } finally {
                  if (inputElement) {
                    inputElement.value = "";
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* 社交链接编辑（右上角） */}
      <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-black">社交链接（右上角）</h3>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              enabled={config.showSocialLinks !== false}
              onChange={toggleSocialLinksEnabled}
              disabled={disabled}
            />
            <button
              onClick={() => {
                const newLink: SocialLinkItem = {
                  id: `social-${Date.now()}`,
                  name: "新链接",
                  url: "",
                  icon: "",
                  enabled: true,
                };
                onConfigChange({
                  ...config,
                  socialLinks: [...(config.socialLinks || []), newLink],
                });
              }}
              className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            >
              + 新增
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {(config.socialLinks || []).map((link, index) => (
            <div
              key={link.id}
              className="rounded-lg border border-black/10 bg-white/70 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-black/50">#{index + 1}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => {
                        const updated = [...(config.socialLinks || [])];
                        updated[index] = {
                          ...link,
                          enabled: e.target.checked,
                        };
                        onConfigChange({
                          ...config,
                          socialLinks: updated,
                        });
                      }}
                      className="toggle toggle-sm"
                    />
                    <span className="text-[10px] text-black/70">显示</span>
                  </label>
                </div>
                <button
                  onClick={() => {
                    const updated = (config.socialLinks || []).filter(
                      (_, i) => i !== index
                    );
                    onConfigChange({
                      ...config,
                      socialLinks: updated,
                    });
                  }}
                  className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100"
                >
                  删除
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* 名称 */}
                <div>
                  <label className="block text-[10px] text-black/70 mb-1">
                    名称
                  </label>
                  <input
                    type="text"
                    value={link.name}
                    onChange={(e) => {
                      const updated = [...(config.socialLinks || [])];
                      updated[index] = { ...link, name: e.target.value };
                      onConfigChange({
                        ...config,
                        socialLinks: updated,
                      });
                    }}
                    placeholder="例如：Twitter"
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs text-black"
                  />
                </div>

                {/* 链接 */}
                <div>
                  <label className="block text-[10px] text-black/70 mb-1">
                    链接 URL
                  </label>
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...(config.socialLinks || [])];
                      updated[index] = { ...link, url: e.target.value };
                      onConfigChange({
                        ...config,
                        socialLinks: updated,
                      });
                    }}
                    placeholder="https://example.com"
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs text-black"
                  />
                </div>
              </div>

              {/* 图标 - 使用 IconPicker */}
              <div className="mt-2">
                <label className="block text-[10px] text-black/70 mb-1">
                  图标（可选：选择图标、输入文字如 "X"、"YT"，emoji 如 🐦，或图片 URL）
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <IconPicker
                      value={
                        link.icon?.startsWith("icon:")
                          ? link.icon.replace("icon:", "")
                          : undefined
                      }
                      onChange={(iconId) => {
                        const updated = [...(config.socialLinks || [])];
                        updated[index] = {
                          ...link,
                          icon: iconId ? `icon:${iconId}` : "",
                        };
                        onConfigChange({
                          ...config,
                          socialLinks: updated,
                        });
                      }}
                      disabled={disabled}
                    />
                  </div>
                  <input
                    type="text"
                    value={
                      link.icon?.startsWith("icon:") ? "" : link.icon || ""
                    }
                    onChange={(e) => {
                      const updated = [...(config.socialLinks || [])];
                      updated[index] = {
                        ...link,
                        icon: e.target.value || undefined,
                      };
                      onConfigChange({
                        ...config,
                        socialLinks: updated,
                      });
                    }}
                    placeholder="或输入文字/emoji/图片URL"
                    className="flex-1 rounded border border-black/10 bg-white px-2 py-1 text-xs text-black"
                  />
                  {/* 图标预览 */}
                  {link.icon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded border border-black/10 bg-white/70 flex-shrink-0">
                      {link.icon.startsWith("icon:") ? (
                        <span className="text-xs text-black/50">✓</span>
                      ) : link.icon.match(
                          /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i
                        ) ||
                        link.icon.startsWith("http://") ||
                        link.icon.startsWith("https://") ||
                        link.icon.startsWith("/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={link.icon}
                          alt="icon preview"
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-sm">{link.icon}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(!config.socialLinks || config.socialLinks.length === 0) && (
            <div className="rounded border border-dashed border-black/20 bg-white/50 p-4 text-center text-xs text-black/50">
              暂无社交链接，点击上方"新增"按钮添加
            </div>
          )}
        </div>
      </div>

      {/* Title 和 Subtitle 编辑 */}
      <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">
            标题（Title）
          </label>
          <input
            type="text"
            value={heroSection?.props.title || ""}
            onChange={(e) => {
              const heroSection = ensureHeroSection();
              const newTitle = e.target.value || undefined;

              onConfigChange({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === heroSection.id && s.type === "hero"
                    ? {
                        ...s,
                        props: {
                          ...s.props,
                          title: newTitle,
                        },
                      }
                    : s
                ),
              });
            }}
            placeholder="例如：Welcome"
            className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1.5">
            副标题（Subtitle）
          </label>
          <input
            type="text"
            value={heroSection?.props.subtitle || ""}
            onChange={(e) => {
              const heroSection = ensureHeroSection();
              const newSubtitle = e.target.value || undefined;

              onConfigChange({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === heroSection.id && s.type === "hero"
                    ? {
                        ...s,
                        props: {
                          ...s.props,
                          subtitle: newSubtitle,
                        },
                      }
                    : s
                ),
              });
            }}
            placeholder="例如：VTuber Personal Page"
            className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
          />
        </div>
      </div>

      {/* 布局配置 */}
      <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
        <h3 className="text-xs font-semibold text-black mb-2">布局设置</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 高度设置 */}
          <div>
            <label className="block text-xs text-black/70 mb-2">
              高度（vh）：{heroSection?.props.layout?.heightVh ?? 150}
            </label>
            <input
              type="range"
              min="50"
              max="300"
              value={heroSection?.props.layout?.heightVh ?? 150}
              onChange={(e) => {
                const heroSection = ensureHeroSection();
                onConfigChange({
                  ...config,
                  sections: config.sections.map((s) =>
                    s.id === heroSection.id && s.type === "hero"
                      ? {
                          ...s,
                          props: {
                            ...s.props,
                            layout: {
                              ...s.props.layout,
                              heightVh: parseInt(e.target.value),
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
                heroSection?.props.layout?.backgroundColor || "#000000"
              }
              onChange={(e) => {
                const heroSection = ensureHeroSection();
                onConfigChange({
                  ...config,
                  sections: config.sections.map((s) =>
                    s.id === heroSection.id && s.type === "hero"
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
                (heroSection?.props.layout?.backgroundOpacity ?? 1) * 100
              ).toFixed(0)}
              %
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={
                (heroSection?.props.layout?.backgroundOpacity ?? 1) * 100
              }
              onChange={(e) => {
                const heroSection = ensureHeroSection();
                onConfigChange({
                  ...config,
                  sections: config.sections.map((s) =>
                    s.id === heroSection.id && s.type === "hero"
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
        </div>
      </div>

      {/* 图片编辑 */}
      <div className="mb-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-black">
            轮播图片（3张）
          </h3>
          {/* Hero 缩略图条显示开关 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-black/70">是否显示</label>
            <button
              type="button"
              onClick={() => {
                const currentValue = config.showHeroThumbStrip ?? true;
                onConfigChange({
                  ...config,
                  showHeroThumbStrip: !currentValue,
                });
              }}
              disabled={disabled}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2",
                config.showHeroThumbStrip ?? true
                  ? "bg-black"
                  : "bg-black/30",
                disabled && "opacity-50 cursor-not-allowed",
              ].join(" ")}
              aria-label="Toggle hero thumb strip"
            >
              <span
                className={[
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  config.showHeroThumbStrip ?? true
                    ? "translate-x-6"
                    : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => {
            const slide = heroSlides[index];
            const isUploading = uploadingIndex === index;

            return (
              <div
                key={index}
                className="rounded-lg border border-black/10 bg-white/70 p-3"
              >
                <div className="mb-2 text-xs font-medium text-black">
                  图片 {index + 1}
                </div>

                {/* 预览 - 可拖拽编辑位置 */}
                <div className="mb-4">
                  {slide?.src ? (
                    <ImagePositionEditor
                      src={slide.src}
                      alt={slide.alt || `Hero ${index + 1}`}
                      objectPosition={slide.objectPosition || "center"}
                      onChange={(position) =>
                        updateHeroSlide(index, { objectPosition: position })
                      }
                      disabled={isUploading || disabled}
                    />
                  ) : (
                    <div className="aspect-[4/3] flex items-center justify-center rounded-lg border border-black/10 bg-black/5 text-xs text-black/50">
                      暂无图片
                    </div>
                  )}
                </div>

                {/* 上传文件 */}
                <div className="mb-3">
                  <label className="block text-xs text-black/70">
                    上传本地图片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-xs text-black/80 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
                    disabled={isUploading || disabled}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const inputElement = e.currentTarget;
                      if (file) {
                        uploadImage(index, file);
                        if (inputElement) {
                          inputElement.value = "";
                        }
                      }
                    }}
                  />
                </div>

                {/* 或使用图片链接 */}
                <div>
                  <label className="block text-xs text-black/70">
                    或输入图片链接
                  </label>
                  <input
                    type="text"
                    value={slide?.src || ""}
                    onChange={(e) => useImageUrl(index, e.target.value)}
                    placeholder="https://example.com/image.jpg 或 /path/to/image.jpg"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                    disabled={isUploading || disabled}
                  />
                </div>

                {isUploading && (
                  <div className="mt-2 text-xs text-black/60">上传中...</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

