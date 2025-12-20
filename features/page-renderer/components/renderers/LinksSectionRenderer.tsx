// features/page-renderer/components/renderers/LinksSectionRenderer.tsx

"use client";

import type { LinksSectionProps } from "@/domain/page-config/types";

export default function LinksSectionRenderer({
  props,
  id,
}: {
  props: LinksSectionProps;
  id: string;
}) {
  const layoutClass =
    props.layout === "list"
      ? "flex flex-col gap-4"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <section
      data-section-id={id}
      data-section-type="links"
      className={`py-16 px-6 max-w-6xl mx-auto ${layoutClass}`}
    >
      {props.items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className="flex items-center gap-3 p-4 border border-white/20 rounded-lg bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.icon && <span className="text-2xl">{item.icon}</span>}
          <span className="font-medium">{item.label}</span>
        </a>
      ))}
    </section>
  );
}

