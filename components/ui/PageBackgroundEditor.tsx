// components/ui/PageBackgroundEditor.tsx

"use client";

import type { PageConfig } from "@/domain/page-config/types";
import { PAGE_BACKGROUND, type MediaAssetUsageContext } from "@/domain/media/usage";
import { useScrollToElement } from "@/hooks/useScrollToElement";
import BackgroundEditor from "./BackgroundEditor";
import { useI18n } from "@/lib/i18n/context";

interface PageBackgroundEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
  onUploadImage?: (
    file: File,
    options?: { usageContext?: MediaAssetUsageContext }
  ) => Promise<{ src: string }>;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
  focusTarget?: string | null;
}

export default function PageBackgroundEditor({
  config,
  onConfigChange,
  disabled = false,
  onUploadImage,
  onToast,
  onError,
  focusTarget = null,
}: PageBackgroundEditorProps) {
  const { t } = useI18n();
  useScrollToElement(
    focusTarget === "page-background",
    "page-background-editor"
  );

  return (
    <div
      id="page-background-editor"
      className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-black">{t("pageBackgroundEditor.title")}</h2>
      </div>
      <BackgroundEditor
        background={config.background}
        onBackgroundChange={(background) => {
          onConfigChange({
            ...config,
            background,
          });
        }}
        disabled={disabled}
        onUploadImage={onUploadImage}
        usageContext={PAGE_BACKGROUND}
        onToast={onToast}
        onError={onError}
        previewHeight="h-48"
      />
    </div>
  );
}

