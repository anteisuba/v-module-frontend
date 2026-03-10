"use client";

import { useEffect } from "react";

export function useScrollToElement(
  shouldScroll: boolean,
  elementId: string
) {
  useEffect(() => {
    if (!shouldScroll) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      document.getElementById(elementId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [elementId, shouldScroll]);
}
