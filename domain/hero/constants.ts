// domain/hero/constants.ts
import type { HeroSlideDB } from "./types";

// ✅ 默认 Hero slides（用于补齐缺失的 slot）
export const DEFAULT_HERO_SLIDES: HeroSlideDB[] = [
  { slot: 1, src: "/hero/nakajima.jpeg", alt: "hero 1" },
  { slot: 2, src: "/hero/2.jpeg", alt: "hero 2" },
  { slot: 3, src: "/hero/3.jpeg", alt: "hero 3" },
];
