// app/admin/preview/[slug]/page.tsx
// 草稿預覽頁：受 proxy 保護（需登入），直接讀取 draftConfig

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/features/page-renderer";
import { NewsListSection } from "@/features/news-list";
import { ThemeProvider } from "@/components/theme";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";
import { normalizePageConfig } from "@/utils/pageConfig";
import type { PageConfig } from "@/domain/page-config/types";

export const runtime = "nodejs";        // Prisma requires Node.js runtime
export const dynamic = "force-dynamic"; // 每次請求都重新渲染，確保草稿內容即時

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 只允許本人預覽自己的草稿
  const session = await getServerSession();
  if (!session?.user || session.user.slug !== slug) {
    notFound();
  }

  // 直接從 DB 讀取最新 draftConfig
  const page = await prisma.page.findFirst({
    where: { user: { slug } },
    select: {
      draftConfig: true,
      themeColor: true,
      fontFamily: true,
      user: { select: { slug: true } },
    },
  });

  if (!page) {
    notFound();
  }

  const config: PageConfig = normalizePageConfig(page.draftConfig);
  const themeColor = page.themeColor || "#000000";
  const fontFamily = page.fontFamily || "Inter";

  return (
    <ThemeProvider themeColor={themeColor} fontFamily={fontFamily}>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading…</div>}>
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
