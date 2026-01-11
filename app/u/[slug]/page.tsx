// app/u/[slug]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/features/page-renderer";
import { NewsListSection } from "@/features/news-list";
import PageLoadingWrapper from "@/components/ui/PageLoadingWrapper";
import {
  getUserPageDataBySlug,
  EMPTY_PAGE_CONFIG,
} from "@/domain/page-config";
import type { PageConfig } from "@/domain/page-config/types";

export default async function UserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 使用共享查询函数（带缓存）
  const user = await getUserPageDataBySlug(slug);

  if (!user) {
    notFound();
  }

  // 直接从查询结果中获取配置
  let config: PageConfig = EMPTY_PAGE_CONFIG;
  if (user.page?.publishedConfig) {
    try {
      config = user.page.publishedConfig as PageConfig;
    } catch (e) {
      console.error("Failed to parse publishedConfig:", e);
      // 解析失败时使用空配置
    }
  }

  return (
    <>
      <Suspense fallback={<PageLoadingWrapper messageKey="common.loadingPageContent" />}>
        <PageRenderer config={config} />
      </Suspense>
      <NewsListSection 
        slug={slug} 
        limit={3} 
        background={config.newsBackground || { type: "color", value: "#000000" }}
      />
    </>
  );
}

// 生成 metadata（SEO）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 使用共享查询函数（带缓存，与页面组件共享结果）
  const user = await getUserPageDataBySlug(slug);

  if (!user) {
    return {
      title: "Page Not Found",
    };
  }

  const config = user.page?.publishedConfig as PageConfig | undefined;

  return {
    title:
      config?.meta?.title ||
      `${user.displayName || user.slug}'s Page`,
    description:
      config?.meta?.description ||
      `Personal page of ${user.displayName || user.slug}`,
  };
}

