"use client";

import { createPortal } from "react-dom";
import Button from "./Button";
import MediaLibraryBrowser from "./MediaLibraryBrowser";
import type { MediaAssetUsageContext } from "@/domain/media/usage";
import type { MediaAssetSummary } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

interface MediaPickerDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  selectedSrc?: string | null;
  selectLabel?: string;
  disabledAssetIds?: string[];
  usageContext?: MediaAssetUsageContext;
  onSelect: (asset: MediaAssetSummary) => void;
  onClose: () => void;
}

export default function MediaPickerDialog({
  open,
  title,
  description,
  selectedSrc = null,
  selectLabel,
  disabledAssetIds,
  usageContext,
  onSelect,
  onClose,
}: MediaPickerDialogProps) {
  const { t } = useI18n();

  if (!open) {
    return null;
  }

  const dialogContent = (
    <div
      data-testid="media-picker-dialog"
      className="fixed inset-0 z-[100000] bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[#f8f5ef] shadow-[0_24px_72px_rgba(17,12,6,0.18)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-black">
                {title || t("mediaLibrary.title")}
              </h2>
              <p className="mt-1 text-sm text-black/60">
                {description || t("mediaLibrary.description")}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            <MediaLibraryBrowser
              selectedSrc={selectedSrc}
              disabledAssetIds={disabledAssetIds}
              usageContext={usageContext}
              onSelect={(asset) => {
                onSelect(asset);
                onClose();
              }}
              selectLabel={selectLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(dialogContent, document.body);
  }

  return null;
}
