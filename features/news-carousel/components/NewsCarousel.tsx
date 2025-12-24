// features/news-carousel/components/NewsCarousel.tsx

"use client";

import { useState, useEffect } from "react";
import { useNewsCarousel } from "../hooks/useNewsCarousel";
import NewsCarouselItem from "./NewsCarouselItem";
import NewsCarouselDots from "./NewsCarouselDots";
import type { NewsItem } from "../types";

type Props = {
  items: Array<{
    id: string;
    src: string;
    alt?: string;
    href: string;
    objectPosition?: string;
  }>;
};

export default function NewsCarousel({ items }: Props) {
  // 响应式：根据屏幕宽度确定每屏显示数量
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    function updateItemsPerView() {
      const width = window.innerWidth;
      if (width >= 1024) {
        // 桌面端：3 个
        setItemsPerView(3);
      } else if (width >= 768) {
        // 平板：2 个
        setItemsPerView(2);
      } else {
        // 移动端：1 个
        setItemsPerView(1);
      }
    }

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const {
    currentItems,
    currentIndex,
    totalPages,
    goToPage,
  } = useNewsCarousel(items, {
    itemsPerView,
  });

  if (items.length === 0) {
    return null; // 如果没有图片，不渲染
  }

  return (
    <section className="w-full bg-black py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* 轮播容器 - 响应式网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[4/3] w-full"
            >
              <NewsCarouselItem item={item} />
            </div>
          ))}
        </div>

        {/* 导航点 */}
        <NewsCarouselDots
          totalPages={totalPages}
          currentIndex={currentIndex}
          onDotClick={goToPage}
        />
      </div>
    </section>
  );
}

