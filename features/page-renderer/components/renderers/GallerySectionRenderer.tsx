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
      className={`py-16 px-6 max-w-7xl mx-auto`}
    >
      <div className={`grid ${columnsClass} ${gapClass}`}>
        {props.items.map((item) => {
          const content = (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt || item.caption || "Gallery image"}
                className="w-full h-full object-cover rounded-lg"
              />
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 text-white rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.caption}
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

