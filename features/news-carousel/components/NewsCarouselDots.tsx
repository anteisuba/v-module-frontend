// features/news-carousel/components/NewsCarouselDots.tsx

"use client";

type Props = {
  totalDots: number; // 点的总数
  currentStartIndex: number; // 当前起始索引
  onDotClick: (startIndex: number) => void; // 点击时传入起始索引
};

export default function NewsCarouselDots({
  totalDots,
  currentStartIndex,
  onDotClick,
}: Props) {
  if (totalDots <= 1) return null;

  return (
    <div className="mt-8 flex justify-center gap-2">
      {Array.from({ length: totalDots }).map((_, dotIndex) => {
        // 每个点对应一个起始索引（dotIndex 就是起始索引）
        const startIndex = dotIndex;
        const isActive = startIndex === currentStartIndex;

        return (
          <button
            key={dotIndex}
            type="button"
            onClick={() => onDotClick(startIndex)}
            className={[
              "rounded-full transition-all",
              isActive
                ? "h-1.5 w-8 bg-[color:var(--theme-primary)]"
                : "h-1.5 w-1.5 bg-white/28 hover:bg-white/46",
            ].join(" ")}
            aria-label={`Go to start index ${startIndex + 1}`}
          />
        );
      })}
    </div>
  );
}
