// components/ui/SectionVariantSelector.tsx
"use client";

import type { SectionType } from "@/domain/page-config/types";

const VARIANT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  news: [
    { value: "grid", label: "Carousel" },
    { value: "list", label: "Timeline" },
  ],
  gallery: [
    { value: "grid", label: "Grid" },
    { value: "masonry", label: "Masonry" },
  ],
  video: [
    { value: "grid", label: "Grid" },
    { value: "featured", label: "Featured" },
  ],
};

interface SectionVariantSelectorProps {
  sectionType: SectionType;
  value: string;
  onChange: (variant: string) => void;
  disabled?: boolean;
}

export function SectionVariantSelector({
  sectionType,
  value,
  onChange,
  disabled,
}: SectionVariantSelectorProps) {
  const options = VARIANT_OPTIONS[sectionType];
  if (!options || options.length < 2) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-black/5 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-white text-black shadow-sm"
              : "text-black/50 hover:text-black/70"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
