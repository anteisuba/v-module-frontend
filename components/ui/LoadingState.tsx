// components/ui/LoadingState.tsx
// 基于原则 01：系统状态可见性

"use client";

import { useI18n } from "@/lib/i18n/context";

interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100
  type?: "spinner" | "skeleton" | "progress";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingState({
  message,
  progress,
  type = "spinner",
  size = "md",
  className = "",
}: LoadingStateProps) {
  const { t } = useI18n();

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  if (type === "skeleton") {
    return (
      <div className={`animate-pulse bg-black/10 rounded-lg ${className}`}>
        <div className="h-20 w-full" />
      </div>
    );
  }

  if (type === "progress" && progress !== undefined) {
    return (
      <div className={`space-y-2 ${className}`}>
        {message && (
          <p className="text-xs text-black/70">{message}</p>
        )}
        <div className="w-full bg-black/10 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {progress !== undefined && (
          <p className="text-xs text-black/50 text-right">{progress}%</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-black border-t-transparent ${sizeClasses[size]}`}
        role="status"
        aria-label={message || t("common.loading")}
      />
      {message && (
        <span className="text-xs text-black/70">{message}</span>
      )}
    </div>
  );
}

