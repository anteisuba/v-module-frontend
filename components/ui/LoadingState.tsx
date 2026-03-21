// components/ui/LoadingState.tsx
// 基于原则 01：系统状态可见性

"use client";

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

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  if (type === "skeleton") {
    return (
      <div
        className={`animate-pulse rounded-lg ${className}`}
        style={{ background: "color-mix(in srgb, var(--editorial-border) 40%, transparent)" }}
      >
        <div className="h-20 w-full" />
      </div>
    );
  }

  if (type === "progress" && progress !== undefined) {
    return (
      <div className={`space-y-2 ${className}`}>
        {message && (
          <p className="text-xs" style={{ color: "var(--editorial-muted)" }}>{message}</p>
        )}
        <div
          className="w-full rounded-full h-2"
          style={{ background: "color-mix(in srgb, var(--editorial-border) 50%, transparent)" }}
        >
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              background: "var(--editorial-accent)",
            }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {progress !== undefined && (
          <p className="text-xs text-right" style={{ color: "var(--editorial-muted)" }}>{progress}%</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]}`}
        style={{ borderColor: "var(--editorial-accent)", borderTopColor: "transparent" }}
        role="status"
        aria-label={message || "Loading"}
      />
      {message && (
        <span className="text-xs" style={{ color: "var(--editorial-muted)" }}>{message}</span>
      )}
    </div>
  );
}

