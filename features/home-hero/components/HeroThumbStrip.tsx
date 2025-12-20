"use client";

import Image from "next/image";
import type { HeroSlide } from "../types";

type Props = {
  slides: HeroSlide[];
  currentIndex: number;
  onPick: (i: number) => void;
};

export default function HeroThumbStrip({
  slides,
  currentIndex,
  onPick,
}: Props) {
  // 只显示 3 张：当前、下一张、下下张（ano那种“底部条”感觉）
  const visible = (() => {
    const res: number[] = [];
    for (let k = 0; k < Math.min(3, slides.length); k++) {
      res.push((currentIndex + k) % slides.length);
    }
    return res;
  })();

  if (slides.length <= 1) return null;

  return (
    <div className="absolute bottom-10 left-0 right-0 z-40">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex items-end justify-center gap-4">
          {visible.map((i) => {
            const active = i === currentIndex;
            return (
              <button
                key={slides[i].src}
                type="button"
                onClick={() => onPick(i)}
                className={[
                  "relative overflow-hidden rounded-md",
                  "h-16 w-28 sm:h-20 sm:w-36",
                  "border transition",
                  active
                    ? "border-white/80 opacity-100"
                    : "border-white/20 opacity-70 hover:opacity-100",
                ].join(" ")}
                aria-label={`Go to slide ${i + 1}`}
              >
                <Image
                  src={slides[i].src}
                  alt={slides[i].alt ?? `thumb ${i + 1}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
              </button>
            );
          })}
        </div>

        {/* 小圆点（可选，但很像官网） */}
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 w-1.5 rounded-full transition",
                i === currentIndex ? "bg-white/90" : "bg-white/30",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
