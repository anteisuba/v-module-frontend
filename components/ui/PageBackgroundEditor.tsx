// components/ui/PageBackgroundEditor.tsx

"use client";

import { useState } from "react";
import type { PageConfig } from "@/domain/page-config/types";

interface PageBackgroundEditorProps {
  config: PageConfig;
  onConfigChange: (config: PageConfig) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<{ src: string }>;
  uploadingBackground?: boolean;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function PageBackgroundEditor({
  config,
  onConfigChange,
  disabled = false,
  onUploadImage,
  uploadingBackground = false,
  onToast,
  onError,
}: PageBackgroundEditorProps) {
  const [backgroundImageError, setBackgroundImageError] = useState(false);

  function handleBackgroundChange(type: "color" | "image", value: string) {
    onConfigChange({
      ...config,
      background: { type, value },
    });
  }

  // 上传背景图片
  async function uploadBackgroundImage(file: File) {
    if (!onUploadImage) return;
    setBackgroundImageError(false);
    try {
      const result = await onUploadImage(file);
      handleBackgroundChange("image", result.src);
      onToast?.("背景图片上传成功");
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "上传失败");
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-black">页面背景（控制 /u/[slug] 页面）</h2>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-black/70 mb-1.5 block">背景类型</label>
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleBackgroundChange("color", config.background.value)
              }
              className={`rounded px-3 py-1.5 text-xs transition-colors ${
                config.background.type === "color"
                  ? "bg-black text-white"
                  : "bg-white/70 text-black hover:bg-white/90"
              }`}
              disabled={disabled}
            >
              颜色
            </button>
            <button
              onClick={() =>
                handleBackgroundChange("image", config.background.value)
              }
              className={`rounded px-3 py-1.5 text-xs transition-colors ${
                config.background.type === "image"
                  ? "bg-black text-white"
                  : "bg-white/70 text-black hover:bg-white/90"
              }`}
              disabled={disabled}
            >
              图片
            </button>
          </div>
        </div>

        {config.background.type === "color" ? (
          <div>
            <label className="text-xs text-black/70 mb-1.5 block">背景颜色</label>
            <input
              type="color"
              value={config.background.value}
              onChange={(e) =>
                handleBackgroundChange("color", e.target.value)
              }
              className="h-8 w-full rounded border border-black/10"
              disabled={disabled}
            />
            {/* 颜色预览 */}
            <div
              className="mt-2 h-24 w-full rounded border border-black/10"
              style={{ backgroundColor: config.background.value }}
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-black/70 mb-1.5 block">图片 URL</label>
            <input
              type="text"
              value={config.background.value}
              onChange={(e) => {
                setBackgroundImageError(false);
                handleBackgroundChange("image", e.target.value);
              }}
              placeholder="/path/to/image.jpg 或 https://example.com/image.jpg"
              className="w-full rounded border border-black/10 bg-white/70 px-3 py-1.5 text-xs text-black mb-2"
              disabled={uploadingBackground || disabled}
            />
            {/* 上传本地图片 */}
            <div className="mb-2">
              <label className="block text-xs text-black/70 mb-1.5">
                上传本地图片
              </label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-[10px] text-black/80 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-black file:px-2 file:py-1 file:text-[10px] file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
                disabled={uploadingBackground || disabled}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  const inputElement = e.currentTarget;
                  if (file) {
                    await uploadBackgroundImage(file);
                    if (inputElement) {
                      inputElement.value = "";
                    }
                  }
                }}
              />
              {uploadingBackground && (
                <div className="mt-1 text-[10px] text-black/60">上传中...</div>
              )}
            </div>
            {/* 图片预览 */}
            <div className="mt-2 h-48 w-full rounded border border-black/10 overflow-hidden bg-black/5 relative">
              {config.background.value && !backgroundImageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.background.value}
                  alt="背景预览"
                  className="h-full w-full object-cover"
                  onError={() => setBackgroundImageError(true)}
                  onLoad={() => setBackgroundImageError(false)}
                />
              ) : config.background.value && backgroundImageError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-black/50">图片加载失败</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-black/50">暂无图片</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

