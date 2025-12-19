"use client";

import { useEffect, useMemo, useState } from "react";

export type HeroSlide = {
  src: string;
  alt?: string;
  href?: string | null;
};

type Options = {
  intervalMs?: number; // 默认 20000
  fadeMs?: number; // 默认 2000
};

export function useHeroSlides(slidesInput: HeroSlide[], opts: Options = {}) {
  const intervalMs = opts.intervalMs ?? 20000;
  const fadeMs = opts.fadeMs ?? 2000;

  const slides = useMemo(
    () => (slidesInput ?? []).filter((s) => s?.src),
    [slidesInput]
  );

  const safeSlides: HeroSlide[] = useMemo(() => {
    if (slides.length > 0) return slides;
    return [{ src: "/hero/nakajima.jpeg", alt: "hero" }];
  }, [slides]);

  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (safeSlides.length <= 1) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const intervalId = setInterval(() => {
      setFadeIn(false);
      timeoutId = setTimeout(() => {
        setIndex((prev) => (prev + 1) % safeSlides.length);
        setFadeIn(true);
      }, fadeMs);
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [safeSlides.length, intervalMs, fadeMs]);

  const current = safeSlides[index];

  const goTo = (nextIndex: number) => {
    if (safeSlides.length <= 1) return;
    if (nextIndex === index) return;
    setFadeIn(false);
    setTimeout(() => {
      setIndex(
        ((nextIndex % safeSlides.length) + safeSlides.length) %
          safeSlides.length
      );
      setFadeIn(true);
    }, fadeMs);
  };

  return {
    slides: safeSlides,
    current,
    index,
    fadeIn,
    intervalMs,
    fadeMs,
    setIndex,
    goTo,
  };
}
