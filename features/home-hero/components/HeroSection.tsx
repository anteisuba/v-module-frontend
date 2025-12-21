"use client";

import { useMemo, useRef } from "react";
import HeroBackground from "./HeroBackground";
import HeroHeader from "./HeroHeader";
import { useHeroSlides } from "../hooks/useHeroSlides";
import { useStickyProgress } from "@/lib/hooks/useStickyProgress";
import HeroThumbStrip from "./HeroThumbStrip";
import HeroMenu from "./HeroMenu";
import { useHeroMenu } from "../hooks/useHeroMenu";
import type { HeroSlide } from "../types";
import { FALLBACK_SLIDES } from "../constants";

import type { SocialLinkItem } from "@/domain/page-config/types";

export default function HeroSection({
  initialSlides,
  logo,
  socialLinks,
  title,
  subtitle,
}: {
  initialSlides?: HeroSlide[];
  logo?: { src?: string; alt?: string };
  socialLinks?: SocialLinkItem[];
  title?: string;
  subtitle?: string;
}) {
  const menu = useHeroMenu();

  const HERO_SCROLL_HEIGHT_VH = 150;
  const HERO_IMAGE_HEIGHT_VH = 150;

  const slides = useMemo(() => {
    // ✅ 服务端已保证返回 3 张（补齐逻辑），这里只做 fallback 保护
    if (initialSlides && initialSlides.length > 0) {
      return initialSlides;
    }
    // 仅在服务端失败时使用 fallback
    return FALLBACK_SLIDES;
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

        <HeroHeader 
          onMenuClick={menu.toggleMenu}
          logo={logo}
          socialLinks={socialLinks}
        />

        {/* Title 和 Subtitle - 菜单打开时隐藏 */}
        {title && (
          <div 
            className={[
              "absolute top-20 left-0 right-0 z-[5] text-center transition-opacity duration-300",
              menu.open ? "opacity-0 pointer-events-none" : "opacity-100"
            ].join(" ")}
          >
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-xl text-white/80 drop-shadow-md">{subtitle}</p>
            )}
          </div>
        )}

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
