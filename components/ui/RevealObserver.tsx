"use client";

import { useEffect } from "react";

function markStaticRevealTargets() {
  const elements = document.querySelectorAll<HTMLElement>(".reveal, .line-wipe");

  elements.forEach((element) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("in-view");
    }
  });

  return elements;
}

export default function RevealObserver() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (prefersReducedMotion.matches) {
      markStaticRevealTargets();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px",
      },
    );

    const observeTargets = () => {
      const elements = markStaticRevealTargets();
      elements.forEach((element) => {
        if (!element.classList.contains("in-view")) {
          observer.observe(element);
        }
      });
    };

    observeTargets();

    const mutationObserver = new MutationObserver(() => {
      observeTargets();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
