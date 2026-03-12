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
    <div className="group relative h-full w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/16">
      {isExternal ? (
        // 外部 URL 使用普通的 img 标签
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.alt || item.id}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          style={{
            objectPosition: objectPosition,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/8 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/52">
          News
        </div>
        <div className="mt-2 font-serif text-[1.35rem] font-light tracking-[0.03em] text-white">
          {item.alt || "Feature"}
        </div>
      </div>
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
