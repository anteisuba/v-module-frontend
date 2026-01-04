// components/ui/HeroSectionEditor.tsx

"use client";

import { useState } from "react";
import { ImagePositionEditor, IconPicker, Button, Input, ConfirmDialog } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
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

export default function HeroSectionEditor({
  config,
  onConfigChange,
  disabled = false,
  onUploadImage,
  uploadingIndex = null,
  onToast,
  onError,
}: HeroSectionEditorProps) {
  const { t } = useI18n();
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [deleteSocialLinkIndex, setDeleteSocialLinkIndex] = useState<number | null>(null);
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

  // 添加新图片
  function addSlide() {
    const heroSection = getHeroSection();
    
    // 如果 hero section 不存在，直接创建包含新 slide 的 hero section
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
          slides: [{ src: "", alt: "" }],
          title: "",
          subtitle: "",
        },
      };
      onConfigChange({
        ...config,
        sections: [...config.sections, newHeroSection],
      });
      return;
    }
    
    // 如果 hero section 存在，添加新的 slide
    const currentSlides = heroSection.props.slides || [];
    onConfigChange({
      ...config,
      sections: config.sections.map((s) =>
        s.id === heroSection.id && s.type === "hero"
          ? {
              ...s,
              props: {
                ...s.props,
                slides: [...currentSlides, { src: "", alt: "" }],
              },
            }
          : s
      ),
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
      onToast?.(t("heroEditor.slides.uploadSuccess").replace("{index}", String(index + 1)));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t("common.error"));
    }
  }

  // 使用图片链接
  function useImageUrl(index: number, url: string) {
    updateHeroSlide(index, { src: url });
    onToast?.(t("heroEditor.slides.updated").replace("{index}", String(index + 1)));
  }

  // 删除图片
  function deleteSlide(index: number) {
    const heroSection = ensureHeroSection();
    const currentSlides = heroSection.props.slides || [];
    const updatedSlides = currentSlides.filter((_, i) => i !== index);
    
    onConfigChange({
      ...config,
      sections: config.sections.map((s) =>
        s.id === heroSection.id && s.type === "hero"
          ? {
              ...s,
              props: {
                ...s.props,
                slides: updatedSlides,
              },
            }
          : s
      ),
    });
    
    setDeleteConfirmIndex(null);
    onToast?.(t("heroEditor.slides.deleted").replace("{index}", String(index + 1)));
  }

  const heroSection = getHeroSection();
  const heroSlides = heroSection?.props.slides || [];
  const carouselInterval = heroSection?.props.carousel?.autoplayInterval ?? 5;
  const carouselTransition = heroSection?.props.carousel?.transitionDuration ?? 0.5;

  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-black">
          {t("heroEditor.title")}
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
          <h3 className="text-xs font-semibold text-black">{t("heroEditor.logo.title")}</h3>
          <ToggleSwitch
            enabled={config.showLogo !== false}
            onChange={toggleLogoEnabled}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs text-black/70 mb-2">
            {t("heroEditor.logo.url")}
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
                    opacity: config.logo?.opacity ?? 1,
                  },
                })
              }
              placeholder={t("heroEditor.logo.url")}
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
            />
            {/* Logo 预览 */}
            <div 
              className="h-12 w-12 rounded-sm bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 overflow-hidden flex-shrink-0"
              style={{ opacity: config.logo?.opacity ?? 1 }}
            >
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
            {t("heroEditor.logo.upload")}
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
                      opacity: config.logo?.opacity ?? 1,
                    },
                  });
                  onToast?.(t("heroEditor.logo.uploadSuccess"));
                } catch (err) {
                  onError?.(err instanceof Error ? err.message : t("common.error"));
                } finally {
                  if (inputElement) {
                    inputElement.value = "";
                  }
                }
              }
            }}
          />
        </div>
        
        {/* Logo 透明度调整 */}
        <div>
          <label className="block text-xs text-black/70 mb-2">
            {t("heroEditor.logo.opacity")}：{Math.round((config.logo?.opacity ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={(config.logo?.opacity ?? 1) * 100}
            onChange={(e) => {
              onConfigChange({
                ...config,
                logo: {
                  ...config.logo,
                  src: config.logo?.src,
                  alt: config.logo?.alt || "Logo",
                  opacity: parseInt(e.target.value) / 100,
                },
              });
            }}
            className="w-full"
            disabled={disabled}
          />
        </div>
      </div>

      {/* 社交链接编辑（右上角） */}
      <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-black">{t("heroEditor.socialLinks.title")}</h3>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              enabled={config.showSocialLinks !== false}
              onChange={toggleSocialLinksEnabled}
              disabled={disabled}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const newLink: SocialLinkItem = {
                  id: `social-${Date.now()}`,
                  name: t("heroEditor.socialLinks.add"),
                  url: "",
                  icon: "",
                  enabled: true,
                };
                onConfigChange({
                  ...config,
                  socialLinks: [...(config.socialLinks || []), newLink],
                });
              }}
              disabled={disabled}
            >
              + {t("heroEditor.socialLinks.add")}
            </Button>
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
                    <span className="text-[10px] text-black/70">{t("heroEditor.socialLinks.show")}</span>
                  </label>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteSocialLinkIndex(index)}
                  disabled={disabled}
                >
                  {t("common.delete")}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* 名称 */}
                <div>
                  <label className="block text-[10px] text-black/70 mb-1">
                    {t("heroEditor.socialLinks.name")}
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
                    placeholder={t("heroEditor.socialLinks.name")}
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-xs text-black"
                  />
                </div>

                {/* 链接 */}
                <div>
                  <label className="block text-[10px] text-black/70 mb-1">
                    {t("heroEditor.socialLinks.url")}
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
                  {t("heroEditor.socialLinks.icon")}
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
                    placeholder={t("heroEditor.socialLinks.icon")}
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
              {t("heroEditor.socialLinks.empty")}
            </div>
          )}
        </div>
      </div>

      {/* Title 和 Subtitle 编辑 */}
      <div className="mb-4 space-y-3 rounded-lg border border-black/10 bg-white/70 p-3">
        <Input
          label={t("heroEditor.titleSubtitle.title")}
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
          placeholder={t("heroEditor.titleSubtitle.titlePlaceholder")}
          helpText={t("heroEditor.titleSubtitle.titleHelp") || "显示在 Hero 区域顶部的标题"}
        />
        <Input
          label={t("heroEditor.titleSubtitle.subtitle")}
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
          placeholder={t("heroEditor.titleSubtitle.subtitlePlaceholder")}
          helpText={t("heroEditor.titleSubtitle.subtitleHelp") || "显示在标题下方的副标题"}
        />
      </div>

      {/* 布局配置 */}
      <div className="mb-4 rounded-lg border border-black/10 bg-white/70 p-4">
        <h3 className="text-xs font-semibold text-black mb-4">{t("heroEditor.layout.title")}</h3>
        <div className="space-y-4">
          {/* 高度设置 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-black">
                {t("heroEditor.layout.height")}
              </label>
              <span className="text-xs font-semibold text-black">
                {heroSection?.props.layout?.heightVh ?? 150} vh
              </span>
            </div>
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
              className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
              disabled={disabled}
            />
          </div>
          {/* 背景透明度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-black">
                {t("heroEditor.layout.backgroundOpacity")}
              </label>
              <span className="text-xs font-semibold text-black">
                {(
                  (heroSection?.props.layout?.backgroundOpacity ?? 1) * 100
                ).toFixed(0)}%
              </span>
            </div>
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
              className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* 图片编辑 */}
      <div className="mb-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-black">
            {t("heroEditor.slides.title")}（{heroSlides.length}张）
          </h3>
          <div className="flex items-center gap-3">
            {/* Hero 缩略图条显示开关 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-black/70">{t("heroEditor.slides.showThumbStrip")}</label>
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
            {/* 添加图片按钮 */}
            <Button
              variant="primary"
              size="sm"
              onClick={addSlide}
              disabled={disabled}
            >
              + {t("heroEditor.slides.addImage") || "添加图片"}
            </Button>
          </div>
        </div>

        {/* 轮播速度设置 */}
        <div className="mb-4 rounded-lg border border-black/10 bg-white/70 p-3">
          <h4 className="text-xs font-semibold text-black mb-3">{t("heroEditor.slides.carouselSettings") || "轮播设置"}</h4>
          <div className="space-y-4">
            {/* 每张图片显示时长 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-black">
                  {t("heroEditor.slides.imageDisplayDuration") || "每张图片显示时长"}
                </label>
                <span className="text-xs font-semibold text-black">
                  {carouselInterval} {t("heroEditor.slides.seconds") || "秒"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={carouselInterval}
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
                              carousel: {
                                ...s.props.carousel,
                                autoplayInterval: parseFloat(e.target.value),
                              },
                            },
                          }
                        : s
                    ),
                  });
                }}
                className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                disabled={disabled}
              />
            </div>
            {/* 切换过渡时间 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-black">
                  {t("heroEditor.slides.transitionDuration") || "切换过渡时间"}
                </label>
                <span className="text-xs font-semibold text-black">
                  {carouselTransition} {t("heroEditor.slides.seconds") || "秒"}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={carouselTransition}
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
                              carousel: {
                                ...s.props.carousel,
                                transitionDuration: parseFloat(e.target.value),
                              },
                            },
                          }
                        : s
                    ),
                  });
                }}
                className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {heroSlides.map((slide, index) => {
            const isUploading = uploadingIndex === index;

            return (
              <div
                key={index}
                className="rounded-lg border border-black/10 bg-white/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-black">
                    {t("heroEditor.slides.image")} {index + 1}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteConfirmIndex(index)}
                    disabled={disabled || isUploading}
                  >
                    {t("common.delete")}
                  </Button>
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
                    <div className="aspect-[4/3] flex items-center justify-center rounded-lg border border-black/10 bg-black text-xs text-white/50">
                      {t("heroEditor.slides.noImage")}
                    </div>
                  )}
                </div>

                {/* 上传文件 */}
                <div className="mb-3">
                  <label className="block text-xs text-black/70">
                    {t("heroEditor.slides.upload")}
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
                    {t("heroEditor.slides.orLink")}
                  </label>
                  <input
                    type="text"
                    value={slide?.src || ""}
                    onChange={(e) => useImageUrl(index, e.target.value)}
                    placeholder={t("heroEditor.slides.linkPlaceholder")}
                    className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                    disabled={isUploading || disabled}
                  />
                </div>

                {isUploading && (
                  <div className="mt-2 text-xs text-black/60">{t("common.uploading")}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 删除图片确认对话框 */}
      <ConfirmDialog
        open={deleteConfirmIndex !== null}
        title={t("cms.deleteConfirm.title") || "确认删除"}
        message={t("cms.deleteConfirm.message") || "确定要删除这张图片吗？此操作无法撤销。"}
        variant="danger"
        confirmLabel={t("cms.deleteConfirm.confirm") || "确定删除"}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (deleteConfirmIndex !== null) {
            deleteSlide(deleteConfirmIndex);
          }
        }}
        onCancel={() => setDeleteConfirmIndex(null)}
      />

      {/* 删除社交链接确认对话框 */}
      <ConfirmDialog
        open={deleteSocialLinkIndex !== null}
        title={t("cms.deleteConfirm.title") || "确认删除"}
        message={t("cms.deleteConfirm.message") || "确定要删除这条社交链接吗？此操作无法撤销。"}
        variant="danger"
        confirmLabel={t("cms.deleteConfirm.confirm") || "确定删除"}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (deleteSocialLinkIndex !== null) {
            const updated = (config.socialLinks || []).filter(
              (_, i) => i !== deleteSocialLinkIndex
            );
            onConfigChange({
              ...config,
              socialLinks: updated,
            });
            setDeleteSocialLinkIndex(null);
          }
        }}
        onCancel={() => setDeleteSocialLinkIndex(null)}
      />
    </div>
  );
}

