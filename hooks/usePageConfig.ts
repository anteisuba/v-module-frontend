// hooks/usePageConfig.ts

import { useState, useEffect, useCallback } from "react";
import { pageApi } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";
import { isDefaultConfig } from "@/utils/pageConfig";

export function usePageConfig() {
  const [config, setConfig] = useState<PageConfig>(EMPTY_PAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const draftConfig = await pageApi.getDraftConfig();
      if (draftConfig) {
        // 确保 newsBackground 有默认值（兼容旧数据）
        const configWithNewsBackground = {
          ...draftConfig,
          newsBackground: draftConfig.newsBackground || {
            type: "color" as const,
            value: "#000000",
          },
        };

        // 优化：只在首次访问且未发布时清空默认配置
        // 如果已发布过，不再清空
        if (configWithNewsBackground.hasPublished) {
          setConfig(configWithNewsBackground);
        } else if (isDefaultConfig(configWithNewsBackground)) {
          // 只在首次访问且是默认配置时清空
          setConfig(EMPTY_PAGE_CONFIG);
        } else {
          setConfig(configWithNewsBackground);
        }
      } else {
        // 如果没有配置，使用空配置（首次访问）
        setConfig(EMPTY_PAGE_CONFIG);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // 如果还没有配置，使用空配置（首次访问）
        setConfig(EMPTY_PAGE_CONFIG);
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

  return {
    config,
    setConfig,
    loading,
    error,
    reloadConfig: loadConfig,
  };
}

