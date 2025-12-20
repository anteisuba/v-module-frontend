// app/u/[slug]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageRenderer } from "@/features/page-renderer";
import {
  getPublishedConfigBySlug,
  DEFAULT_PAGE_CONFIG,
} from "@/domain/page-config";
import type { PageConfig } from "@/domain/page-config/types";

export default async function UserPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { slug },
  });

  if (!user) {
    notFound();
  }

  // 读取配置：优先使用 publishedConfig，否则使用默认配置
  let config: PageConfig = DEFAULT_PAGE_CONFIG;

  const publishedConfig = await getPublishedConfigBySlug(slug);
  if (publishedConfig) {
    config = publishedConfig;
  }

  return <PageRenderer config={config} />;
}

// 生成 metadata（SEO）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    include: { page: true },
  });

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

