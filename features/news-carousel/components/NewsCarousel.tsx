// features/news-carousel/components/NewsCarousel.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useNewsCarousel } from "../hooks/useNewsCarousel";
import NewsCarouselItem from "./NewsCarouselItem";
import NewsCarouselDots from "./NewsCarouselDots";

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

  const { currentItems, startIndex, totalDots, goToStartIndex } =
    useNewsCarousel(items, {
      itemsPerView,
    });

  if (items.length === 0) {
    return null; // 如果没有图片，不渲染
  }

  // 计算容器的 translateX 值，实现向左移动动画
  // gap-6 = 24px (1.5rem)，需要精确计算每个项目的宽度和 gap
  const itemWidthPercent = 100 / itemsPerView;
  // 每个项目的实际宽度 = (100% / itemsPerView) - (gap * (itemsPerView - 1) / itemsPerView)
  // 移动距离 = startIndex * (项目宽度 + gap)
  const gapPx = 24; // gap-6 = 24px
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 计算 translateX：每个项目宽度 + gap
  const itemWidthPx = containerWidth > 0 
    ? (containerWidth / itemsPerView) - (gapPx * (itemsPerView - 1) / itemsPerView)
    : 0;
  const translateXPx = startIndex * (itemWidthPx + gapPx);

  return (
    <section className="w-full bg-black py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* 轮播容器 - 使用 flexbox 和 transform 实现滑动动画 */}
        <div ref={containerRef} className="relative overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out"
            style={{
              transform: containerWidth > 0 ? `translateX(-${translateXPx}px)` : "translateX(0)",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[4/3] flex-shrink-0"
                style={{
                  width: `calc(${itemWidthPercent}% - ${(gapPx * (itemsPerView - 1)) / itemsPerView}px)`,
                }}
              >
                <NewsCarouselItem item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* 导航点 - 每个点对应一个起始索引，点击时向左平移显示后续图片 */}
        <NewsCarouselDots
          totalDots={totalDots}
          currentStartIndex={startIndex}
          onDotClick={goToStartIndex}
        />
      </div>
    </section>
  );
}
