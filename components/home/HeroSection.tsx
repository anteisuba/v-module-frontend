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

export default function HeroSection() {
  const menu = useHeroMenu();

  // 你可以调：Hero 滚动长度（越大越“慢”）
  const HERO_SCROLL_HEIGHT_VH = 150;

  // 你可以调：图片本体高度（越大可露出的下方越多）
  const HERO_IMAGE_HEIGHT_VH = 150;

  const slides = useMemo(() => DEFAULT_SLIDES, []);

  // 轮播 + fade
  const {
    slides: allSlides,
    current,
    index,
    fadeIn,
    fadeMs,
    goTo,
  } = useHeroSlides(slides, {
    intervalMs: 20000,
    fadeMs: 1000,
  });

  // sticky-scroll progress
  const sectionRef = useRef<HTMLElement | null>(null);
  const { progress, vh } = useStickyProgress(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative w-full bg-black"
      style={{ height: `${HERO_SCROLL_HEIGHT_VH}vh` }}
    >
      {/* sticky 视窗 */}
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

        {/* 临时占位字（你要删随时删） */}
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <span className="text-2xl tracking-[0.4em] opacity-80">HERO</span>
        </div>

        {/* ✅ 下一步你要的：底部三图轮播放这里 */}
        {/* <div className="absolute bottom-10 left-0 right-0 z-40">...</div> */}
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
