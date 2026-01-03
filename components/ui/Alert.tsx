// components/ui/Alert.tsx

"use client";

interface AlertProps {
  type?: "error" | "success" | "info" | "warning";
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function Alert({
  type = "info",
  message,
  onClose,
  className = "",
}: AlertProps) {
  const typeStyles = {
    error: "border-red-500/30 bg-red-50 text-red-700",
    success: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
    info: "border-blue-500/30 bg-blue-50 text-blue-700",
    warning: "border-yellow-500/30 bg-yellow-50 text-yellow-700",
  };

  return (
    <div
      className={`mb-4 rounded-lg border px-3 py-2 text-xs ${typeStyles[type]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-current opacity-70 hover:opacity-100"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

