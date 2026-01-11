// features/page-renderer/components/renderers/VideoSectionRendererWrapper.tsx

"use client";

import dynamic from "next/dynamic";
import type { VideoSectionProps } from "@/domain/page-config/types";

// 动态导入 VideoSectionRenderer，实现代码分割
// 只有页面包含视频时才加载 react-player 相关代码
const VideoSectionRenderer = dynamic(
  () => import("./VideoSectionRenderer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full aspect-[16/9] bg-black/5 rounded-lg">
        <div className="text-sm text-black/50">Loading video...</div>
      </div>
    ),
  }
);

interface VideoSectionRendererWrapperProps {
  props: VideoSectionProps;
  id: string;
}

export default function VideoSectionRendererWrapper({
  props,
  id,
}: VideoSectionRendererWrapperProps) {
  return <VideoSectionRenderer props={props} id={id} />;
}
