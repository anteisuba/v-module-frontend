// components/ui/SectionArchitectCard.tsx
"use client";

import { useI18n } from "@/lib/i18n/context";
import type { SectionConfig, SectionType } from "@/domain/page-config/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ────────────────────────────────────────────────────────────────────
// Section 元数据
// ────────────────────────────────────────────────────────────────────
const SECTION_META: Record<SectionType, { emoji: string; labelKey: string }> = {
  hero:    { emoji: "🖼️", labelKey: "sectionMeta.hero"    },
  video:   { emoji: "🎬", labelKey: "sectionMeta.video"   },
  news:    { emoji: "📰", labelKey: "sectionMeta.news"    },
  gallery: { emoji: "🖼️", labelKey: "sectionMeta.gallery" },
  menu:    { emoji: "☰",  labelKey: "sectionMeta.menu"    },
};

// ────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────
interface SectionArchitectCardProps {
  id: string;
  section: SectionConfig;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onToggleEnabled: () => void;
}

// ────────────────────────────────────────────────────────────────────
// 组件
// ────────────────────────────────────────────────────────────────────
export default function SectionArchitectCard({
  id,
  section,
  isSelected,
  disabled,
  onSelect,
  onToggleEnabled,
}: SectionArchitectCardProps) {
  const { t } = useI18n();
  const meta = SECTION_META[section.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={[
        "group relative overflow-hidden rounded-2xl border transition-all duration-200",
        isSelected
          ? "border-[color:var(--editorial-accent)] bg-[color:var(--editorial-accent)] shadow-md"
          : "border-[color:var(--editorial-border)] bg-[color:color-mix(in_srgb,var(--editorial-surface)_80%,transparent)] hover:border-[color:var(--editorial-accent)]/40",
        !section.enabled && !isSelected && "opacity-50",
        isDragging && "shadow-xl",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center">
        {/* 拖拽把手 */}
        <button
          type="button"
          {...listeners}
          className={[
            "flex cursor-grab items-center justify-center self-stretch px-2.5 active:cursor-grabbing",
            "text-[color:var(--editorial-muted)] opacity-25 transition hover:opacity-70 group-hover:opacity-60",
            isSelected && "opacity-60 hover:opacity-100",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          {/* 六点 grip 图标 */}
          <svg
            width="10"
            height="14"
            viewBox="0 0 10 14"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="2" cy="2"  r="1.5" />
            <circle cx="8" cy="2"  r="1.5" />
            <circle cx="2" cy="7"  r="1.5" />
            <circle cx="8" cy="7"  r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
          </svg>
        </button>

        {/* 主点击区域 */}
        <button
          type="button"
          onClick={onSelect}
          data-testid={`cms-architect-section-${section.type}`}
          className="flex flex-1 items-center gap-3 py-3 pr-3 text-left"
          aria-pressed={isSelected}
        >
          <span className="text-base leading-none" aria-hidden>
            {meta.emoji}
          </span>

          <span
            className={[
              "flex-1 text-sm font-medium leading-none",
              isSelected
                ? "text-[color:var(--editorial-accent-foreground)]"
                : "text-[color:var(--editorial-text)]",
            ].join(" ")}
          >
            {t(meta.labelKey)}
          </span>

          {/* ON / OFF 徽标 — 点击切换 */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onToggleEnabled();
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault();
                e.stopPropagation();
                onToggleEnabled();
              }
            }}
            className={[
              "rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] transition select-none",
              section.enabled
                ? isSelected
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-[color:var(--editorial-accent)]/10 text-[color:var(--editorial-accent)] hover:bg-[color:var(--editorial-accent)]/20"
                : "bg-[color:var(--editorial-border)] text-[color:var(--editorial-muted)] hover:bg-[color:var(--editorial-border)]/80",
              disabled && "pointer-events-none",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              section.enabled ? t("sectionMeta.enabled") : t("sectionMeta.disabled")
            }
          >
            {section.enabled ? t("sectionMeta.on") : t("sectionMeta.off")}
          </span>
        </button>
      </div>
    </div>
  );
}
