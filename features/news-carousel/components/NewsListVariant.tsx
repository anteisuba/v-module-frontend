// features/news-carousel/components/NewsListVariant.tsx
// News section "list" variant — pure text timeline (no images)

"use client";

import type { NewsSectionProps } from "@/domain/page-config/types";
import { hexToRgba } from "@/utils/color";

interface NewsListVariantProps {
  items: NewsSectionProps["items"];
  layout?: NewsSectionProps["layout"];
}

export default function NewsListVariant({ items, layout }: NewsListVariantProps) {
  const paddingX = layout?.paddingX ?? 24;
  const paddingY = layout?.paddingY ?? 64;
  const backgroundColor = layout?.backgroundColor;
  const backgroundOpacity = layout?.backgroundOpacity ?? 1;
  const backgroundColorWithOpacity = hexToRgba(backgroundColor, backgroundOpacity);

  return (
    <section
      className="relative w-full"
      style={{
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        paddingLeft: `${paddingX}px`,
        paddingRight: `${paddingX}px`,
        ...(backgroundColorWithOpacity
          ? { backgroundColor: backgroundColorWithOpacity }
          : {}),
      }}
    >
      <div className="mx-auto max-w-3xl">
        <ul className="space-y-0 divide-y divide-[color:var(--editorial-border)]">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href || "#"}
                target={item.href ? "_blank" : undefined}
                rel={item.href ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 py-4 transition-colors hover:bg-[color:var(--editorial-surface)]"
              >
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]">
                  News
                </span>
                <span className="flex-1 truncate text-sm text-[color:var(--editorial-text)] transition-colors group-hover:text-[color:var(--theme-primary)]">
                  {item.alt || "Untitled"}
                </span>
                <span className="text-xs text-[color:var(--editorial-muted)]">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
