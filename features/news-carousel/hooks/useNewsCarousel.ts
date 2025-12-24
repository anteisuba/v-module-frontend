// features/news-carousel/hooks/useNewsCarousel.ts

"use client";

import { useState, useMemo } from "react";
import type { NewsItem } from "../types";

type Options = {
  itemsPerView?: number; // 每屏显示的项目数，默认 3
};

export function useNewsCarousel(
  items: NewsItem[],
  opts: Options = {}
) {
  const itemsPerView = opts.itemsPerView ?? 3;
  const [currentIndex, setCurrentIndex] = useState(0);

  // 计算总页数
  const totalPages = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.ceil(items.length / itemsPerView);
  }, [items.length, itemsPerView]);

  // 获取当前页显示的项目
  const currentItems = useMemo(() => {
    const start = currentIndex * itemsPerView;
    return items.slice(start, start + itemsPerView);
  }, [items, currentIndex, itemsPerView]);

  // 跳转到指定页
  const goToPage = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages) return;
    setCurrentIndex(pageIndex);
  };

  // 上一页
  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 下一页
  const goToNext = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return {
    currentItems,
    currentIndex,
    totalPages,
    goToPage,
    goToPrev,
    goToNext,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < totalPages - 1,
  };
}

