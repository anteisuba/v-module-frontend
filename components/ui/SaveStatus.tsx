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
  const { t, locale } = useI18n();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    // 获取当前语言
    const locale = typeof window !== "undefined" 
      ? navigator.language || "zh-CN"
      : "zh-CN";

    if (seconds < 10) {
      return t("cms.justNow") || "刚刚";
    }
    if (seconds < 60) {
      const text = t("cms.secondsAgo") || "{count}秒前";
      return text.replace("{count}", String(seconds));
    }
    if (minutes < 60) {
      const text = t("cms.minutesAgo") || "{count}分钟前";
      return text.replace("{count}", String(minutes));
    }
    if (hours < 24) {
      const text = t("cms.hoursAgo") || "{count}小时前";
      return text.replace("{count}", String(hours));
    }
    // 超过24小时，显示具体时间
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const formatFullDateTime = (date: Date) => {
    // 根据语言选择日期时间格式
    if (locale === "zh") {
      // 中文格式：2024年01月01日 14:30:25
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    } else if (locale === "ja") {
      // 日文格式：2024年01月01日 14:30:25
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    } else {
      // 英文格式：Jan 1, 2024 14:30:25
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }
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

  // 如果有未保存更改，显示未保存状态，但如果之前保存过，也显示上次保存时间（完整格式）
  if (hasUnsavedChanges) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-xs text-yellow-600 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse" />
          {t("cms.unsaved") || "未保存"}
        </span>
        {lastSaved && (
          <span className="text-xs text-black/50">
            {t("cms.lastSaved") || "上次保存"} {formatFullDateTime(lastSaved)}
          </span>
        )}
      </div>
    );
  }

  // 如果没有未保存更改且有保存记录，显示已保存状态
  if (lastSaved) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span>✓</span>
          <span>{t("cms.saved") || "已保存"} {formatTime(lastSaved)}</span>
        </span>
      </div>
    );
  }

  return null;
}

