"use client";

import { useMemo, useRef } from "react";
import HeroBackground from "./HeroBackground";
import HeroHeader from "./HeroHeader";
import { useHeroSlides } from "../hooks/useHeroSlides";
import { useStickyProgress } from "@/lib/hooks/useStickyProgress";
import HeroThumbStrip from "./HeroThumbStrip";
import type { HeroSlide } from "../types";

import type { SocialLinkItem } from "@/domain/page-config/types";

export default function HeroSection({
  initialSlides,
  logo,
  socialLinks,
  title,
  subtitle,
  showThumbStrip = true,
  showLogo = true,
  showSocialLinks = true,
  layout,
  carousel,
}: {
  initialSlides?: HeroSlide[];
  logo?: { src?: string; alt?: string; opacity?: number };
  socialLinks?: SocialLinkItem[];
  title?: string;
  subtitle?: string;
  showThumbStrip?: boolean;
  showLogo?: boolean;
  showSocialLinks?: boolean;
  layout?: {
    heightVh?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
  };
  carousel?: {
    autoplayInterval?: number;
    transitionDuration?: number;
  };
}) {
  const HERO_SCROLL_HEIGHT_VH = layout?.heightVh ?? 150;
  // 可见区域高度：最多 100vh（全屏），heightVh 超出部分用于视差滚动
  const visibleHeightVh = Math.min(HERO_SCROLL_HEIGHT_VH, 100);
  const HERO_IMAGE_HEIGHT_VH = HERO_SCROLL_HEIGHT_VH;
  const backgroundColor = layout?.backgroundColor || "#000000";
  const backgroundOpacity = layout?.backgroundOpacity ?? 1;

  // 将背景颜色和透明度转换为 rgba
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(backgroundColor);
  const backgroundColorWithOpacity = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${backgroundOpacity})`;

  const slides = useMemo(() => {
    // 如果没有传入图片，返回空数组（不显示图片）
    if (!initialSlides || initialSlides.length === 0) {
      return [];
    }
    // 过滤掉没有 src 的图片
    return initialSlides.filter((s) => s?.src);
  }, [initialSlides]);

  // 轮播逻辑：无论 showThumbStrip 如何，轮播功能都会持续工作
  // 使用配置的轮播参数，如果没有配置则使用默认值
  const autoplayInterval = (carousel?.autoplayInterval ?? 5) * 1000; // 转换为毫秒
  const transitionDuration = (carousel?.transitionDuration ?? 0.5) * 1000; // 转换为毫秒
  
  const {
    slides: allSlides,
    current,
    index,
    fadeIn,
    fadeMs,
    goTo,
  } = useHeroSlides(slides, { 
    intervalMs: autoplayInterval, 
    fadeMs: transitionDuration 
  });

  const sectionRef = useRef<HTMLElement | null>(null);
  const { progress, vh } = useStickyProgress(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative w-full"
      style={{
        height: `${HERO_SCROLL_HEIGHT_VH}vh`,
        backgroundColor: backgroundColorWithOpacity,
      }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: `${visibleHeightVh}vh` }}
      >
        {/* 背景图片轮播：仅在有多张图片时显示 */}
        {current && current.src && (
          <HeroBackground
            src={current.src}
            alt={current.alt}
            fadeIn={fadeIn}
            fadeMs={fadeMs}
            objectPosition={current.objectPosition}
            progress={progress}
            vh={vh}
            imageHeightVh={HERO_IMAGE_HEIGHT_VH}
          />
        )}

        <HeroHeader
          logo={logo}
          socialLinks={socialLinks}
          showLogo={showLogo}
          showSocialLinks={showSocialLinks}
        />

        {title && (
          <div
            className={[
              "absolute inset-x-0 bottom-32 z-[5] transition-opacity duration-300",
              "opacity-100",
            ].join(" ")}
          >
            <div className="mx-auto max-w-6xl px-6">
              <div className="max-w-3xl">
                <div className="text-[10px] uppercase tracking-[0.32em] text-white/52">
                  Editorial landing
                </div>
                <div className="mt-5 h-px w-28 bg-white/18" />
                <h1 className="mt-8 font-serif text-[clamp(3.4rem,8vw,7.5rem)] font-light leading-[0.92] tracking-[0.03em] text-white drop-shadow-[0_20px_60px_rgba(17,12,6,0.32)]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 drop-shadow-[0_10px_30px_rgba(17,12,6,0.2)] sm:text-lg">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* 底部缩略图条：仅在有多张图片时显示 */}
        {showThumbStrip === true && allSlides.length > 0 ? (
          <HeroThumbStrip
            slides={allSlides}
            currentIndex={index}
            onPick={(i) => goTo(i)}
          />
        ) : null}
      </div>
    </section>
  );
}
