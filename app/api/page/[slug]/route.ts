// app/api/page/[slug]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePageConfig } from "@/utils/pageConfig";

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
  // 如果没有发布配置，使用空配置（而不是默认配置）
  const config = normalizePageConfig(user.page?.publishedConfig);

  return NextResponse.json({
    slug: user.slug,
    displayName: user.displayName,
    config,
  });
}

