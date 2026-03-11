// app/news/[id]/page.tsx

import { Suspense } from "react";
import { NewsDetailContent } from "./NewsDetailContent";
import NewsDetailLoading from "./loading";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 在服务器组件中解包 params
  const { id } = await params;
  
  return (
    <Suspense fallback={<NewsDetailLoading />}>
      <NewsDetailContent id={id} />
    </Suspense>
  );
}
