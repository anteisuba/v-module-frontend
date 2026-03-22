// features/page-renderer/components/renderers/VideoSectionRenderer.tsx

"use client";

import { VideoSection } from "@/features/video-section";
import type { VideoSectionProps } from "@/domain/page-config/types";

export default function VideoSectionRenderer({
  props,
  id,
  variant,
}: {
  props: VideoSectionProps;
  id: string;
  variant?: string;
}) {
  if (!props.items || props.items.length === 0) {
    return null;
  }

  // "featured" variant: first video large, rest as thumbnail list
  if (variant === "featured" && props.items.length > 1) {
    const featuredProps: VideoSectionProps = {
      ...props,
      items: [props.items[0]],
      display: { columns: 1, gap: props.display?.gap },
    };
    const restProps: VideoSectionProps = {
      ...props,
      items: props.items.slice(1),
      display: { columns: 3, gap: "sm" },
      layout: { ...props.layout, aspectRatio: "16:9" },
    };

    return (
      <div data-section-id={id} data-section-type="video" data-variant="featured">
        <VideoSection props={featuredProps} />
        <VideoSection props={restProps} />
      </div>
    );
  }

  return (
    <div data-section-id={id} data-section-type="video" data-variant={variant || "grid"}>
      <VideoSection props={props} />
    </div>
  );
}
