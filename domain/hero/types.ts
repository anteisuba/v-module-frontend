// domain/hero/types.ts

export type HeroSlideDB = {
  slot: 1 | 2 | 3;
  src: string;
  alt?: string; // ✅ 注意：这里不要 null
};
