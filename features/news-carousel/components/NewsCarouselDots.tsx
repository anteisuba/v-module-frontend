// features/news-carousel/components/NewsCarouselDots.tsx

"use client";

type Props = {
  totalPages: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
};

export default function NewsCarouselDots({
  totalPages,
  currentIndex,
  onDotClick,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onDotClick(i)}
          className={[
            "h-1.5 w-1.5 rounded-full transition-all",
            i === currentIndex
              ? "bg-white/90 scale-125"
              : "bg-white/30 hover:bg-white/50",
          ].join(" ")}
          aria-label={`Go to page ${i + 1}`}
        />
      ))}
    </div>
  );
}

