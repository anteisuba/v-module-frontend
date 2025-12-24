// features/home-hero/types.ts

export type HeroSlide = {
  src: string;
  alt?: string;
  href?: string | null;
  objectPosition?: string; // 图片位置，如 "center", "top", "bottom", "50% 50%" 等
};
