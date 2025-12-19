import HeroSection from "@/components/home/HeroSection";
import { getPublicHeroSlides } from "@/lib/siteConfig";

export default async function HomeHero() {
  const dbSlides = await getPublicHeroSlides();

  // DB -> UI
  const slides = dbSlides.map((s) => ({
    src: s.src,
    alt: s.alt,
  }));

  return <HeroSection initialSlides={slides} />;
}
