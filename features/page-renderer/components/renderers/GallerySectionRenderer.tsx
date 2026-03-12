// features/page-renderer/components/renderers/GallerySectionRenderer.tsx

import type { GallerySectionProps } from "@/domain/page-config/types";

export default function GallerySectionRenderer({
  props,
  id,
}: {
  props: GallerySectionProps;
  id: string;
}) {
  const columnsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[props.columns || 3];

  const gapClass = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }[props.gap || "md"];

  if (!props.items || props.items.length === 0) {
    return null; // 如果没有图片，不渲染
  }

  return (
    <section
      data-section-id={id}
      data-section-type="gallery"
      className="px-5 py-6 sm:px-6 sm:py-7"
    >
      <div className={`grid ${columnsClass} ${gapClass}`}>
        {props.items.map((item) => {
          const content = (
            <div className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt || item.caption || "Gallery image"}
                className="h-full min-h-[18rem] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 p-5 text-white opacity-0 transition duration-300 group-hover:opacity-100">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/56">
                    Gallery
                  </div>
                  <div className="mt-2 font-serif text-xl font-light tracking-[0.03em]">
                    {item.caption}
                  </div>
                </div>
              )}
            </div>
          );

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}
