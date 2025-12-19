// src/app/page.tsx
import HeroSection from "../components/home/HeroSection";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <HeroSection />
      <div className="h-[200vh]" />
    </main>
  );
}
