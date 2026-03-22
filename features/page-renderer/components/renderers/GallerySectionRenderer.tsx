// features/page-renderer/components/renderers/GallerySectionRenderer.tsx

import type { GallerySectionProps } from "@/domain/page-config/types";
import { hexToRgba } from "@/utils/color";

export default function GallerySectionRenderer({
  props,
  id,
  variant,
}: {
  props: GallerySectionProps;
  id: string;
  variant?: string;
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
    return null;
  }

  // Masonry variant uses CSS columns
  if (variant === "masonry") {
    const masonryColumns = {
      2: "columns-1 md:columns-2",
      3: "columns-1 md:columns-2 lg:columns-3",
      4: "columns-1 md:columns-2 lg:columns-4",
    }[props.columns || 3];

    const masonryGap = {
      sm: "gap-2 [&>*]:mb-2",
      md: "gap-4 [&>*]:mb-4",
      lg: "gap-6 [&>*]:mb-6",
    }[props.gap || "md"];

    return (
      <section
        data-section-id={id}
        data-section-type="gallery"
        data-variant="masonry"
        className="px-5 py-6 sm:px-6 sm:py-7"
      >
        <div className={`${masonryColumns} ${masonryGap}`}>
          {props.items.map((item) => (
            <GalleryItem key={item.id} item={item} aspectFree />
          ))}
        </div>
      </section>
    );
  }

  // Default grid variant
  return (
    <section
      data-section-id={id}
      data-section-type="gallery"
      data-variant="grid"
      className="px-5 py-6 sm:px-6 sm:py-7"
    >
      <div className={`grid ${columnsClass} ${gapClass}`}>
        {props.items.map((item) => (
          <GalleryItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function GalleryItem({
  item,
  aspectFree,
}: {
  item: GallerySectionProps["items"][number];
  aspectFree?: boolean;
}) {
  const content = (
    <div className="group relative overflow-hidden rounded-[var(--radius,1.35rem)] border border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.alt || item.caption || "Gallery image"}
        className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${
          aspectFree ? "" : "h-full min-h-[18rem]"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      {item.caption && (
        <div className="absolute inset-x-0 bottom-0 p-5 text-white opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/56">
            Gallery
          </div>
          <div className="mt-2 font-[family-name:var(--font-display)] text-xl font-light tracking-[0.03em]">
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
        className="block break-inside-avoid"
      >
        {content}
      </a>
    );
  }

  return <div key={item.id} className="break-inside-avoid">{content}</div>;
}
