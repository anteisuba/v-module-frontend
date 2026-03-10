// app/u/[slug]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/features/page-renderer";
import { NewsListSection } from "@/features/news-list";
import PageLoadingWrapper from "@/components/ui/PageLoadingWrapper";
import { ThemeProvider } from "@/components/theme";
import {
  getUserPageDataBySlug,
} from "@/domain/page-config";
import type { PageConfig } from "@/domain/page-config/types";
import { getE2EPublicPageState } from "@/lib/e2e/publicPageState";
import { normalizePageConfig } from "@/utils/pageConfig";


export default async function UserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e2ePublicPageState = await getE2EPublicPageState(slug);

  // 使用共享查询函数（带缓存）
  const user = e2ePublicPageState
    ? {
        slug,
        displayName: e2ePublicPageState.displayName,
        page: {
          publishedConfig: e2ePublicPageState.publishedConfig,
          draftConfig: e2ePublicPageState.publishedConfig,
          themeColor: e2ePublicPageState.themeColor,
          fontFamily: e2ePublicPageState.fontFamily,
        },
      }
    : await getUserPageDataBySlug(slug);

  if (!user) {
    notFound();
  }

  // 直接从查询结果中获取配置
  const config: PageConfig = normalizePageConfig(
    e2ePublicPageState?.publishedConfig ?? user.page?.publishedConfig
  );

  // 从 Page 表中读取主题配置（如果存在）
  const themeColor =
    e2ePublicPageState?.themeColor || user.page?.themeColor || "#000000";
  const fontFamily =
    e2ePublicPageState?.fontFamily || user.page?.fontFamily || "Inter";

  return (
    <ThemeProvider themeColor={themeColor} fontFamily={fontFamily}>
      <Suspense fallback={<PageLoadingWrapper messageKey="common.loadingPageContent" />}>
        <PageRenderer config={config} />
      </Suspense>
      <NewsListSection 
        slug={slug} 
        limit={3} 
        background={config.newsBackground || { type: "color", value: "#000000" }}
      />
    </ThemeProvider>
  );
}

// 生成 metadata（SEO）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e2ePublicPageState = await getE2EPublicPageState(slug);

  // 使用共享查询函数（带缓存，与页面组件共享结果）
  const user = e2ePublicPageState
    ? {
        slug,
        displayName: e2ePublicPageState.displayName,
        page: {
          publishedConfig: e2ePublicPageState.publishedConfig,
        },
      }
    : await getUserPageDataBySlug(slug);

  if (!user) {
    return {
      title: "Page Not Found",
    };
  }

  const config = normalizePageConfig(
    e2ePublicPageState?.publishedConfig ?? user.page?.publishedConfig
  );

  return {
    title:
      config?.meta?.title ||
      `${user.displayName || user.slug}'s Page`,
    description:
      config?.meta?.description ||
      `Personal page of ${user.displayName || user.slug}`,
  };
}

