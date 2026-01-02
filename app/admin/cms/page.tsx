// app/admin/cms/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  HeroSectionEditor,
  NewsSectionEditor,
  PageBackgroundEditor,
  NewsArticleEditor,
} from "@/components/ui";
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
  const [backgroundImageError, setBackgroundImageError] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  function toastOk(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 1800);
  }

  // 检查配置是否是默认配置（需要清空）
  // 改进：不仅检查 id 和链接，还要检查内容是否被修改过
  function isDefaultConfig(config: PageConfig): boolean {
    // 如果已发布过，不再清空
    if (config.hasPublished) {
      return false;
    }

    // 检查是否有默认的 sections（hero-1, links-1, gallery-1）
    const defaultSectionIds = ["hero-1", "links-1", "gallery-1"];
    const hasDefaultSectionIds = config.sections.some((section) =>
      defaultSectionIds.includes(section.id)
    );

    if (!hasDefaultSectionIds) {
      // 如果没有默认的 section id，说明已经被修改过
      return false;
    }

    // 检查默认 sections 的内容是否被修改
    const heroSection = config.sections.find(
      (s) => s.id === "hero-1" && s.type === "hero"
    );
    if (heroSection && heroSection.type === "hero") {
      // 检查 title 或 subtitle 是否被修改
      if (heroSection.props.title && heroSection.props.title !== "Welcome") {
        return false; // 内容已修改
      }
      if (
        heroSection.props.subtitle &&
        heroSection.props.subtitle !== "VTuber Personal Page"
      ) {
        return false; // 内容已修改
      }
      // 检查 slides 是否被修改（数量或内容）
      const defaultSlides = [
        { src: "/hero/nakajima.jpeg", alt: "Hero 1" },
        { src: "/hero/2.jpeg", alt: "Hero 2" },
        { src: "/hero/3.jpeg", alt: "Hero 3" },
      ];
      if (heroSection.props.slides.length !== defaultSlides.length) {
        return false; // 数量已修改
      }
      // 检查是否有 slide 的 src 被修改
      const hasModifiedSlide = heroSection.props.slides.some((slide, index) => {
        const defaultSlide = defaultSlides[index];
        return (
          !defaultSlide ||
          slide.src !== defaultSlide.src ||
          slide.alt !== defaultSlide.alt
        );
      });
      if (hasModifiedSlide) {
        return false; // 内容已修改
      }
    }

    // 检查默认的 links section
    const linksSection = config.sections.find(
      (s) => s.id === "links-1" && s.type === "links"
    );
    if (linksSection && linksSection.type === "links") {
      const defaultLinks = [
        {
          id: "link-1",
          label: "Twitter",
          href: "https://twitter.com/example",
          icon: "🐦",
        },
        {
          id: "link-2",
          label: "YouTube",
          href: "https://youtube.com/example",
          icon: "📺",
        },
        {
          id: "link-3",
          label: "GitHub",
          href: "https://github.com/example",
          icon: "💻",
        },
      ];
      if (linksSection.props.items.length !== defaultLinks.length) {
        return false; // 数量已修改
      }
      // 检查是否有 link 的内容被修改
      const hasModifiedLink = linksSection.props.items.some((item, index) => {
        const defaultLink = defaultLinks[index];
        return (
          !defaultLink ||
          item.label !== defaultLink.label ||
          item.href !== defaultLink.href ||
          item.icon !== defaultLink.icon
        );
      });
      if (hasModifiedLink) {
        return false; // 内容已修改
      }
    }

    // 检查是否有默认的社交链接
    const hasDefaultSocialLinks = config.socialLinks?.some(
      (link) =>
        link.url.includes("example.com") ||
        link.url.includes("twitter.com/example")
    );

    // 如果只有默认的 section id 和社交链接，且内容未被修改，才认为是默认配置
    return Boolean(hasDefaultSectionIds && hasDefaultSocialLinks);
  }

  // 获取草稿配置
  async function loadConfig() {
    setError(null);
    setLoading(true);
    try {
      const draftConfig = await pageApi.getDraftConfig();
      if (draftConfig) {
        // 优化：只在首次访问且未发布时清空默认配置
        // 如果已发布过，不再清空
        if (draftConfig.hasPublished) {
          setConfig(draftConfig);
        } else if (isDefaultConfig(draftConfig)) {
          // 只在首次访问且是默认配置时清空
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
      // 先保存草稿（带 hasPublished 标记）
      const configToSave = {
        ...config,
        hasPublished: true, // 标记为已发布
      };
      const cleanedConfig = cleanConfig(configToSave);
      await pageApi.updateDraftConfig(cleanedConfig);

      // 然后发布
      await pageApi.publish();

      // 更新本地配置，设置 hasPublished 标记
      setConfig(cleanedConfig);

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

  // 上传背景图片
  async function uploadBackgroundImage(file: File) {
    setUploadingBackground(true);
    setError(null);
    setBackgroundImageError(false);
    try {
      const result = await pageApi.uploadImage(file);
      handleBackgroundChange("image", result.src);
      toastOk("背景图片上传成功");
    } catch (e) {
      if (e instanceof ApiError || e instanceof NetworkError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : "上传失败");
      }
    } finally {
      setUploadingBackground(false);
    }
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

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        {/* 头部：标题和操作按钮 */}
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-black">页面编辑器</h1>
            <p className="mt-1 text-xs text-black/70">编辑你的个人页面配置</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 预览按钮 */}
            {user?.slug && (
              <a
                href={`/u/${user.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
              >
                打开页面
              </a>
            )}

            {/* 保存草稿按钮 */}
            <button
              onClick={saveDraft}
              disabled={saving || publishing}
              className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存草稿"}
            </button>

            {/* 发布按钮 */}
            <button
              onClick={publish}
              disabled={saving || publishing}
              className="cursor-pointer rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "发布中..." : "发布"}
            </button>
          </div>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {ok && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {ok}
          </div>
        )}

        {/* Hero Section 编辑 */}
        <HeroSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onUploadImage={async (file) => {
            const result = await pageApi.uploadImage(file);
            return result;
          }}
          uploadingIndex={uploadingIndex}
          onToast={toastOk}
          onError={setError}
        />

        {/* 图片导航编辑 */}
        <NewsSectionEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onUploadImage={async (file) => {
            setUploadingIndex(-1);
            try {
              const result = await pageApi.uploadImage(file);
              setUploadingIndex(null);
              return result;
            } catch (e) {
              setUploadingIndex(null);
              throw e;
            }
          }}
          uploadingIndex={uploadingIndex === -1 ? -1 : null}
          onToast={toastOk}
          onError={setError}
        />

        {/* 页面背景编辑 */}
        <PageBackgroundEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onUploadImage={async (file) => {
            setUploadingBackground(true);
            try {
              const result = await pageApi.uploadImage(file);
              setUploadingBackground(false);
              return result;
            } catch (e) {
              setUploadingBackground(false);
              throw e;
            }
          }}
          uploadingBackground={uploadingBackground}
          onToast={toastOk}
          onError={setError}
        />

        {/* 新闻文章编辑 */}
        <NewsArticleEditor
          disabled={saving || publishing}
          onToast={toastOk}
          onError={setError}
          onUploadImage={async (file) => {
            try {
              const result = await pageApi.uploadImage(file);
              return result;
            } catch (e) {
              throw e;
            }
          }}
        />

        <div className="mt-6 text-[10px] text-black/50 text-center">
          说明：编辑配置后点击"保存草稿"保存到草稿，点击"发布"后才会在公开页面显示。
        </div>
      </div>
    </main>
  );
}
