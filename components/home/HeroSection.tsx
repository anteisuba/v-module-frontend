"use client";

import { useMemo, useRef } from "react";
import HeroBackground from "./hero/components/HeroBackground";
import HeroHeader from "./hero/components/HeroHeader";
import { HeroSlide, useHeroSlides } from "./hero/hooks/useHeroSlides";
import { useStickyProgress } from "./hero/hooks/useStickyProgress";
import HeroThumbStrip from "./hero/components/HeroThumbStrip";
import HeroMenu from "./hero/components/HeroMenu";
import { useHeroMenu } from "./hero/hooks/useHeroMenu";

const DEFAULT_SLIDES: HeroSlide[] = [
  { src: "/hero/nakajima.jpeg", alt: "hero 1" },
  { src: "/hero/2.jpeg", alt: "hero 2" },
  { src: "/hero/3.jpeg", alt: "hero 3" },
];

export default function HeroSection({
  initialSlides,
}: {
  initialSlides?: HeroSlide[];
}) {
  const menu = useHeroMenu();

  const HERO_SCROLL_HEIGHT_VH = 150;
  const HERO_IMAGE_HEIGHT_VH = 150;

  const slides = useMemo(() => {
    // ✅ 有 CMS 的就用 CMS 的；没有就 fallback 到 DEFAULT_SLIDES
    return initialSlides && initialSlides.length > 0
      ? initialSlides
      : DEFAULT_SLIDES;
  }, [initialSlides]);

  const {
    slides: allSlides,
    current,
    index,
    fadeIn,
    fadeMs,
    goTo,
  } = useHeroSlides(slides, { intervalMs: 20000, fadeMs: 1000 });

  const sectionRef = useRef<HTMLElement | null>(null);
  const { progress, vh } = useStickyProgress(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative w-full bg-black"
      style={{ height: `${HERO_SCROLL_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <HeroBackground
          src={current.src}
          alt={current.alt}
          fadeIn={fadeIn}
          fadeMs={fadeMs}
          progress={progress}
          vh={vh}
          imageHeightVh={HERO_IMAGE_HEIGHT_VH}
        />

        <HeroHeader onMenuClick={menu.toggleMenu} />

        <div className="absolute inset-0 flex items-center justify-center text-white">
          <span className="text-2xl tracking-[0.4em] opacity-80">HERO</span>
        </div>

        <HeroThumbStrip
          slides={allSlides}
          currentIndex={index}
          onPick={(i) => goTo(i)}
        />
        <HeroMenu open={menu.open} onClose={menu.closeMenu} />
      </div>
    </section>
  );
}
