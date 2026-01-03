// hooks/useBackgroundEditor.ts

import { useState, useCallback } from "react";

export type BackgroundType = "color" | "image";
export type BackgroundConfig = {
  type: BackgroundType;
  value: string;
};

interface UseBackgroundEditorOptions {
  initialBackground: BackgroundConfig;
  onBackgroundChange?: (background: BackgroundConfig) => void;
  onUploadImage?: (file: File) => Promise<{ src: string }>;
  onToast?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useBackgroundEditor({
  initialBackground,
  onBackgroundChange,
  onUploadImage,
  onToast,
  onError,
}: UseBackgroundEditorOptions) {
  const [background, setBackground] = useState<BackgroundConfig>(initialBackground);
  const [backgroundImageError, setBackgroundImageError] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  // 更新背景配置
  const updateBackground = useCallback(
    (newBackground: BackgroundConfig) => {
      setBackground(newBackground);
      onBackgroundChange?.(newBackground);
    },
    [onBackgroundChange]
  );

  // 切换背景类型
  const setBackgroundType = useCallback(
    (type: BackgroundType) => {
      updateBackground({
        type,
        value: background.value,
      });
    },
    [background.value, updateBackground]
  );

  // 设置背景值（颜色或图片 URL）
  const setBackgroundValue = useCallback(
    (value: string) => {
      updateBackground({
        type: background.type,
        value,
      });
    },
    [background.type, updateBackground]
  );

  // 上传背景图片
  const uploadBackgroundImage = useCallback(
    async (file: File) => {
      if (!onUploadImage) {
        throw new Error("onUploadImage is not provided");
      }

      setUploadingBackground(true);
      setBackgroundImageError(false);

      try {
        const result = await onUploadImage(file);
        updateBackground({
          type: "image",
          value: result.src,
        });
        onToast?.("背景图片上传成功");
        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "上传失败";
        onError?.(errorMessage);
        throw e;
      } finally {
        setUploadingBackground(false);
      }
    },
    [onUploadImage, onToast, onError, updateBackground]
  );

  // 处理图片输入变化
  const handleImageInputChange = useCallback(
    (value: string) => {
      setBackgroundImageError(false);
      setBackgroundValue(value);
    },
    [setBackgroundValue]
  );

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    setBackgroundImageError(true);
  }, []);

  // 处理图片加载成功
  const handleImageLoad = useCallback(() => {
    setBackgroundImageError(false);
  }, []);

  return {
    background,
    backgroundImageError,
    uploadingBackground,
    setBackgroundType,
    setBackgroundValue,
    uploadBackgroundImage,
    handleImageInputChange,
    handleImageError,
    handleImageLoad,
    updateBackground,
  };
}

