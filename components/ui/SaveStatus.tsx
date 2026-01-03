// components/ui/SaveStatus.tsx
// 基于原则 01：系统状态可见性

"use client";

import { useI18n } from "@/lib/i18n/context";
import LoadingState from "./LoadingState";

interface SaveStatusProps {
  saving?: boolean;
  publishing?: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  className?: string;
}

export default function SaveStatus({
  saving = false,
  publishing = false,
  lastSaved = null,
  hasUnsavedChanges = false,
  className = "",
}: SaveStatusProps) {
  const { t } = useI18n();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return "刚刚";
    if (seconds < 60) return `${seconds}秒前`;
    if (minutes < 60) return `${minutes}分钟前`;
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  if (publishing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LoadingState type="spinner" size="sm" message={t("cms.publishing")} />
      </div>
    );
  }

  if (saving) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LoadingState type="spinner" size="sm" message={t("cms.saving")} />
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-yellow-600 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse" />
          未保存
        </span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span>✓</span>
          <span>已保存 {formatTime(lastSaved)}</span>
        </span>
      </div>
    );
  }

  return null;
}

