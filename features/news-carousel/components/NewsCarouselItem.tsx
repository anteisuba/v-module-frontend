// features/news-carousel/components/NewsCarouselItem.tsx

"use client";

import Image from "next/image";
import type { NewsItem } from "../types";

type Props = {
  item: NewsItem;
};

// 判断是否为外部 URL
function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export default function NewsCarouselItem({ item }: Props) {
  const isExternal = isExternalUrl(item.src);
  const objectPosition = item.objectPosition || "center";

  const content = (
    <div className="relative w-full h-full group overflow-hidden rounded-lg">
      {isExternal ? (
        // 外部 URL 使用普通的 img 标签
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.alt || item.id}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          style={{
            width: "100%",
            height: "100%",
            objectPosition: objectPosition,
          }}
        />
      ) : (
        // 本地路径使用 Next.js Image 组件
        <Image
          src={item.src}
          alt={item.alt || item.id}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          style={{
            objectPosition: objectPosition,
          }}
        />
      )}
      {/* Hover 遮罩层 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </div>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        {content}
      </a>
    );
  }

  return <div className="w-full h-full">{content}</div>;
}

