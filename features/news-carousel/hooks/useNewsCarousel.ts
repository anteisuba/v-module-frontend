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
  const [startIndex, setStartIndex] = useState(0); // 起始索引，而不是页索引

  // 计算可用的起始索引数量（点的数量）
  const totalDots = useMemo(() => {
    if (items.length === 0) return 0;
    if (items.length <= itemsPerView) return 1; // 如果图片数量 <= 每页显示数，只有1个点
    return items.length - itemsPerView + 1; // 例如：6张图片，每页3张 = 4个点
  }, [items.length, itemsPerView]);

  // 获取当前显示的项目（从 startIndex 开始，显示 itemsPerView 张）
  const currentItems = useMemo(() => {
    return items.slice(startIndex, startIndex + itemsPerView);
  }, [items, startIndex, itemsPerView]);

  // 跳转到指定起始索引
  const goToStartIndex = (newStartIndex: number) => {
    const maxStartIndex = Math.max(0, items.length - itemsPerView);
    if (newStartIndex < 0 || newStartIndex > maxStartIndex) return;
    setStartIndex(newStartIndex);
  };

  // 上一页（向左移动）
  const goToPrev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  // 下一页（向右移动）
  const goToNext = () => {
    const maxStartIndex = Math.max(0, items.length - itemsPerView);
    if (startIndex < maxStartIndex) {
      setStartIndex(startIndex + 1);
    }
  };

  return {
    currentItems,
    startIndex, // 当前起始索引
    totalDots, // 点的总数
    goToStartIndex, // 跳转到指定起始索引
    goToPrev,
    goToNext,
    hasPrev: startIndex > 0,
    hasNext: startIndex < Math.max(0, items.length - itemsPerView),
  };
}

