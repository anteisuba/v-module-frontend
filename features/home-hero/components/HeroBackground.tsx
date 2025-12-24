"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  fadeIn: boolean;
  fadeMs: number;
  objectPosition?: string; // 图片位置，如 "center", "top", "bottom", "50% 50%" 等
  progress: number; // 0..1
  vh: number;
  imageHeightVh: number; // 比如 150
};

// 判断是否为外部 URL
function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export default function HeroBackground({
  src,
  alt,
  fadeIn,
  fadeMs,
  objectPosition = "center",
  progress,
  vh,
  imageHeightVh,
}: Props) {
  // 图片最大可移动距离 = (imageHeight - viewportHeight)
  const imageH = (imageHeightVh / 100) * vh;
  const maxShiftPx = Math.max(imageH - vh, 0);
  const shiftPx = progress * maxShiftPx;

  const isExternal = isExternalUrl(src);

  return (
    <>
      {/* 背景图层：更高的图片 + translateY 露出下方 */}
      <div
        className="absolute left-0 top-0 w-full"
        style={{
          height: `${imageHeightVh}vh`,
          transform: `translateY(-${shiftPx}px)`,
          opacity: fadeIn ? 1 : 0,
          transitionProperty: "opacity",
          transitionDuration: `${fadeMs}ms`,
          willChange: "transform, opacity",
        }}
      >
        {isExternal ? (
          // 外部 URL 使用普通的 img 标签
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? "hero"}
            className="h-full w-full object-cover"
            style={{
              width: "100%",
              height: "100%",
              objectPosition: objectPosition,
            }}
          />
        ) : (
          // 本地路径使用 Next.js Image 组件（享受优化）
          <Image
            src={src}
            alt={alt ?? "hero"}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: objectPosition }}
          />
        )}
      </div>

      {/* 压黑层 */}
      <div className="absolute inset-0 bg-black/15" />
    </>
  );
}
