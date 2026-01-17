// app/api/page/me/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";
import { PageConfigSchema } from "@/lib/validation/pageConfigSchema";
import { ensureUserPage } from "@/domain/page-config";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

export async function GET() {
  // 1. 校验登录
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. 获取用户的草稿配置和主题设置
  const page = await prisma.page.findUnique({
    where: { userId },
    select: { 
      draftConfig: true,
      themeColor: true,
      fontFamily: true,
    },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({
    draftConfig: page.draftConfig,
    themeColor: page.themeColor,
    fontFamily: page.fontFamily,
  });
}

export async function PUT(request: Request) {
  // 1. 校验登录
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. 解析请求体
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { draftConfig, themeColor, fontFamily } = body;

  if (!draftConfig) {
    return NextResponse.json(
      { error: "draftConfig is required" },
      { status: 400 }
    );
  }

  // 3. 校验 JSON Schema
  const validation = PageConfigSchema.safeParse(draftConfig);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid config",
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  // 4. 确保用户存在且有 Page 记录
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 5. 确保 Page 存在（如果不存在则创建）
  await ensureUserPage(userId, user.slug);

  // 6. 更新 draftConfig 和主题设置
  const updateData: {
    draftConfig: typeof validation.data;
    updatedAt: Date;
    themeColor?: string;
    fontFamily?: string;
  } = {
    draftConfig: validation.data,
    updatedAt: new Date(),
  };

  // 如果传入了主题色，同时更新
  if (themeColor && typeof themeColor === "string") {
    updateData.themeColor = themeColor;
  }

  // 如果传入了字体，同时更新
  if (fontFamily && typeof fontFamily === "string") {
    updateData.fontFamily = fontFamily;
  }

  const page = await prisma.page.update({
    where: { userId },
    data: updateData,
  });

  return NextResponse.json({ 
    ok: true, 
    pageConfig: page.draftConfig,
    themeColor: page.themeColor,
    fontFamily: page.fontFamily,
  });
}

