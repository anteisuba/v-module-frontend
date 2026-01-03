// hooks/useKeyboardShortcuts.ts
// 基于原则 07：灵活性与效率

import { useEffect } from "react";

interface KeyboardShortcuts {
  onSave?: () => void;
  onPublish?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCancel?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSave,
  onPublish,
  onUndo,
  onRedo,
  onCancel,
  enabled = true,
}: KeyboardShortcuts) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的快捷键
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // 允许 Ctrl+S 保存（即使是在输入框中）
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          onSave?.();
        }
        return;
      }

      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }

      // Ctrl/Cmd + P: 发布
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        onPublish?.();
      }

      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }

      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        onRedo?.();
      }

      // ESC: 取消/关闭
      if (e.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave, onPublish, onUndo, onRedo, onCancel, enabled]);
}

