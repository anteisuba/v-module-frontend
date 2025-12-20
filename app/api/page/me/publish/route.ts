// app/api/page/me/publish/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";
import { PageConfigSchema } from "@/lib/validation/pageConfigSchema";
import { ensureUserPage } from "@/domain/page-config";

export const runtime = "nodejs"; // Prisma requires Node.js runtime

export async function POST(request: Request) {
  // 1. 校验登录
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. 确保用户存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 3. 确保 Page 存在
  await ensureUserPage(userId, user.slug);

  // 4. 读取当前的 draftConfig
  const page = await prisma.page.findUnique({
    where: { userId },
    select: { draftConfig: true },
  });

  if (!page || !page.draftConfig) {
    return NextResponse.json(
      { error: "No draft config found. Please save a draft first." },
      { status: 400 }
    );
  }

  // 5. 校验 draftConfig（确保数据有效）
  const validation = PageConfigSchema.safeParse(page.draftConfig);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Draft config is invalid",
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  // 6. 发布：将 draftConfig 复制到 publishedConfig
  const updatedPage = await prisma.page.update({
    where: { userId },
    data: {
      publishedConfig: validation.data, // 复制草稿到发布
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    publishedConfig: updatedPage.publishedConfig,
  });
}

