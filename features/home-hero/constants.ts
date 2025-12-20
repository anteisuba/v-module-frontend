// features/home-hero/constants.ts
import type { HeroSlide } from "./types";

// ✅ Fallback slides（仅在服务端失败时使用）
export const FALLBACK_SLIDES: HeroSlide[] = [
  { src: "/hero/nakajima.jpeg", alt: "hero 1" },
  { src: "/hero/2.jpeg", alt: "hero 2" },
  { src: "/hero/3.jpeg", alt: "hero 3" },
];
