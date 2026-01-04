// features/page-renderer/components/renderers/VideoSectionRenderer.tsx

"use client";

import { VideoSection } from "@/features/video-section";
import type { VideoSectionProps } from "@/domain/page-config/types";

export default function VideoSectionRenderer({
  props,
  id,
}: {
  props: VideoSectionProps;
  id: string;
}) {
  if (!props.items || props.items.length === 0) {
    return null; // 如果没有视频，不渲染
  }

  return (
    <div data-section-id={id} data-section-type="video">
      <VideoSection props={props} />
    </div>
  );
}

