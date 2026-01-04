// features/video-section/components/VideoSection.tsx

"use client";

import VideoPlayer from "./VideoPlayer";
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
  const paddingY = layout?.paddingY ?? 64;
  const backgroundColor = layout?.backgroundColor || "#000000";
  const backgroundOpacity = layout?.backgroundOpacity ?? 1;
  const maxWidth = layout?.maxWidth || "7xl";
  const aspectRatio = layout?.aspectRatio || "16:9";
  
  // 显示配置
  const columns = display?.columns || 1;
  const gap = display?.gap || "md";
  
  // 将背景颜色和透明度转换为 rgba
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };
  
  const rgb = hexToRgb(backgroundColor);
  const backgroundColorWithOpacity = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${backgroundOpacity})`;
  
  // 将 maxWidth 字符串转换为样式
  const maxWidthStyle: React.CSSProperties =
    maxWidth === "full"
      ? { maxWidth: "100%" }
      : maxWidth === "7xl"
        ? { maxWidth: "80rem" }
        : maxWidth === "6xl"
          ? { maxWidth: "72rem" }
          : maxWidth === "5xl"
            ? { maxWidth: "64rem" }
            : maxWidth === "4xl"
              ? { maxWidth: "56rem" }
              : { maxWidth: "80rem" };
  
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
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        backgroundColor: backgroundColorWithOpacity,
      }}
    >
      <div className="mx-auto px-6" style={maxWidthStyle}>
        {columns === 1 ? (
          // 单视频布局
          <div className={aspectRatioClass || "aspect-[16/9]"}>
            <VideoPlayer item={items[0]} />
          </div>
        ) : (
          // 多视频网格布局
          <div className={`grid ${columnsClass} ${gapClass}`}>
            {items.map((item) => (
              <div key={item.id} className={aspectRatioClass || "aspect-[16/9]"}>
                <VideoPlayer item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

