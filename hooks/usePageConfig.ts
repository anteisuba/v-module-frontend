// hooks/usePageConfig.ts

import { useState, useEffect, useCallback } from "react";
import { pageApi } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";
import { isDefaultConfig } from "@/utils/pageConfig";

export function usePageConfig() {
  const [config, setConfig] = useState<PageConfig>(EMPTY_PAGE_CONFIG);
  const [savedConfig, setSavedConfig] = useState<PageConfig | null>(null);
  const [themeColor, setThemeColor] = useState<string>("#000000");
  const [fontFamily, setFontFamily] = useState<string>("Inter");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await pageApi.getFullPageData();
      const draftConfig = response.draftConfig;
      
      // 加载主题设置
      if (response.themeColor) {
        setThemeColor(response.themeColor);
      }
      if (response.fontFamily) {
        setFontFamily(response.fontFamily);
      }
      
      if (draftConfig) {
        // 确保 newsBackground、blogBackground、blogDetailBackground 有默认值（兼容旧数据）
        const configWithBackgrounds = {
          ...draftConfig,
          newsBackground: draftConfig.newsBackground || {
            type: "color" as const,
            value: "#000000",
          },
          blogBackground: draftConfig.blogBackground || {
            type: "color" as const,
            value: "#000000",
          },
          blogDetailBackground: draftConfig.blogDetailBackground || {
            type: "color" as const,
            value: "#000000",
          },
        };

        // 优化：只在首次访问且未发布时清空默认配置
        // 如果已发布过，不再清空
        let finalConfig: PageConfig;
        if (configWithBackgrounds.hasPublished) {
          finalConfig = configWithBackgrounds;
        } else if (isDefaultConfig(configWithBackgrounds)) {
          // 只在首次访问且是默认配置时清空
          finalConfig = EMPTY_PAGE_CONFIG;
        } else {
          finalConfig = configWithBackgrounds;
        }
        
        setConfig(finalConfig);
        setSavedConfig(JSON.parse(JSON.stringify(finalConfig))); // 深拷贝作为保存的基准
      } else {
        // 如果没有配置，使用空配置（首次访问）
        setConfig(EMPTY_PAGE_CONFIG);
        setSavedConfig(JSON.parse(JSON.stringify(EMPTY_PAGE_CONFIG)));
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // 如果还没有配置，使用空配置（首次访问）
        setConfig(EMPTY_PAGE_CONFIG);
        setSavedConfig(JSON.parse(JSON.stringify(EMPTY_PAGE_CONFIG)));
      } else {
        setError(e instanceof Error ? e.message : "加载失败");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 检查是否有未保存的更改
  const hasUnsavedChanges = savedConfig !== null && 
    JSON.stringify(config) !== JSON.stringify(savedConfig);

  // 包装 setConfig 以更新保存状态
  const updateConfig = useCallback((newConfig: PageConfig | ((prev: PageConfig) => PageConfig)) => {
    setConfig((prevConfig) => {
      const updatedConfig = typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig;
      return updatedConfig;
    });
  }, []);

  // 标记为已保存
  const markAsSaved = useCallback(() => {
    setSavedConfig(JSON.parse(JSON.stringify(config)));
  }, [config]);

  return {
    config,
    setConfig: updateConfig,
    themeColor,
    setThemeColor,
    fontFamily,
    setFontFamily,
    loading,
    error,
    reloadConfig: loadConfig,
    hasUnsavedChanges,
    markAsSaved,
  };
}

