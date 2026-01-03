// app/admin/cms/page.tsx

"use client";

import { useState } from "react";
import {
  BackButton,
  HeroSectionEditor,
  NewsSectionEditor,
  PageBackgroundEditor,
  NewsArticleEditor,
  ToggleSwitch,
  Alert,
  CMSHeader,
} from "@/components/ui";
import { pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import type {
  PageConfig,
  HeroSectionProps,
  NewsSectionProps,
  SocialLinkItem,
} from "@/domain/page-config/types";

export default function CMSPage() {
  const { user } = useUser();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const { config, setConfig, loading } = usePageConfig();
  const { saving, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
    onError: handleError,
    onToast: showToast,
  });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // 注意：isDefaultConfig 和 cleanConfig 已移至 utils/pageConfig.ts
  // 注意：loadConfig, cleanConfig, saveDraft, publish 已移至 hooks

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

  // 注意：ToggleSwitch 已移至 components/ui/ToggleSwitch.tsx

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
    try {
      const result = await pageApi.uploadImage(file);
      updateNewsItem(itemId, { src: result.src });
      showToast("图片上传成功");
    } catch (e) {
      handleError(e);
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
    try {
      const result = await pageApi.uploadImage(file);
      updateHeroSlide(index, { src: result.src });
      showToast(`图片 ${index + 1} 上传成功`);
    } catch (e) {
      handleError(e);
    } finally {
      setUploadingIndex(null);
    }
  }

  // 使用图片链接
  function useImageUrl(index: number, url: string) {
    updateHeroSlide(index, { src: url });
    showToast(`图片 ${index + 1} 已更新`);
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
        <CMSHeader
          userSlug={user?.slug || null}
          onSaveDraft={saveDraft}
          onPublish={publish}
          saving={saving}
          publishing={publishing}
          disabled={saving || publishing}
        />

        {/* 错误和成功提示 */}
        {error && <Alert type="error" message={error} onClose={clearError} />}
        {toastMessage && <Alert type="success" message={toastMessage} />}

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
          onToast={showToast}
          onError={handleError}
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
          onToast={showToast}
          onError={handleError}
        />

        {/* 页面背景编辑 */}
        <PageBackgroundEditor
          config={config}
          onConfigChange={setConfig}
          disabled={saving || publishing}
          onUploadImage={async (file) => {
            try {
              const result = await pageApi.uploadImage(file);
              return result;
            } catch (e) {
              throw e;
            }
          }}
          onToast={showToast}
          onError={handleError}
        />

        {/* 新闻文章编辑 */}
        <NewsArticleEditor
          disabled={saving || publishing}
          onToast={showToast}
          onError={handleError}
          onUploadImage={async (file) => {
            try {
              const result = await pageApi.uploadImage(file);
              return result;
            } catch (e) {
              throw e;
            }
          }}
          newsBackground={config.newsBackground || { type: "color", value: "#000000" }}
          onNewsBackgroundChange={(background) => {
            setConfig({
              ...config,
              newsBackground: background,
            });
          }}
        />

        <div className="mt-6 text-[10px] text-black/50 text-center">
          说明：编辑配置后点击"保存草稿"保存到草稿，点击"发布"后才会在公开页面显示。
        </div>
      </div>
    </main>
  );
}
