// features/page-renderer/components/renderers/NewsSectionRenderer.tsx

"use client";

import NewsCarousel from "@/features/news-carousel/components/NewsCarousel";
import NewsListVariant from "@/features/news-carousel/components/NewsListVariant";
import type { NewsSectionProps } from "@/domain/page-config/types";

export default function NewsSectionRenderer({
  props,
  id,
  variant,
}: {
  props: NewsSectionProps;
  id: string;
  variant?: string;
}) {
  if (!props.items || props.items.length === 0) {
    return null;
  }

  return (
    <div data-section-id={id} data-section-type="news" data-variant={variant || "grid"}>
      {variant === "list" ? (
        <NewsListVariant items={props.items} layout={props.layout} />
      ) : (
        <NewsCarousel items={props.items} layout={props.layout} />
      )}
    </div>
  );
}
