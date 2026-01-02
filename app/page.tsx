// src/app/page.tsx
import { HomeHero } from "@/features/home-hero";
import { NewsCarouselSection } from "@/features/news-carousel";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <HomeHero />
      <NewsCarouselSection />
    </main>
  );
}
