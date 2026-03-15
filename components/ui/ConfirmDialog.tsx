// components/ui/ConfirmDialog.tsx
// 基于原则 03：用户控制与自由 + 05：防错设计

"use client";

import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      onConfirm();
    }
  };

  if (!open) return null;

  const dialogContent = (
    <div
      data-testid="confirm-dialog"
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        pointerEvents: "auto",
        background: "color-mix(in srgb, var(--editorial-bg) 60%, transparent)",
      }}
    >
      <div
        className="editorial-card max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
          zIndex: 100000,
        }}
      >
        <h3
          id="confirm-dialog-title"
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--editorial-text)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--editorial-muted)" }}
        >
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            data-testid="confirm-dialog-cancel"
            className="editorial-button editorial-button--secondary px-4 py-2.5 text-sm"
          >
            {cancelLabel || t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-testid="confirm-dialog-confirm"
            className={[
              "editorial-button px-4 py-2.5 text-sm",
              variant === "danger"
                ? "editorial-button--danger"
                : "editorial-button--primary",
            ].join(" ")}
          >
            {confirmLabel || t("common.confirm")}
          </button>
        </div>

        <p
          className="text-xs mt-4 text-center"
          style={{ color: "var(--editorial-muted)" }}
        >
          {t("common.escToCancel") ?? "ESC"} · Ctrl+Enter
        </p>
      </div>
    </div>
  );

  // 使用 Portal 将对话框渲染到 body 最外层，确保在最上层
  if (typeof window !== "undefined") {
    return createPortal(dialogContent, document.body);
  }

  return null;
}
