"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  fadeIn: boolean;
  fadeMs: number;

  progress: number; // 0..1
  vh: number;

  imageHeightVh: number; // 比如 150
};

export default function HeroBackground({
  src,
  alt,
  fadeIn,
  fadeMs,
  progress,
  vh,
  imageHeightVh,
}: Props) {
  // 图片最大可移动距离 = (imageHeight - viewportHeight)
  const imageH = (imageHeightVh / 100) * vh;
  const maxShiftPx = Math.max(imageH - vh, 0);
  const shiftPx = progress * maxShiftPx;

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
        <Image
          src={src}
          alt={alt ?? "hero"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      </div>

      {/* 压黑层 */}
      <div className="absolute inset-0 bg-black/15" />
    </>
  );
}
