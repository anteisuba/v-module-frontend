"use client";

import { useMemo, useRef } from "react";
import HeroBackground from "./HeroBackground";
import HeroHeader from "./HeroHeader";
import { useHeroSlides } from "../hooks/useHeroSlides";
import { useStickyProgress } from "@/lib/hooks/useStickyProgress";
import HeroThumbStrip from "./HeroThumbStrip";
import type { HeroSlide } from "../types";
import { hexToRgba } from "@/utils/color";

import type { SocialLinkItem, LogoPosition, SocialLinksPosition } from "@/domain/page-config/types";

export default function HeroSection({
  initialSlides,
  logo,
  socialLinks,
  title,
  subtitle,
  showThumbStrip = true,
  showLogo = true,
  showSocialLinks = true,
  logoPosition,
  socialLinksPosition,
  layout,
  carousel,
}: {
  initialSlides?: HeroSlide[];
  logo?: { src?: string; alt?: string; opacity?: number; size?: number };
  socialLinks?: SocialLinkItem[];
  title?: string;
  subtitle?: string;
  showThumbStrip?: boolean;
  showLogo?: boolean;
  showSocialLinks?: boolean;
  logoPosition?: LogoPosition;
  socialLinksPosition?: SocialLinksPosition;
  layout?: {
    heightVh?: number;
    backgroundColor?: string;
    backgroundOpacity?: number;
    parallax?: boolean;
  };
  carousel?: {
    autoplayInterval?: number;
    transitionDuration?: number;
  };
}) {
  // 可见高度：优先使用当前 slide 的 heightVh，否则使用 section 级别的 heightVh
  // 兼容旧配置：旧版 heightVh 可能 > 100（视差模式），一律 clamp 到 100
  const globalHeightVh = Math.min(Math.max(layout?.heightVh ?? 100, 30), 100);

  // 视差由用户显式控制，默认关闭
  const parallaxEnabled = layout?.parallax === true;
  const visibleHeightVh = globalHeightVh;
  const backgroundColor = layout?.backgroundColor; // undefined → CSS 变量生效
  const backgroundOpacity = layout?.backgroundOpacity ?? 1;
  const backgroundColorWithOpacity = hexToRgba(backgroundColor, backgroundOpacity);

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

  // 当前 slide 的图片总高度（用于视差滚动距离），允许 20-300vh
  const currentSlideHeightVh = current?.heightVh != null
    ? Math.min(Math.max(current.heightVh, 20), 300)
    : visibleHeightVh;

  // 视差模式：
  //   section 高度 = 图片总高度（提供滚动距离）
  //   可见窗口 = layout.heightVh（sticky，用户在视口中看到的区域）
  //   视差距离 = 图片总高度 - 可见窗口
  // 非视差模式：
  //   section 高度 = 可见窗口 = 图片总高度（完整展示图片比例）
  const sectionHeightVh = parallaxEnabled
    ? Math.max(currentSlideHeightVh, visibleHeightVh)
    : currentSlideHeightVh;
  const viewportHeightVh = parallaxEnabled
    ? visibleHeightVh
    : currentSlideHeightVh;

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative w-full"
      style={{
        height: `${sectionHeightVh}vh`,
        backgroundColor: backgroundColorWithOpacity,
        transition: "height 0.4s ease",
      }}
    >
      <div
        className={parallaxEnabled ? "sticky top-0 w-full overflow-hidden" : "relative w-full overflow-hidden"}
        style={{ height: `${viewportHeightVh}vh`, transition: "height 0.4s ease" }}
      >
        {/* 背景图片轮播 */}
        {current && current.src && (
          <HeroBackground
            src={current.src}
            alt={current.alt}
            fadeIn={fadeIn}
            fadeMs={fadeMs}
            objectPosition={current.objectPosition}
            progress={parallaxEnabled ? progress : 0}
            vh={vh}
            imageHeightVh={sectionHeightVh}
          />
        )}

        <HeroHeader
          logo={logo}
          socialLinks={socialLinks}
          showLogo={showLogo}
          showSocialLinks={showSocialLinks}
          logoPosition={logoPosition}
          socialLinksPosition={socialLinksPosition}
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
