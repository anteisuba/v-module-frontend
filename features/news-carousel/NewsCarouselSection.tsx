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
        setError("Failed to load news images");
      } finally {
        setLoading(false);
      }
    }

    fetchNewsItems();
  }, []);

  if (loading) {
    return null; // 加载时不显示，避免闪烁
  }

  if (error) {
    console.error("News carousel error:", error);
    return null; // 错误时不显示
  }

  return <NewsCarousel items={items} />;
}

