// features/video-section/components/VideoSection.tsx

"use client";

import VideoPlayer from "./VideoPlayer";
import { hexToRgba } from "@/utils/color";
import type { VideoSectionProps } from "@/domain/page-config/types";

interface VideoSectionPropsInternal {
  props: VideoSectionProps;
}

export default function VideoSection({ props }: VideoSectionPropsInternal) {
  const { items, layout, display } = props;
  
  if (!items || items.length === 0) {
    return null;
  }
  
  // 布局配置
  const paddingX = layout?.paddingX ?? 24;
  const paddingY = layout?.paddingY ?? 64;
  const backgroundColor = layout?.backgroundColor; // undefined → CSS 变量生效
  const backgroundOpacity = layout?.backgroundOpacity ?? 1;
  const aspectRatio = layout?.aspectRatio || "16:9";

  // 显示配置
  const columns = display?.columns || 1;
  const gap = display?.gap || "md";
  const backgroundColorWithOpacity = hexToRgba(backgroundColor, backgroundOpacity);
  
  // 宽高比类名
  const aspectRatioClass =
    aspectRatio === "16:9"
      ? "aspect-[16/9]"
      : aspectRatio === "4:3"
        ? "aspect-[4/3]"
        : aspectRatio === "1:1"
          ? "aspect-square"
          : "";
  
  // 网格列数类名
  const columnsClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  
  // 间距类名
  const gapClass =
    gap === "sm" ? "gap-2" : gap === "md" ? "gap-4" : "gap-6";
  
  return (
    <section
      className="w-full"
      style={{
        padding: `${paddingY}px ${paddingX}px`,
        backgroundColor: backgroundColorWithOpacity,
      }}
    >
      {columns === 1 ? (
        // 单视频布局
        <div className={`relative w-full ${aspectRatioClass || "aspect-[16/9]"}`}>
          <VideoPlayer item={items[0]} />
        </div>
      ) : (
        // 多视频网格布局
        <div className={`grid ${columnsClass} ${gapClass}`}>
          {items.map((item) => (
            <div key={item.id} className={`relative ${aspectRatioClass || "aspect-[16/9]"}`}>
              <VideoPlayer item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

