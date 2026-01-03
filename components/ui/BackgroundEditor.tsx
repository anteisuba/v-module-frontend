// components/ui/BackgroundEditor.tsx

"use client";

import { useBackgroundEditor, type BackgroundConfig } from "@/hooks/useBackgroundEditor";

interface BackgroundEditorProps {
  label?: string;
  background: BackgroundConfig;
  onBackgroundChange: (background: BackgroundConfig) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<{ src: string }>;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
  previewHeight?: string; // 预览区域高度，如 "h-24" 或 "h-48"
}

export default function BackgroundEditor({
  label = "背景设置",
  background,
  onBackgroundChange,
  disabled = false,
  onUploadImage,
  onToast,
  onError,
  previewHeight = "h-24",
}: BackgroundEditorProps) {
  const {
    backgroundImageError,
    uploadingBackground,
    setBackgroundType,
    setBackgroundValue,
    uploadBackgroundImage,
    handleImageInputChange,
    handleImageError,
    handleImageLoad,
  } = useBackgroundEditor({
    initialBackground: background,
    onBackgroundChange,
    onUploadImage,
    onToast,
    onError,
  });

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-black mb-1.5">{label}</label>
      )}
      
      {/* 背景类型切换 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBackgroundType("color")}
          className={`rounded px-3 py-1.5 text-xs transition-colors ${
            background.type === "color"
              ? "bg-black text-white"
              : "bg-white/70 text-black hover:bg-white/90"
          }`}
          disabled={disabled}
        >
          颜色
        </button>
        <button
          type="button"
          onClick={() => setBackgroundType("image")}
          className={`rounded px-3 py-1.5 text-xs transition-colors ${
            background.type === "image"
              ? "bg-black text-white"
              : "bg-white/70 text-black hover:bg-white/90"
          }`}
          disabled={disabled}
        >
          图片
        </button>
      </div>

      {/* 颜色选择器 */}
      {background.type === "color" ? (
        <div>
          <input
            type="color"
            value={background.value}
            onChange={(e) => setBackgroundValue(e.target.value)}
            className="h-8 w-full rounded border border-black/10"
            disabled={disabled}
          />
          {/* 颜色预览 */}
          <div
            className={`mt-2 w-full rounded border border-black/10 ${previewHeight}`}
            style={{ backgroundColor: background.value }}
          />
        </div>
      ) : (
        /* 图片设置 */
        <div>
          <input
            type="text"
            value={background.value}
            onChange={(e) => handleImageInputChange(e.target.value)}
            placeholder="/path/to/image.jpg 或 https://example.com/image.jpg"
            className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black mb-2"
            disabled={uploadingBackground || disabled}
          />
          
          {/* 上传本地图片 */}
          {onUploadImage && (
            <div className="mb-2">
              <label className="block text-xs text-black/70 mb-1.5">上传本地图片</label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-[10px] text-black/80 file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-black file:px-2 file:py-1 file:text-[10px] file:text-white file:transition-colors file:duration-200 hover:file:bg-black/90"
                disabled={uploadingBackground || disabled}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  const inputElement = e.currentTarget;
                  if (file) {
                    try {
                      await uploadBackgroundImage(file);
                    } catch (e) {
                      // 错误已由 hooks 处理
                    } finally {
                      if (inputElement) {
                        inputElement.value = "";
                      }
                    }
                  }
                }}
              />
              {uploadingBackground && (
                <div className="mt-1 text-[10px] text-black/60">上传中...</div>
              )}
            </div>
          )}
          
          {/* 图片预览 */}
          <div
            className={`mt-2 w-full rounded border border-black/10 overflow-hidden bg-black/5 relative ${previewHeight}`}
          >
            {background.value && !backgroundImageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={background.value}
                alt="背景预览"
                className="h-full w-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : background.value && backgroundImageError ? (
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
  );
}

