// hooks/usePageConfigActions.ts

import { useState, useCallback } from "react";
import { pageApi } from "@/lib/api";
import type { PageConfig } from "@/domain/page-config/types";
import { cleanPageConfig } from "@/utils/pageConfig";
import type { useErrorHandler } from "./useErrorHandler";
import type { useToast } from "./useToast";

interface UsePageConfigActionsOptions {
  config: PageConfig;
  setConfig: (config: PageConfig) => void;
  themeColor?: string;
  fontFamily?: string;
  onError?: ReturnType<typeof useErrorHandler>["handleError"];
  onToast?: ReturnType<typeof useToast>["showToast"];
}

export function usePageConfigActions({
  config,
  setConfig,
  themeColor,
  fontFamily,
  onError,
  onToast,
}: UsePageConfigActionsOptions) {
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      // 清理配置数据
      const cleanedConfig = cleanPageConfig(config);

      // 保存时同时传递主题设置
      await pageApi.updateDraftConfig(cleanedConfig, {
        themeColor,
        fontFamily,
      });

      onToast?.("cms.draftSaved");
      // 更新本地配置为清理后的版本
      setConfig(cleanedConfig);
    } catch (e) {
      onError?.(e);
    } finally {
      setSaving(false);
    }
  }, [config, setConfig, themeColor, fontFamily, onError, onToast]);

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      // 先保存草稿（带 hasPublished 标记）
      const configToSave = {
        ...config,
        hasPublished: true, // 标记为已发布
      };
      const cleanedConfig = cleanPageConfig(configToSave);
      
      // 保存时同时传递主题设置
      await pageApi.updateDraftConfig(cleanedConfig, {
        themeColor,
        fontFamily,
      });

      // 然后发布
      await pageApi.publish();

      // 更新本地配置，设置 hasPublished 标记
      setConfig(cleanedConfig);

      onToast?.("cms.published");
    } catch (e) {
      onError?.(e);
    } finally {
      setPublishing(false);
    }
  }, [config, setConfig, themeColor, fontFamily, onError, onToast]);

  return {
    saving,
    publishing,
    saveDraft,
    publish,
  };
}

