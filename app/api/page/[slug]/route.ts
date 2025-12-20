// app/api/page/[slug]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_CONFIG } from "@/domain/page-config/constants";
import type { PageConfig } from "@/domain/page-config/types";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { slug },
    include: { page: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 读取 publishedConfig（公开可见）
  let config: PageConfig = DEFAULT_PAGE_CONFIG;

  if (user.page?.publishedConfig) {
    try {
      config = user.page.publishedConfig as PageConfig;
    } catch (e) {
      console.error("Failed to parse publishedConfig:", e);
      // 使用默认配置
    }
  }

  return NextResponse.json({
    slug: user.slug,
    displayName: user.displayName,
    config,
  });
}

