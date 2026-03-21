// components/ui/DraftPreviewPanel.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@/lib/i18n/context";
import type { SectionConfig, SectionType } from "@/domain/page-config/types";

// ────────────────────────────────────────────────────────────────────
// 裝置尺寸配置
// ────────────────────────────────────────────────────────────────────
type DeviceSize = "mobile" | "tablet" | "desktop";

const DEVICE_CONFIG: Record<
  DeviceSize,
  { labelKey: string; icon: string; width: number | "100%" }
> = {
  mobile:  { labelKey: "cms.preview.mobile",  icon: "📱", width: 390     },
  tablet:  { labelKey: "cms.preview.tablet",  icon: "💻", width: 768     },
  desktop: { labelKey: "cms.preview.desktop", icon: "🖥️",  width: "100%" },
};

// ────────────────────────────────────────────────────────────────────
// Section 元數據
// ────────────────────────────────────────────────────────────────────
const SECTION_META: Record<SectionType, { emoji: string; labelKey: string }> = {
  hero:    { emoji: "🖼️", labelKey: "sectionMeta.hero"    },
  video:   { emoji: "🎬", labelKey: "sectionMeta.video"   },
  news:    { emoji: "📰", labelKey: "sectionMeta.news"    },
  gallery: { emoji: "🖼️", labelKey: "sectionMeta.gallery" },
  menu:    { emoji: "☰",  labelKey: "sectionMeta.menu"    },
};

