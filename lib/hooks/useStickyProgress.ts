"use client";

import { RefObject, useEffect, useState } from "react";

export function useStickyProgress(sectionRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0); // 0..1
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const calcVh = () => setVh(window.innerHeight);
    calcVh();
    window.addEventListener("resize", calcVh);
    return () => window.removeEventListener("resize", calcVh);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;

      // 总可滚动距离 = section高度 - 视口高度
      const total = rect.height - viewportH;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
      const p = total > 0 ? scrolled / total : 0;

      setProgress(p);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionRef]);

  return { progress, vh };
}
