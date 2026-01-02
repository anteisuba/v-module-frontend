// features/news-carousel/NewsCarouselSection.tsx

"use client";

import { useEffect, useState } from "react";
import NewsCarousel from "./components/NewsCarousel";
import { newsApi } from "@/lib/api/endpoints";
import { NEWS_LINKS } from "./config";
import type { NewsItem } from "./types";

export default function NewsCarouselSection() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNewsItems() {
      try {
        setLoading(true);
        setError(null);
        const newsItems = await newsApi.getNewsItems();
        
        // 如果没有图片，不显示错误，只是不显示轮播
        if (!newsItems || newsItems.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }
        
        // 为每个图片添加外部链接（从配置文件读取）
        const itemsWithLinks: NewsItem[] = newsItems.map((item) => {
          const filename = item.id; // id 就是文件名
          const href = NEWS_LINKS[filename] || item.href || "#";
          return {
            ...item,
            href,
          };
        });
        
        setItems(itemsWithLinks);
      } catch (err) {
        console.error("Failed to fetch news items:", err);
        // 如果目录不存在或其他错误，静默处理，不显示错误
        // 这样即使没有图片也不会影响页面显示
        setItems([]);
        setError(null); // 不设置错误，静默失败
      } finally {
        setLoading(false);
      }
    }

    fetchNewsItems();
  }, []);

  // 如果没有项目，不显示轮播
  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return null; // 加载时不显示，避免闪烁
  }

  return <NewsCarousel items={items} />;
}