// ────────────────────────────────────────────────────────────────────
// 可拖曳 Section chip
// ────────────────────────────────────────────────────────────────────
function SortableChip({
  section,
  isSelected,
  onSelect,
}: {
  section: SectionConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  const meta = SECTION_META[section.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={[
        "group flex items-center gap-1 rounded-xl border transition-all",
        isSelected
          ? "border-[color:var(--editorial-accent)] bg-[color:var(--editorial-accent)]"
          : "border-[color:var(--editorial-border)] bg-white/60 hover:border-[color:var(--editorial-accent)]/40",
        !section.enabled && "opacity-50",
      ].filter(Boolean).join(" ")}
    >
      {/* 拖曳把手 */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="drag"
        className={[
          "flex cursor-grab items-center justify-center self-stretch px-2 active:cursor-grabbing",
          "text-[color:var(--editorial-muted)] opacity-0 transition group-hover:opacity-60",
          isSelected && "opacity-40",
        ].filter(Boolean).join(" ")}
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" aria-hidden>
          <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
          <circle cx="2" cy="6"  r="1.2" /><circle cx="6" cy="6"  r="1.2" />
          <circle cx="2" cy="10" r="1.2" /><circle cx="6" cy="10" r="1.2" />
        </svg>
      </button>

      {/* 主點擊 */}
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 py-2.5 pr-3 text-left"
      >
        <span className="text-sm leading-none" aria-hidden>{meta.emoji}</span>
        <span className={[
          "flex-1 truncate text-[11px] font-medium",
          isSelected
            ? "text-[color:var(--editorial-accent-foreground)]"
            : "text-[color:var(--editorial-text)]",
        ].join(" ")}>
          {t(meta.labelKey)}
        </span>
        {!section.enabled && (
          <span className={[
            "text-[9px] uppercase tracking-[0.15em]",
            isSelected
              ? "text-[color:color-mix(in_srgb,var(--editorial-accent-foreground)_50%,transparent)]"
              : "text-[color:var(--editorial-muted)]",
          ].join(" ")}>
            {t("sectionMeta.off")}
          </span>
        )}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 同步狀態類型
// ────────────────────────────────────────────────────────────────────
type SyncStatus = "idle" | "syncing" | "done" | "error";

// ────────────────────────────────────────────────────────────────────
// 主元件
// ────────────────────────────────────────────────────────────────────
interface DraftPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  sections: SectionConfig[];        // 已排序（order asc）
  onReorder: (newSections: SectionConfig[]) => void;
  /** 把完整 config 同步到草稿，傳入 sections 的父 config 物件的 serializable 版本 */
  onSyncDraft: () => Promise<void>;
}

export default function DraftPreviewPanel({
  isOpen,
  onClose,
  slug,
  sections,
  onReorder,
  onSyncDraft,
}: DraftPreviewPanelProps) {
  const { t } = useI18n();
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 追蹤面板開啟後是否已做過第一次同步
  const hasSyncedRef = useRef(false);
  // 追蹤上次成功同步的 sections 序列化值，避免內容未變時重複同步
  const lastSyncedHashRef = useRef<string | null>(null);

  // Esc 關閉
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── 同步草稿並刷新 iframe ──────────────────────────────────────────
  const syncAndRefresh = useCallback(async (force = false) => {
    const currentHash = JSON.stringify(sections);
    // 內容沒變就跳過（初始同步強制執行）
    if (!force && currentHash === lastSyncedHashRef.current) return;

    setSyncStatus("syncing");
    try {
      await onSyncDraft();
      lastSyncedHashRef.current = currentHash;
      setSyncStatus("done");
      // 稍等後刷新 iframe，讓伺服器端有時間寫入
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = `/admin/preview/${slug}?t=${Date.now()}`;
        }
      }, 300);
      // 2 秒後回到 idle
      setTimeout(() => setSyncStatus("idle"), 2500);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  // sections 加入 deps，確保 currentHash 永遠反映最新 sections
  }, [onSyncDraft, sections, slug]);

  // ── 面板打開時做一次初始同步（強制，不管 hash）────────────────────
  useEffect(() => {
    if (isOpen && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      syncAndRefresh(true); // force=true：忽略 hash 比較
    }
    if (!isOpen) {
      hasSyncedRef.current = false;
      lastSyncedHashRef.current = null; // 重置，下次開啟強制同步
    }
  }, [isOpen, syncAndRefresh]);

  // ── sections 變更時 debounce 500ms 自動同步 ───────────────────────
  useEffect(() => {
    if (!isOpen || !hasSyncedRef.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      syncAndRefresh();
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, isOpen]);

  // ── 拖曳排序 ─────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(sections, oldIdx, newIdx);
    onReorder(reordered.map((s, i) => ({ ...s, order: i })));
  }

  const device = DEVICE_CONFIG[deviceSize];
  const iframeWidth = device.width === "100%" ? "100%" : `${device.width}px`;

  // ── 同步狀態 UI ──────────────────────────────────────────────────
  const syncIndicator = {
    idle:    { text: "",            color: "" },
    syncing: { text: t("cms.preview.syncing"), color: "text-[color:var(--editorial-muted)]" },
    done:    { text: t("cms.preview.synced"),  color: "text-emerald-500" },
    error:   { text: t("cms.preview.syncError"), color: "text-red-400" },
  }[syncStatus];

  return (
    <>
      {/* 遮罩 */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden
      />

      {/* 面板本體 */}
      <div
        className={[
          "fixed inset-y-0 right-0 z-50 flex w-[80vw] flex-col shadow-2xl",
          "bg-[color:var(--editorial-surface,#f8f8f6)] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={t("cms.preview.title")}
      >
        {/* ── 頂部工具列 ─────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[color:var(--editorial-border)] bg-white/80 px-4 py-3 backdrop-blur-sm">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--editorial-muted)]">
            {t("cms.preview.title")}
          </span>

          {/* 同步狀態 */}
          {syncStatus !== "idle" && (
            <span className={`flex items-center gap-1 text-[10px] transition-all ${syncIndicator.color}`}>
              {syncStatus === "syncing" && (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              {syncStatus === "done" && <span>✓</span>}
              {syncStatus === "error" && <span>✕</span>}
              {syncIndicator.text}
            </span>
          )}

          <div className="flex-1" />

          {/* 裝置尺寸切換 */}
          <div className="flex items-center gap-1 rounded-xl border border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface)] p-1">
            {(["mobile", "tablet", "desktop"] as DeviceSize[]).map((size) => {
              const cfg = DEVICE_CONFIG[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDeviceSize(size)}
                  className={[
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                    deviceSize === size
                      ? "bg-[color:var(--editorial-accent)] text-[color:var(--editorial-accent-foreground)] shadow-sm"
                      : "text-[color:var(--editorial-muted)] hover:text-[color:var(--editorial-text)]",
                  ].join(" ")}
                  aria-pressed={deviceSize === size}
                >
                  <span aria-hidden>{cfg.icon}</span>
                  <span>{t(cfg.labelKey)}</span>
                  {typeof cfg.width === "number" && (
                    <span className="opacity-40">{cfg.width}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 手動刷新 */}
          <button
            type="button"
            onClick={() => syncAndRefresh(true)}
            disabled={syncStatus === "syncing"}
            title={t("cms.preview.refresh")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--editorial-muted)] transition hover:bg-[color:var(--editorial-border)] hover:text-[color:var(--editorial-text)] disabled:opacity-40"
            aria-label={t("cms.preview.refresh")}
          >
            <svg
              className={syncStatus === "syncing" ? "animate-spin" : ""}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          {/* 關閉 */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--editorial-muted)] transition hover:bg-[color:var(--editorial-border)] hover:text-[color:var(--editorial-text)]"
            aria-label={t("cms.preview.close")}
          >
            ✕
          </button>
        </div>

        {/* ── 主體：左側排序欄 + 右側預覽 ─────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* 左側：可拖曳的 section 排序清單 */}
          <div className="flex w-44 shrink-0 flex-col gap-2 overflow-y-auto border-r border-[color:var(--editorial-border)] bg-white/50 p-3">
            <div className="px-1 text-[9px] uppercase tracking-[0.2em] text-[color:var(--editorial-muted)]/60">
              {t("cms.preview.sections")}
            </div>

            {sections.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-[color:var(--editorial-muted)]">—</div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {sections.map((section) => (
                      <SortableChip
                        key={section.id}
                        section={section}
                        isSelected={selectedSectionId === section.id}
                        onSelect={() =>
                          setSelectedSectionId(selectedSectionId === section.id ? null : section.id)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* 右側：iframe 預覽 */}
          <div className="relative flex flex-1 flex-col items-center overflow-auto bg-[color:color-mix(in_srgb,var(--editorial-border)_30%,white)]">
            <div
              className={[
                "relative flex h-full flex-col transition-all duration-300",
                deviceSize !== "desktop" && "my-4 overflow-hidden rounded-2xl shadow-xl",
              ].filter(Boolean).join(" ")}
              style={{ width: iframeWidth, maxWidth: "100%" }}
            >
              {/* 裝置頂部模擬條 */}
              {deviceSize === "mobile" && (
                <div className="flex h-7 shrink-0 items-center justify-center rounded-t-2xl bg-gray-900">
                  <div className="h-1 w-16 rounded-full bg-white/20" />
                </div>
              )}
              {deviceSize === "tablet" && (
                <div className="flex h-5 shrink-0 items-center justify-center rounded-t-2xl bg-gray-800">
                  <div className="h-1 w-10 rounded-full bg-white/20" />
                </div>
              )}

              {/* iframe */}
              <iframe
                ref={iframeRef}
                src={`/admin/preview/${slug}`}
                className="h-full w-full flex-1 border-0 bg-white"
                style={{ minHeight: "600px" }}
                title="Draft page preview"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />

              {/* 同步中遮罩 */}
              {syncStatus === "syncing" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md text-[12px] text-[color:var(--editorial-muted)]">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    {t("cms.preview.syncing")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 底部說明 ───────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[color:var(--editorial-border)] bg-white/60 px-4 py-2 text-center text-[10px] text-[color:var(--editorial-muted)]">
          {t("cms.preview.draftNote")}
        </div>
      </div>
    </>
  );
}
