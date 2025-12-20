import HeroSection from "./components/HeroSection";
import { FALLBACK_SLIDES } from "./constants";

export default function HomeHero() {
  // 首页使用固定的默认 slides（不再从数据库读取）
  const slides = FALLBACK_SLIDES;

  return <HeroSection initialSlides={slides} />;
}
