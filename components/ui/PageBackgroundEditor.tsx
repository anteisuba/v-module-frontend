// components/ui/PageBackgroundEditor.tsx

"use client";

import type { PageConfig } from "@/domain/page-config/types";
import BackgroundEditor from "./BackgroundEditor";

interface PageBackgroundEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<{ src: string }>;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function PageBackgroundEditor({
  config,
  onConfigChange,
  disabled = false,
  onUploadImage,
  onToast,
  onError,
}: PageBackgroundEditorProps) {
  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-black">页面背景（控制 /u/[slug] 页面）</h2>
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
        onToast={onToast}
        onError={onError}
        previewHeight="h-48"
      />
    </div>
  );
}

