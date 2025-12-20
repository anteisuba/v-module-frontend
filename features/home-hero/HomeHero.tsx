import HeroSection from "./components/HeroSection";
import { getPublicHeroSlides } from "@/domain/hero";

export default async function HomeHero() {
  // ✅ 支持通过环境变量指定站点标识（未来多站点）
  const siteKey = process.env.NEXT_PUBLIC_SITE_KEY;
  const dbSlides = await getPublicHeroSlides(siteKey);

  // DB -> UI（已补齐到 3 张）
  const slides = dbSlides.map((s) => ({
    src: s.src,
    alt: s.alt,
  }));

  return <HeroSection initialSlides={slides} />;
}
