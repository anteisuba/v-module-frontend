// domain/page-config/services.ts

import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_CONFIG, EMPTY_PAGE_CONFIG } from "./constants";
import type { PageConfig } from "./types";

/**
 * 确保用户有 Page 记录，如果没有则创建并填充空配置
 * 用于首次登录时自动创建页面
 */
export async function ensureUserPage(
  userId: string,
  slug: string
): Promise<{
  id: string;
  draftConfig: PageConfig;
  publishedConfig: PageConfig | null;
}> {
  // 检查是否已存在
  const existing = await prisma.page.findUnique({
    where: { userId },
  });

  if (existing) {
    return {
      id: existing.id,
      draftConfig: (existing.draftConfig as PageConfig) || EMPTY_PAGE_CONFIG,
      publishedConfig: (existing.publishedConfig as PageConfig) || null,
    };
  }

  // 创建新的 Page 记录，使用空配置（首次访问时显示空白状态）
  const page = await prisma.page.create({
    data: {
      userId,
      slug,
      draftConfig: EMPTY_PAGE_CONFIG,
      publishedConfig: EMPTY_PAGE_CONFIG, // 初始状态：草稿和发布配置相同（都是空的）
    },
  });

  return {
    id: page.id,
    draftConfig: page.draftConfig as PageConfig,
    publishedConfig: page.publishedConfig as PageConfig,
  };
}

/**
 * 获取用户的草稿配置
 */
export async function getUserDraftConfig(
  userId: string
): Promise<PageConfig | null> {
  const page = await prisma.page.findUnique({
    where: { userId },
    select: { draftConfig: true },
  });

  if (!page || !page.draftConfig) {
    return null;
  }

  return page.draftConfig as PageConfig;
}

/**
 * 获取用户的发布配置（公开访问）
 */
export async function getPublishedConfigBySlug(
  slug: string
): Promise<PageConfig | null> {
  const page = await prisma.page.findUnique({
    where: { slug },
    select: { publishedConfig: true },
  });

  if (!page || !page.publishedConfig) {
    return null;
  }

  return page.publishedConfig as PageConfig;
}

/**
 * 更新用户的草稿配置
 */
export async function updateUserDraftConfig(
  userId: string,
  config: PageConfig
): Promise<void> {
  await prisma.page.update({
    where: { userId },
    data: {
      draftConfig: config,
      updatedAt: new Date(),
    },
  });
}

/**
 * 发布配置：将 draftConfig 复制到 publishedConfig
 */
export async function publishUserConfig(userId: string): Promise<void> {
  const page = await prisma.page.findUnique({
    where: { userId },
    select: { draftConfig: true },
  });

  if (!page || !page.draftConfig) {
    throw new Error("No draft config found");
  }

  await prisma.page.update({
    where: { userId },
    data: {
      publishedConfig: page.draftConfig, // 复制草稿到发布
      updatedAt: new Date(),
    },
  });
}
