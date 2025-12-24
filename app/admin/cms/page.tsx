// app/admin/cms/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton, ImagePositionEditor } from "@/components/ui";
import { pageApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { useUser } from "@/lib/context/UserContext";
import type {
  PageConfig,
  HeroSectionProps,
  NewsSectionProps,
  SocialLinkItem,
} from "@/domain/page-config/types";
import {
  DEFAULT_PAGE_CONFIG,
  EMPTY_PAGE_CONFIG,
} from "@/domain/page-config/constants";

export default function CMSPage() {
  const router = useRouter();
  const { user } = useUser();
  const [config, setConfig] = useState<PageConfig>(EMPTY_PAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function toastOk(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 1800);
  }

  // 检查配置是否是默认配置（需要清空）
  function isDefaultConfig(config: PageConfig): boolean {
    // 检查是否有默认的 sections（hero-1, links-1, gallery-1）
    const hasDefaultSections = config.sections.some(
      (section) =>
        section.id === "hero-1" ||
        section.id === "links-1" ||
        section.id === "gallery-1"
    );
    // 检查是否有默认的社交链接
    const hasDefaultSocialLinks = config.socialLinks?.some(
      (link) =>
        link.url.includes("example.com") ||
        link.url.includes("twitter.com/example")
    );
    return Boolean(hasDefaultSections || hasDefaultSocialLinks);
  }

  // 获取草稿配置
  async function loadConfig() {
    setError(null);
    setLoading(true);
    try {
      const draftConfig = await pageApi.getDraftConfig();
      if (draftConfig) {
        // 如果是默认配置，清空为空白配置
        if (isDefaultConfig(draftConfig)) {
          setConfig(EMPTY_PAGE_CONFIG);
        } else {
          setConfig(draftConfig);
        }
      } else {
        // 如果没有配置，使用空配置（首次访问）
        setConfig(EMPTY_PAGE_CONFIG);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // 如果还没有配置，使用空配置（首次访问）
        setConfig(EMPTY_PAGE_CONFIG);
      } else {
        setError(e instanceof Error ? e.message : "加载失败");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  // 清理配置数据（过滤掉空的 slides 和 news items）
  function cleanConfig(config: PageConfig): PageConfig {
    return {
      ...config,
      sections: config.sections.map((section) => {
        if (section.type === "hero") {
          // 过滤掉 src 为空的 slides
          const validSlides = section.props.slides.filter(
            (slide) => slide.src && slide.src.trim().length > 0
          );

          return {
            ...section,
            props: {
              ...section.props,
              slides: validSlides, // 允许空数组
            },
          };
        }
        if (section.type === "news") {
          // 过滤掉 src 或 href 为空的 items
          const validItems = section.props.items.filter(
            (item) =>
              item.src &&
              item.src.trim().length > 0 &&
              item.href &&
              item.href.trim().length > 0
          );

          return {
            ...section,
            props: {
              ...section.props, // 保留现有的 props（包括 layout）
              items: validItems, // 允许空数组
            },
          };
        }
        return section;
      }),
    };
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    try {
      // 清理配置数据
      const cleanedConfig = cleanConfig(config);

      await pageApi.updateDraftConfig(cleanedConfig);

      toastOk("草稿已保存");
      // 更新本地配置为清理后的版本
      setConfig(cleanedConfig);
    } catch (e) {
      console.error("Save draft error:", e);
      if (e instanceof ApiError) {
        const details = e.details
          ? `\n详情: ${JSON.stringify(e.details, null, 2)}`
          : "";
        setError(e.message + details);
      } else if (e instanceof NetworkError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      // 先保存草稿
      await saveDraft();

      // 然后发布
      await pageApi.publish();

      toastOk("已发布！");
    } catch (e) {
      console.error("Publish error:", e);
      if (e instanceof ApiError) {
        const details = e.details
          ? `\n详情: ${JSON.stringify(e.details, null, 2)}`
          : "";
        setError(e.message + details);
      } else if (e instanceof NetworkError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "发布失败");
      }
    } finally {
      setPublishing(false);
    }
  }

  // 获取 hero section
  function getHeroSection() {
    return config.sections.find((s) => s.type === "hero");
  }

  // 确保 hero section 存在（如果不存在则创建）
  function ensureHeroSection(): {
    id: string;
    type: "hero";
    enabled: boolean;
    order: number;
    props: HeroSectionProps;
  } {
    const heroSection = getHeroSection();
    if (!heroSection) {
      // 如果不存在，创建一个新的 hero section
      // Hero section 的 order 始终为 0，确保它排在最前面
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
        order: 0, // Hero section 始终排在最前面
        props: {
          slides: [],
          title: "",
          subtitle: "",
        },
      };
      // 同步更新 config，确保后续操作可以使用
      setConfig((prevConfig) => ({
        ...prevConfig,
        sections: [...prevConfig.sections, newHeroSection],
      }));
      // 返回新创建的 section
      return newHeroSection;
    }
    return heroSection;
  }

  // 切换 section 的 enabled 状态
  function toggleSectionEnabled(sectionId: string) {
    setConfig({
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  }

  // 切换 Logo 显示
  function toggleLogoEnabled() {
    const currentValue = config.showLogo !== false;
    setConfig({
      ...config,
      showLogo: !currentValue,
    });
  }

  // 切换社交链接显示
  function toggleSocialLinksEnabled() {
    const currentValue = config.showSocialLinks !== false;
    setConfig({
      ...config,
      showSocialLinks: !currentValue,
    });
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

  // 获取 news section（不自动创建）
  function getNewsSection() {
    return config.sections.find((s) => s.type === "news");
  }

  // 确保 news section 存在
  function ensureNewsSection() {
    let newsSection = getNewsSection();
    if (!newsSection) {
      // 如果不存在，创建一个新的 news section
      setConfig((prevConfig) => {
        const maxOrder = Math.max(
          ...prevConfig.sections.map((s) => s.order),
          -1
        );
        const newSection = {
          id: `news-${Date.now()}`,
          type: "news" as const,
          enabled: true,
          order: maxOrder + 1,
          props: {
            items: [],
            // layout 会在用户首次设置时创建，这里不设置默认值
          },
        };
        return {
          ...prevConfig,
          sections: [...prevConfig.sections, newSection],
        };
      });
      // 重新获取新创建的 section
      newsSection = getNewsSection();
    }
    return newsSection;
  }

  // 更新 news section 的 items
  function updateNewsItems(
    items: Array<{ id: string; src: string; alt?: string; href: string }>
  ) {
    // 确保 section 存在
    ensureNewsSection();

    setConfig((prevConfig) => {
      // 从最新的 config 中获取 news section
      const newsSection = prevConfig.sections.find((s) => s.type === "news") as
        | {
            id: string;
            type: "news";
            props: NewsSectionProps;
            enabled: boolean;
            order: number;
          }
        | undefined;

      if (!newsSection || newsSection.type !== "news") {
        // 如果不存在，创建一个新的（这种情况理论上不应该发生，因为 ensureNewsSection 已经创建了）
        const maxOrder = Math.max(
          ...prevConfig.sections.map((s) => s.order),
          -1
        );
        const newSection = {
          id: `news-${Date.now()}`,
          type: "news" as const,
          enabled: true,
          order: maxOrder + 1,
          props: {
            items: items,
          },
        };
        return {
          ...prevConfig,
          sections: [...prevConfig.sections, newSection],
        };
      }

      // 更新 items，同时保留所有现有的 props（包括 layout）
      return {
        ...prevConfig,
        sections: prevConfig.sections.map((s) => {
          if (s.id === newsSection.id && s.type === "news") {
            return {
              ...s,
              type: "news" as const,
              props: {
                ...s.props, // 保留现有的 props（包括 layout）
                items: items,
              },
            };
          }
          return s;
        }),
      };
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

    // 如果不存在，创建新的 section 并添加 item
    if (!newsSection) {
      setConfig((prevConfig) => {
        const maxOrder = Math.max(
          ...prevConfig.sections.map((s) => s.order),
          -1
        );
        const newSection = {
          id: `news-${Date.now()}`,
          type: "news" as const,
          enabled: true,
          order: maxOrder + 1,
          props: {
            items: [newItem],
            // layout 会在用户首次设置时创建，这里不设置默认值
          },
        };
        return {
          ...prevConfig,
          sections: [...prevConfig.sections, newSection],
        };
      });
      return;
    }

    // 如果已存在，添加 item
    setConfig((prevConfig) => ({
      ...prevConfig,
      sections: prevConfig.sections.map((s) => {
        if (s.id === newsSection.id && s.type === "news") {
          return {
            ...s,
            type: "news" as const,
            props: {
              ...s.props, // 保留现有的 props（包括 layout）
              items: [...s.props.items, newItem],
            },
          };
        }
        return s;
      }),
    }));
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
    // 确保 section 存在
    ensureNewsSection();

    setConfig((prevConfig) => {
      // 从最新的 config 中获取 news section
      const newsSection = prevConfig.sections.find((s) => s.type === "news") as
        | {
            id: string;
            type: "news";
            props: NewsSectionProps;
            enabled: boolean;
            order: number;
          }
        | undefined;

      if (!newsSection || newsSection.type !== "news") {
        // 如果不存在，创建一个新的
        const maxOrder = Math.max(
          ...prevConfig.sections.map((s) => s.order),
          -1
        );
        const newItem = {
          id: itemId,
          src: updates.src || "",
          alt: updates.alt || "",
          href: updates.href || "",
          objectPosition: updates.objectPosition,
        };
        const newSection = {
          id: `news-${Date.now()}`,
          type: "news" as const,
          enabled: true,
          order: maxOrder + 1,
          props: {
            items: [newItem],
          },
        };
        return {
          ...prevConfig,
          sections: [...prevConfig.sections, newSection],
        };
      }

      // 更新 item，同时保留所有现有的 props（包括 layout）
      return {
        ...prevConfig,
        sections: prevConfig.sections.map((s) => {
          if (s.id === newsSection.id && s.type === "news") {
            return {
              ...s,
              type: "news" as const,
              props: {
                ...s.props, // 保留现有的 props（包括 layout）
                items: s.props.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item
                ),
              },
            };
          }
          return s;
        }),
      };
    });
  }

  // 上传新闻图片
  async function uploadNewsImage(itemId: string, file: File) {
    setUploadingIndex(-1); // 使用 -1 表示新闻图片上传中
    setError(null);
    try {
      const result = await pageApi.uploadImage(file);
      updateNewsItem(itemId, { src: result.src });
      toastOk("图片上传成功");
    } catch (e) {
      if (e instanceof ApiError || e instanceof NetworkError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "上传失败");
      }
    } finally {
      setUploadingIndex(null);
    }
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

    setConfig((prevConfig) => {
      const currentHeroSection = prevConfig.sections.find(
        (s) => s.id === heroSection.id && s.type === "hero"
      );
      if (!currentHeroSection || currentHeroSection.type !== "hero") {
        // 如果找不到，说明状态还没更新，返回原配置
        return prevConfig;
      }
      return {
        ...prevConfig,
        sections: prevConfig.sections.map((s) => {
          if (s.id === heroSection.id && s.type === "hero") {
            return {
              ...s,
              type: "hero" as const,
              props: {
                ...currentHeroSection.props,
                slides: slides, // 保留所有 slides（包括可能的空值，保存时会过滤）
              },
            };
          }
          return s;
        }),
      };
    });
  }

  // 上传图片
  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    setError(null);
    try {
      const result = await pageApi.uploadImage(file);
      updateHeroSlide(index, { src: result.src });
      toastOk(`图片 ${index + 1} 上传成功`);
    } catch (e) {
      if (e instanceof ApiError || e instanceof NetworkError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "上传失败");
      }
    } finally {
      setUploadingIndex(null);
    }
  }

  // 使用图片链接
  function useImageUrl(index: number, url: string) {
    updateHeroSlide(index, { src: url });
    toastOk(`图片 ${index + 1} 已更新`);
  }

  function handleBackgroundChange(type: "color" | "image", value: string) {
    setConfig({
      ...config,
      background: { type, value },
    });
  }

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg text-black">加载中...</div>
        </div>
      </main>
    );
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
    <main className="relative min-h-screen w-full overflow-hidden">
      <BackButton href="/admin" label="返回登录" />

      {/* 背景图 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {/* 头部：标题和操作按钮 */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">页面编辑器</h1>
            <p className="mt-2 text-sm text-black/70">编辑你的个人页面配置</p>
          </div>

          <div className="flex items-center gap-3">
            {/* 预览按钮 */}
            {user?.slug && (
              <a
                href={`/u/${user.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer rounded-xl border border-black/20 bg-white/70 px-4 py-2 text-sm font-medium text-black transition-colors duration-200 hover:bg-white/80"
              >
                打开页面
              </a>
            )}

            {/* 保存草稿按钮 */}
            <button
              onClick={saveDraft}
              disabled={saving || publishing}
              className="cursor-pointer rounded-xl border border-black/20 bg-white/70 px-4 py-2 text-sm font-medium text-black transition-colors duration-200 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存草稿"}
            </button>

            {/* 发布按钮 */}
            <button
              onClick={publish}
              disabled={saving || publishing}
              className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "发布中..." : "发布"}
            </button>
          </div>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {ok && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {ok}
          </div>
        )}

        {/* Hero Section 编辑 */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">
              Hero Section - 顶部内容
            </h2>
            {(() => {
              const heroSection = getHeroSection();
              return heroSection ? (
                <ToggleSwitch
                  enabled={heroSection.enabled}
                  onChange={() => toggleSectionEnabled(heroSection.id)}
                  disabled={saving || publishing}
                />
              ) : null;
            })()}
          </div>

          {/* Title 和 Subtitle 编辑 */}
          <div className="mb-6 space-y-4 rounded-lg border border-black/10 bg-white/70 p-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                标题（Title）
              </label>
              <input
                type="text"
                value={heroSection?.props.title || ""}
                onChange={(e) => {
                  const heroSection = ensureHeroSection();
                  const newTitle = e.target.value || undefined;

                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    sections: prevConfig.sections.map((s) =>
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
                  }));
                }}
                placeholder="例如：Welcome"
                className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                副标题（Subtitle）
              </label>
              <input
                type="text"
                value={heroSection?.props.subtitle || ""}
                onChange={(e) => {
                  const heroSection = ensureHeroSection();
                  const newSubtitle = e.target.value || undefined;

                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    sections: prevConfig.sections.map((s) =>
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
                  }));
                }}
                placeholder="例如：VTuber Personal Page"
                className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-black"
              />
            </div>
          </div>

          {/* 布局配置 */}
          <div className="mb-6 space-y-4 rounded-lg border border-black/10 bg-white/70 p-4">
            <h3 className="text-sm font-semibold text-black mb-3">布局设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    setConfig((prevConfig) => ({
                      ...prevConfig,
                      sections: prevConfig.sections.map((s) =>
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
                    }));
                  }}
                  className="w-full"
                  disabled={saving || publishing}
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
                    setConfig((prevConfig) => ({
                      ...prevConfig,
                      sections: prevConfig.sections.map((s) =>
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
                    }));
                  }}
                  className="w-full h-8 rounded border border-black/10"
                  disabled={saving || publishing}
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
                    setConfig((prevConfig) => ({
                      ...prevConfig,
                      sections: prevConfig.sections.map((s) =>
                        s.id === heroSection.id && s.type === "hero"
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
                    }));
                  }}
                  className="w-full"
                  disabled={saving || publishing}
                />
              </div>
            </div>
          </div>

          {/* 图片编辑 */}
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-black">
                轮播图片（3张）
              </h3>
              {/* Hero 缩略图条显示开关 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-black/70">是否显示</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = config.showHeroThumbStrip ?? true;
                    setConfig({
                      ...config,
                      showHeroThumbStrip: !currentValue,
                    });
                  }}
                  disabled={saving || publishing}
                  className={[
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2",
                    config.showHeroThumbStrip ?? true
                      ? "bg-black"
                      : "bg-black/30",
                    (saving || publishing) && "opacity-50 cursor-not-allowed",
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

            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((index) => {
                const slide = heroSlides[index];
                const isUploading = uploadingIndex === index;

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-black/10 bg-white/70 p-4"
                  >
                    <div className="mb-3 text-sm font-medium text-black">
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
                          disabled={isUploading || saving || publishing}
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
                        disabled={isUploading || saving || publishing}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const inputElement = e.currentTarget;
                          if (file) {
                            uploadImage(index, file);
                            // 立即清理 input 值，允许重复选择同一文件
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
                        disabled={isUploading || saving || publishing}
                      />
                    </div>

                    {isUploading && (
                      <div className="mt-2 text-xs text-black/60">
                        上传中...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 新闻轮播编辑 */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">新闻轮播</h2>
            <div className="flex items-center gap-3">
              {getNewsSection() && (
                <ToggleSwitch
                  enabled={getNewsSection()!.enabled}
                  onChange={() => toggleSectionEnabled(getNewsSection()!.id)}
                  disabled={saving || publishing}
                />
              )}
              <button
                type="button"
                onClick={addNewsItem}
                disabled={saving || publishing}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加图片
              </button>
            </div>
          </div>

          {/* 布局配置 */}
          {getNewsSection() && (
            <div className="mb-6 space-y-4 rounded-lg border border-black/10 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-black mb-3">
                布局设置
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 上下内边距 */}
                <div>
                  <label className="block text-xs text-black/70 mb-2">
                    上下内边距（px）：
                    {getNewsSection()?.props.layout?.paddingY ?? 64}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={getNewsSection()?.props.layout?.paddingY ?? 64}
                    onChange={(e) => {
                      const newsSection = ensureNewsSection();
                      if (!newsSection || newsSection.type !== "news") return;
                      setConfig((prevConfig) => ({
                        ...prevConfig,
                        sections: prevConfig.sections.map((s) =>
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
                      }));
                    }}
                    className="w-full"
                    disabled={saving || publishing}
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
                      getNewsSection()?.props.layout?.backgroundColor ||
                      "#000000"
                    }
                    onChange={(e) => {
                      const newsSection = ensureNewsSection();
                      if (!newsSection || newsSection.type !== "news") return;
                      setConfig((prevConfig) => ({
                        ...prevConfig,
                        sections: prevConfig.sections.map((s) =>
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
                      }));
                    }}
                    className="w-full h-8 rounded border border-black/10"
                    disabled={saving || publishing}
                  />
                </div>
                {/* 背景透明度 */}
                <div>
                  <label className="block text-xs text-black/70 mb-2">
                    背景透明度：
                    {(
                      (getNewsSection()?.props.layout?.backgroundOpacity ?? 1) *
                      100
                    ).toFixed(0)}
                    %
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={
                      (getNewsSection()?.props.layout?.backgroundOpacity ?? 1) *
                      100
                    }
                    onChange={(e) => {
                      const newsSection = ensureNewsSection();
                      if (!newsSection || newsSection.type !== "news") return;
                      setConfig((prevConfig) => ({
                        ...prevConfig,
                        sections: prevConfig.sections.map((s) =>
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
                      }));
                    }}
                    className="w-full"
                    disabled={saving || publishing}
                  />
                </div>
                {/* 最大宽度 */}
                <div>
                  <label className="block text-xs text-black/70 mb-2">
                    最大宽度
                  </label>
                  <select
                    value={getNewsSection()?.props.layout?.maxWidth || "7xl"}
                    onChange={(e) => {
                      const newsSection = ensureNewsSection();
                      if (!newsSection || newsSection.type !== "news") return;
                      setConfig((prevConfig) => ({
                        ...prevConfig,
                        sections: prevConfig.sections.map((s) =>
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
                      }));
                    }}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black"
                    disabled={saving || publishing}
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

          <div className="space-y-4">
            {(getNewsSection()?.props.items || []).map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-black/10 bg-white/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-black">
                    图片 {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewsItem(item.id)}
                    disabled={saving || publishing}
                    className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    删除
                  </button>
                </div>

                {/* 预览 - 可拖拽编辑位置 */}
                <div className="mb-4">
                  {item.src ? (
                    <ImagePositionEditor
                      src={item.src}
                      alt={item.alt || `News ${index + 1}`}
                      objectPosition={item.objectPosition || "center"}
                      onChange={(position) =>
                        updateNewsItem(item.id, { objectPosition: position })
                      }
                      disabled={uploadingIndex === -1 || saving || publishing}
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
                    disabled={uploadingIndex === -1 || saving || publishing}
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
                <div className="mb-3">
                  <label className="block text-xs text-black/70">
                    图片链接
                  </label>
                  <input
                    type="text"
                    value={item.src || ""}
                    onChange={(e) =>
                      updateNewsItem(item.id, { src: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg 或 /path/to/image.jpg"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                    disabled={uploadingIndex === -1 || saving || publishing}
                  />
                </div>

                {/* 外部链接 */}
                <div className="mb-3">
                  <label className="block text-xs text-black/70">
                    外部链接（必填）
                  </label>
                  <input
                    type="text"
                    value={item.href || ""}
                    onChange={(e) =>
                      updateNewsItem(item.id, { href: e.target.value })
                    }
                    placeholder="https://example.com/news/1"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                    disabled={uploadingIndex === -1 || saving || publishing}
                  />
                </div>

                {/* Alt 文本 */}
                <div className="mb-3">
                  <label className="block text-xs text-black/70">
                    Alt 文本（可选）
                  </label>
                  <input
                    type="text"
                    value={item.alt || ""}
                    onChange={(e) =>
                      updateNewsItem(item.id, { alt: e.target.value })
                    }
                    placeholder="图片描述"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                    disabled={uploadingIndex === -1 || saving || publishing}
                  />
                </div>

                {/* 图片位置 */}
                <div>
                  <label className="block text-xs text-black/70 mb-2">
                    图片位置（当图片大于容器时）
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[
                      { value: "center", label: "居中" },
                      { value: "top", label: "顶部" },
                      { value: "bottom", label: "底部" },
                      { value: "left", label: "左侧" },
                      { value: "right", label: "右侧" },
                      { value: "top left", label: "左上" },
                      { value: "top right", label: "右上" },
                      { value: "bottom left", label: "左下" },
                      { value: "bottom right", label: "右下" },
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() =>
                          updateNewsItem(item.id, { objectPosition: pos.value })
                        }
                        disabled={uploadingIndex === -1 || saving || publishing}
                        className={[
                          "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                          (item.objectPosition || "center") === pos.value
                            ? "bg-black text-white"
                            : "bg-white/70 text-black hover:bg-white/90",
                          (uploadingIndex === -1 || saving || publishing) &&
                            "opacity-50 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-black/70 mb-1">
                      自定义位置（如：50% 30%）
                    </label>
                    <input
                      type="text"
                      value={item.objectPosition || ""}
                      onChange={(e) =>
                        updateNewsItem(item.id, {
                          objectPosition: e.target.value || undefined,
                        })
                      }
                      placeholder="center 或 50% 50%"
                      className="w-full rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-xs text-black placeholder:text-black/30"
                      disabled={uploadingIndex === -1 || saving || publishing}
                    />
                  </div>
                </div>

                {uploadingIndex === -1 && (
                  <div className="mt-2 text-xs text-black/60">上传中...</div>
                )}
              </div>
            ))}

            {(!getNewsSection() ||
              getNewsSection()?.props.items.length === 0) && (
              <div className="py-8 text-center text-sm text-black/50">
                暂无新闻图片，点击"添加图片"开始添加
              </div>
            )}
          </div>
        </div>

        {/* Logo 编辑（左上角 ano 位置） */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Logo（左上角）</h2>
            <ToggleSwitch
              enabled={config.showLogo !== false}
              onChange={toggleLogoEnabled}
              disabled={saving || publishing}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-black/70 mb-2">
                Logo 图片 URL（留空则显示文字 "ano"）
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={config.logo?.src || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      logo: {
                        ...config.logo,
                        src: e.target.value || undefined,
                        alt: config.logo?.alt || "Logo",
                      },
                    })
                  }
                  placeholder="/path/to/logo.png 或 https://example.com/logo.png"
                  className="flex-1 rounded-lg border border-black/10 bg-white/70 px-4 py-2 text-sm text-black"
                />
                {/* Logo 预览 */}
                <div className="h-14 w-14 rounded-sm bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 overflow-hidden flex-shrink-0">
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
              <label className="block text-sm text-black/70 mb-2">
                上传 Logo 图片
              </label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-xs text-black/80 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
                disabled={saving || publishing}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  const inputElement = e.currentTarget;
                  if (file) {
                    try {
                      const result = await pageApi.uploadImage(file);
                      setConfig({
                        ...config,
                        logo: {
                          ...config.logo,
                          src: result.src,
                          alt: config.logo?.alt || "Logo",
                        },
                      });
                      toastOk("Logo 上传成功");
                    } catch (err) {
                      if (
                        err instanceof ApiError ||
                        err instanceof NetworkError
                      ) {
                        setError(err.message);
                      } else {
                        setError("上传失败");
                      }
                    } finally {
                      // 在 finally 中清理，并检查 inputElement 是否存在
                      if (inputElement) {
                        inputElement.value = "";
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 社交链接编辑（右上角） */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">
              社交链接（右上角）
            </h2>
            <div className="flex items-center gap-3">
              <ToggleSwitch
                enabled={config.showSocialLinks !== false}
                onChange={toggleSocialLinksEnabled}
                disabled={saving || publishing}
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
                  setConfig({
                    ...config,
                    socialLinks: [...(config.socialLinks || []), newLink],
                  });
                }}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + 新增链接
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {(config.socialLinks || []).map((link, index) => (
              <div
                key={link.id}
                className="rounded-lg border border-black/10 bg-white/70 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/50">#{index + 1}</span>
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
                          setConfig({
                            ...config,
                            socialLinks: updated,
                          });
                        }}
                        className="toggle toggle-sm"
                      />
                      <span className="text-xs text-black/70">显示</span>
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      const updated = (config.socialLinks || []).filter(
                        (_, i) => i !== index
                      );
                      setConfig({
                        ...config,
                        socialLinks: updated,
                      });
                    }}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>

                <div className="space-y-3">
                  {/* 名称 */}
                  <div>
                    <label className="block text-xs text-black/70 mb-1">
                      名称
                    </label>
                    <input
                      type="text"
                      value={link.name}
                      onChange={(e) => {
                        const updated = [...(config.socialLinks || [])];
                        updated[index] = { ...link, name: e.target.value };
                        setConfig({
                          ...config,
                          socialLinks: updated,
                        });
                      }}
                      placeholder="例如：Twitter、YouTube、GitHub"
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
                    />
                  </div>

                  {/* 链接 */}
                  <div>
                    <label className="block text-xs text-black/70 mb-1">
                      链接 URL
                    </label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...(config.socialLinks || [])];
                        updated[index] = { ...link, url: e.target.value };
                        setConfig({
                          ...config,
                          socialLinks: updated,
                        });
                      }}
                      placeholder="https://example.com"
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
                    />
                  </div>

                  {/* 图标 */}
                  <div>
                    <label className="block text-xs text-black/70 mb-1">
                      图标（可选：文字如 "X"、"YT"，emoji 如 🐦，或图片 URL）
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={link.icon || ""}
                        onChange={(e) => {
                          const updated = [...(config.socialLinks || [])];
                          updated[index] = {
                            ...link,
                            icon: e.target.value || undefined,
                          };
                          setConfig({
                            ...config,
                            socialLinks: updated,
                          });
                        }}
                        placeholder="X、YT、GH 或 🐦、📺、💻 或 /icon.png"
                        className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
                      />
                      {/* 图标预览 */}
                      {link.icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 bg-white/70">
                          {link.icon.match(
                            /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i
                          ) ||
                          link.icon.startsWith("http://") ||
                          link.icon.startsWith("https://") ||
                          link.icon.startsWith("/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={link.icon}
                              alt="icon preview"
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <span className="text-lg">{link.icon}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* 上传图标图片 */}
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-xs text-black/80 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-black/80 file:px-3 file:py-1.5 file:text-xs file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
                        disabled={saving || publishing}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          const inputElement = e.currentTarget;
                          if (file) {
                            try {
                              const result = await pageApi.uploadImage(file);
                              const updated = [...(config.socialLinks || [])];
                              updated[index] = { ...link, icon: result.src };
                              setConfig({
                                ...config,
                                socialLinks: updated,
                              });
                              toastOk("图标上传成功");
                            } catch (err) {
                              if (
                                err instanceof ApiError ||
                                err instanceof NetworkError
                              ) {
                                setError(err.message);
                              } else {
                                setError("上传失败");
                              }
                            } finally {
                              // 在 finally 中清理，并检查 inputElement 是否存在
                              if (inputElement) {
                                inputElement.value = "";
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(!config.socialLinks || config.socialLinks.length === 0) && (
              <div className="rounded-lg border border-dashed border-black/20 bg-white/50 p-8 text-center text-sm text-black/50">
                暂无社交链接，点击上方"新增链接"按钮添加
              </div>
            )}
          </div>
        </div>

        {/* 背景编辑 */}
        <div className="mb-8 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">页面背景</h2>
            <div className="text-sm text-black/50">
              {/* 页面背景始终显示，不需要开关 */}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-black/70">背景类型</label>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() =>
                    handleBackgroundChange("color", config.background.value)
                  }
                  className={`rounded-lg px-4 py-2 text-sm ${
                    config.background.type === "color"
                      ? "bg-black text-white"
                      : "bg-white/70 text-black"
                  }`}
                >
                  颜色
                </button>
                <button
                  onClick={() =>
                    handleBackgroundChange("image", config.background.value)
                  }
                  className={`rounded-lg px-4 py-2 text-sm ${
                    config.background.type === "image"
                      ? "bg-black text-white"
                      : "bg-white/70 text-black"
                  }`}
                >
                  图片
                </button>
              </div>
            </div>

            {config.background.type === "color" ? (
              <div>
                <label className="text-sm text-black/70">背景颜色</label>
                <input
                  type="color"
                  value={config.background.value}
                  onChange={(e) =>
                    handleBackgroundChange("color", e.target.value)
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-black/10"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm text-black/70">图片 URL</label>
                <input
                  type="text"
                  value={config.background.value}
                  onChange={(e) =>
                    handleBackgroundChange("image", e.target.value)
                  }
                  placeholder="/path/to/image.jpg 或 https://example.com/image.jpg"
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white/70 px-4 py-2 text-sm text-black"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-xs text-black/60">
          说明：编辑配置后点击"保存草稿"保存到草稿，点击"发布"后才会在公开页面显示。
        </div>
      </div>
    </main>
  );
}
