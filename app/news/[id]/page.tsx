// app/news/[id]/page.tsx

import { NewsDetailContent } from "./NewsDetailContent";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 在服务器组件中解包 params
  const { id } = await params;
  
  return <NewsDetailContent id={id} />;
}
