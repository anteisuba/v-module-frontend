// src/app/page.tsx
import { HomeHero } from "@/features/home-hero";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <HomeHero />
      <div className="h-[200vh]" />
    </main>
  );
}
