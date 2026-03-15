// components/ui/Alert.tsx

"use client";

interface AlertProps {
  type?: "error" | "success" | "info" | "warning";
  message: string;
  onClose?: () => void;
  className?: string;
}

const statusColors = {
  error: {
    border: "color-mix(in srgb, #9a4b3d 40%, transparent)",
    bg: "color-mix(in srgb, #9a4b3d 8%, var(--editorial-surface))",
    text: "#9a4b3d",
  },
  success: {
    border: "color-mix(in srgb, #6b8a5e 40%, transparent)",
    bg: "color-mix(in srgb, #6b8a5e 8%, var(--editorial-surface))",
    text: "#6b8a5e",
  },
  info: {
    border: "color-mix(in srgb, var(--editorial-accent) 40%, transparent)",
    bg: "color-mix(in srgb, var(--editorial-accent) 8%, var(--editorial-surface))",
    text: "var(--editorial-accent)",
  },
  warning: {
    border: "color-mix(in srgb, #b8863a 40%, transparent)",
    bg: "color-mix(in srgb, #b8863a 8%, var(--editorial-surface))",
    text: "#b8863a",
  },
};

export default function Alert({
  type = "info",
  message,
  onClose,
  className = "",
}: AlertProps) {
  const colors = statusColors[type];
  const role = type === "error" || type === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      className={`mb-4 rounded-lg border px-3 py-2 text-xs ${className}`}
      style={{
        borderColor: colors.border,
        background: colors.bg,
        color: colors.text,
      }}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

