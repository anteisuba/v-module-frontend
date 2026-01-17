// lib/context/ToastContext.tsx
// 全局 Toast 系统 - 基于 UX_DESIGN_GUIDELINES.md 原则 01: 系统状态可见性
// 右上角弹出提示，不打断用户操作流

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// Toast 类型
export type ToastType = "success" | "error" | "warning" | "info";

// 单个 Toast 项
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Context 值类型
interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  // 便捷方法
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// 默认显示时长（毫秒）
const DEFAULT_DURATION = 3000;

// 最大同时显示的 Toast 数量
const MAX_TOASTS = 5;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdCounter = useRef(0);

  // 移除 Toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 添加 Toast
  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = DEFAULT_DURATION) => {
      const id = `toast-${++toastIdCounter.current}`;
      
      const newToast: ToastItem = {
        id,
        message,
        type,
        duration,
      };

      setToasts((prev) => {
        // 超过最大数量时移除最早的
        const updated = [...prev, newToast];
        if (updated.length > MAX_TOASTS) {
          return updated.slice(-MAX_TOASTS);
        }
        return updated;
      });

      // 自动移除
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // 便捷方法
  const success = useCallback(
    (message: string, duration?: number) => addToast(message, "success", duration),
    [addToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => addToast(message, "error", duration),
    [addToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, "warning", duration),
    [addToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => addToast(message, "info", duration),
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============= Toast UI 组件 =============

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="通知"
    >
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

interface ToastNotificationProps {
  toast: ToastItem;
  onClose: () => void;
}

function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  // 样式映射 - 黑白极简风格
  const styleMap: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: {
      bg: "bg-white",
      border: "border-black/20",
      icon: "✓",
    },
    error: {
      bg: "bg-white",
      border: "border-red-300",
      icon: "✕",
    },
    warning: {
      bg: "bg-white",
      border: "border-yellow-400",
      icon: "!",
    },
    info: {
      bg: "bg-white",
      border: "border-black/20",
      icon: "i",
    },
  };

  const iconColorMap: Record<ToastType, string> = {
    success: "bg-black text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-black/70 text-white",
  };

  const style = styleMap[toast.type];
  const iconColor = iconColorMap[toast.type];

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-3
        min-w-[280px] max-w-[380px]
        px-4 py-3
        rounded-lg
        border
        shadow-lg
        ${style.bg}
        ${style.border}
        animate-toast-in
      `}
      role="alert"
    >
      {/* 图标 */}
      <div
        className={`
          flex-shrink-0
          w-5 h-5
          rounded-full
          flex items-center justify-center
          text-xs font-bold
          ${iconColor}
        `}
      >
        {style.icon}
      </div>

      {/* 消息内容 */}
      <p className="flex-1 text-sm text-black/90 leading-snug">
        {toast.message}
      </p>

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="
          flex-shrink-0
          w-5 h-5
          rounded-full
          flex items-center justify-center
          text-black/40
          hover:text-black/70
          hover:bg-black/5
          transition-colors
        "
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
}
