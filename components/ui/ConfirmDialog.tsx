// components/ui/ConfirmDialog.tsx
// 基于原则 03：用户控制与自由 + 05：防错设计

"use client";

import { useEffect, useRef, useState } from "react";
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        pointerEvents: "auto",
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
          zIndex: 100000,
        }}
      >
        <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
        <p className="text-sm text-black/70 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 cursor-pointer border border-black/20 bg-white/70 text-black hover:bg-white/80 active:bg-white/90 px-4 py-2.5 text-sm"
          >
            {cancelLabel || t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 cursor-pointer px-4 py-2.5 text-sm",
              variant === "danger"
                ? "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200"
                : "bg-black text-white hover:bg-black/90 active:bg-black/95",
            ].join(" ")}
          >
            {confirmLabel || t("common.confirm")}
          </button>
        </div>

        <p className="text-xs text-black/40 mt-4 text-center">
          按 ESC 取消，Ctrl+Enter 确认
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

