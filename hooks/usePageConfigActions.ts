// hooks/usePageConfigActions.ts

import { useState, useCallback, useRef, useEffect } from "react";
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

  // 使用 ref 确保 saveDraft 永远读取最新 config，避免 stale closure 问题
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      // 永远从 ref 读取最新 config（避免 stale closure）
      const latestConfig = configRef.current;
      const cleanedConfig = cleanPageConfig(latestConfig);

      // 保存时同时传递主题设置
      await pageApi.updateDraftConfig(cleanedConfig, {
        themeColor,
        fontFamily,
      });

      onToast?.("cms.draftSaved");
      // 更新本地配置：使用 functional update 确保基于最新状态清理
      setConfig(cleanPageConfig(configRef.current));
    } catch (e) {
      onError?.(e);
    } finally {
      setSaving(false);
    }
  }, [setConfig, themeColor, fontFamily, onError, onToast]);

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      // 先保存草稿（带 hasPublished 标记）
      const configToSave = {
        ...configRef.current,
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
  }, [setConfig, themeColor, fontFamily, onError, onToast]);

  return {
    saving,
    publishing,
    saveDraft,
    publish,
  };
}

