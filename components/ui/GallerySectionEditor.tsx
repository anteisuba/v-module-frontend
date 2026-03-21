// components/ui/GallerySectionEditor.tsx
"use client";

import { useState } from "react";
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
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "@/lib/i18n/context";
import { MediaPickerDialog } from "@/components/ui";
import { GALLERY_IMAGE } from "@/domain/media/usage";
import type { UploadImageOptions } from "@/lib/api/types";
import type { PageConfig, GallerySectionProps } from "@/domain/page-config/types";

const GALLERY_USAGE = GALLERY_IMAGE;

// ────────────────────────────────────────────────────────────────────
// 單張圖片卡片（可拖曳）
// ────────────────────────────────────────────────────────────────────
interface GalleryItemCardProps {
  item: GallerySectionProps["items"][number];
  onUpdate: (patch: Partial<GallerySectionProps["items"][number]>) => void;
  onDelete: () => void;
  onPickImage: () => void;
  disabled?: boolean;
}

function GalleryItemCard({ item, onUpdate, onDelete, onPickImage, disabled }: GalleryItemCardProps) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group relative overflow-hidden rounded-xl border border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface)]"
    >
      {/* 圖片區域 */}
      <div className="relative aspect-square overflow-hidden bg-[color:var(--editorial-border)]/30">
        {item.src ? (
          <img
            src={item.src}
            alt={item.alt || ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-[color:var(--editorial-muted)]">
            🖼️
          </div>
        )}

        {/* Hover 操作層 */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onPickImage}
            disabled={disabled}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-medium text-gray-800 transition hover:bg-white disabled:opacity-50"
          >
            {t("galleryEditor.changeImage")}
          </button>
        </div>

        {/* 拖曳把手 */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          tabIndex={-1}
          aria-label="drag"
          className="absolute left-1.5 top-1.5 flex h-6 w-6 cursor-grab items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
            <circle cx="2.5" cy="2.5" r="1.2" /><circle cx="7.5" cy="2.5" r="1.2" />
            <circle cx="2.5" cy="5"   r="1.2" /><circle cx="7.5" cy="5"   r="1.2" />
            <circle cx="2.5" cy="7.5" r="1.2" /><circle cx="7.5" cy="7.5" r="1.2" />
          </svg>
        </button>

        {/* 刪除按鈕 */}
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition hover:bg-red-500/80 group-hover:opacity-100 disabled:opacity-50"
          aria-label={t("common.delete")}
        >
          ✕
        </button>
      </div>

      {/* Alt / Caption */}
      <div className="space-y-1.5 p-2.5">
        <input
          type="text"
          value={item.alt || ""}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          disabled={disabled}
          placeholder={t("galleryEditor.altPlaceholder")}
          className="w-full rounded-md border border-[color:var(--editorial-border)] bg-transparent px-2 py-1 text-[11px] text-[color:var(--editorial-text)] placeholder:text-[color:var(--editorial-muted)] focus:outline-none focus:ring-1 focus:ring-[color:var(--editorial-accent)] disabled:opacity-50"
        />
        <input
          type="text"
          value={item.href || ""}
          onChange={(e) => onUpdate({ href: e.target.value || undefined })}
          disabled={disabled}
          placeholder={t("galleryEditor.hrefPlaceholder")}
          className="w-full rounded-md border border-[color:var(--editorial-border)] bg-transparent px-2 py-1 text-[11px] text-[color:var(--editorial-text)] placeholder:text-[color:var(--editorial-muted)] focus:outline-none focus:ring-1 focus:ring-[color:var(--editorial-accent)] disabled:opacity-50"
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────
interface GallerySectionEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
  onUploadImage?: (
    file: File,
    opts: UploadImageOptions
  ) => Promise<{ src: string }>;
  onToast?: (msg: string) => void;
  onError?: (msg: string) => void;
}

// ────────────────────────────────────────────────────────────────────
// 主元件
// ────────────────────────────────────────────────────────────────────
export default function GallerySectionEditor({
  config,
  onConfigChange,
  disabled,
  onUploadImage,
  onToast,
  onError,
}: GallerySectionEditorProps) {
  const { t } = useI18n();
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  // 取得 gallery section（需要在 hook 呼叫之後做 early return）
  const gallerySectionRaw = config.sections.find((s) => s.type === "gallery");
  if (!gallerySectionRaw || gallerySectionRaw.type !== "gallery") return null;

  // 此時型別已收窄，用常數避免閉包中重複收窄
  const gallerySectionId = gallerySectionRaw.id;
  const props: GallerySectionProps = gallerySectionRaw.props;
  const items = props.items || [];
  const columns = props.columns ?? 3;
  const gap = props.gap ?? "md";

  // [DEBUG] 追蹤 items 變化

  // ── helpers ────────────────────────────────────────────────────
  function updateProps(patch: Partial<GallerySectionProps>) {
    onConfigChange({
      ...config,
      sections: config.sections.map((s) =>
        s.id === gallerySectionId && s.type === "gallery"
          ? { ...s, props: { ...s.props, ...patch } }
          : s
      ),
    });
  }

  function updateItem(
    index: number,
    patch: Partial<GallerySectionProps["items"][number]>
  ) {
    const next = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    updateProps({ items: next });
  }

  function deleteItem(index: number) {
    updateProps({ items: items.filter((_, i) => i !== index) });
  }

  function addItem() {
    const newItem = {
      id: `gallery-item-${Date.now()}`,
      src: "",
      alt: "",
    };
    updateProps({ items: [...items, newItem] });
    setPickerIndex(items.length); // 新增後立即開啟 picker
  }

  // ── 上傳 ──────────────────────────────────────────────────────
  async function handleUpload(index: number, file: File) {
    if (!onUploadImage) return;
    try {
      const result = await onUploadImage(file, { usageContext: GALLERY_USAGE });
      updateItem(index, { src: result.src });
      onToast?.(t("galleryEditor.uploadSuccess"));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t("common.error"));
    }
  }

  // ── 拖曳排序 ─────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((item) => item.id === active.id);
    const newIdx = items.findIndex((item) => item.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    updateProps({ items: arrayMove(items, oldIdx, newIdx) });
  }

  // ── 當前選中的 picker item ────────────────────────────────────
  const pickerItem = pickerIndex !== null ? items[pickerIndex] : null;

  return (
    <div className="space-y-5">
      {/* ── 佈局設定 ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[color:var(--editorial-border)] bg-[color:var(--editorial-surface)] px-4 py-3">
        {/* 列數 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[color:var(--editorial-muted)]">
            {t("galleryEditor.columns")}
          </span>
          <div className="flex gap-1">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateProps({ columns: n })}
                disabled={disabled}
                className={[
                  "h-6 w-6 rounded text-[11px] font-medium transition",
                  columns === n
                    ? "bg-[color:var(--editorial-accent)] text-[color:var(--editorial-accent-foreground)]"
                    : "bg-[color:var(--editorial-border)] text-[color:var(--editorial-text)] hover:bg-[color:var(--editorial-accent)]/20",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 間距 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[color:var(--editorial-muted)]">
            {t("galleryEditor.gap")}
          </span>
          <div className="flex gap-1">
            {(["sm", "md", "lg"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateProps({ gap: g })}
                disabled={disabled}
                className={[
                  "rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition",
                  gap === g
                    ? "bg-[color:var(--editorial-accent)] text-[color:var(--editorial-accent-foreground)]"
                    : "bg-[color:var(--editorial-border)] text-[color:var(--editorial-text)] hover:bg-[color:var(--editorial-accent)]/20",
                ].join(" ")}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* 新增圖片 */}
        <button
          type="button"
          onClick={addItem}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg bg-[color:var(--editorial-accent)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--editorial-accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
        >
          + {t("galleryEditor.addImage")}
        </button>
      </div>

      {/* ── 圖片網格 ─────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[color:var(--editorial-border)] py-10 text-center">
          <div className="text-3xl">🖼️</div>
          <p className="text-sm text-[color:var(--editorial-muted)]">
            {t("galleryEditor.empty")}
          </p>
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className="rounded-lg border border-[color:var(--editorial-accent)] px-4 py-1.5 text-[11px] text-[color:var(--editorial-accent)] transition hover:bg-[color:var(--editorial-accent)]/10 disabled:opacity-50"
          >
            {t("galleryEditor.addImage")}
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {items.map((item, index) => (
                <GalleryItemCard
                  key={item.id}
                  item={item}
                  disabled={disabled}
                  onUpdate={(patch) => updateItem(index, patch)}
                  onDelete={() => deleteItem(index)}
                  onPickImage={() => setPickerIndex(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ── MediaPicker 彈窗 ──────────────────────────────────── */}
      <MediaPickerDialog
        open={pickerIndex !== null}
        selectedSrc={pickerItem?.src || null}
        usageContext={GALLERY_USAGE}
        onClose={() => setPickerIndex(null)}
        onSelect={(asset) => {
          if (pickerIndex !== null) {
            updateItem(pickerIndex, { src: asset.src });
            onToast?.(t("mediaLibrary.selected"));
          }
          setPickerIndex(null);
        }}
      />
    </div>
  );
}
