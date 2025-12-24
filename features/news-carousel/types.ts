// features/news-carousel/types.ts

export type NewsItem = {
  id: string;              // 唯一标识（文件名）
  src: string;             // 图片路径（来自 public/upload-img2/）
  alt?: string;            // 图片 alt 文本
  href: string;            // 点击跳转的外部 URL
  objectPosition?: string; // 图片位置，如 "center", "top", "bottom", "50% 50%" 等
};

