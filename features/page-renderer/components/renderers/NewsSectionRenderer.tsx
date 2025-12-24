// features/page-renderer/components/renderers/NewsSectionRenderer.tsx

"use client";

import NewsCarousel from "@/features/news-carousel/components/NewsCarousel";
import type { NewsSectionProps } from "@/domain/page-config/types";

export default function NewsSectionRenderer({
  props,
  id,
}: {
  props: NewsSectionProps;
  id: string;
}) {
  if (!props.items || props.items.length === 0) {
    return null; // 如果没有图片，不渲染
  }

  return (
    <div data-section-id={id} data-section-type="news">
      <NewsCarousel items={props.items} />
    </div>
  );
}

