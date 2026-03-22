// app/news/[id]/page.tsx

import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { NewsDetailContent } from "./NewsDetailContent";
import NewsDetailLoading from "./loading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await prisma.newsArticle.findUnique({
    where: { id },
    select: { title: true, content: true },
  });

  if (!article) return { title: "News" };

  const description = article.content?.slice(0, 160) || "";
  return {
    title: article.title,
    description,
    openGraph: { title: article.title, description },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<NewsDetailLoading />}>
      <NewsDetailContent id={id} />
    </Suspense>
  );
}
