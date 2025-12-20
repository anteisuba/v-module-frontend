// domain/hero/index.ts
export type { HeroSlideDB } from "./types";
export { DEFAULT_HERO_SLIDES } from "./constants";
export {
  normalizeSlides,
  fillSlidesWithDefaults,
  getPublicHeroSlides,
} from "./services";
