// hooks/useToast.ts
// 全局 Toast hook - 使用 ToastContext
// 保持向后兼容的 API，同时支持新的便捷方法

"use client";

import { useToast as useToastContext } from "@/lib/context/ToastContext";

/**
 * 全局 Toast Hook
 * 
 * 使用方式：
 * ```tsx
 * const toast = useToast();
 * 
 * // 便捷方法（推荐）
 * toast.success('保存成功');
 * toast.error('操作失败');
 * toast.warning('请注意');
 * toast.info('提示信息');
 * 
 * // 自定义时长（毫秒）
 * toast.success('保存成功', 5000);
 * 
 * // 兼容旧 API
 * toast.showToast('消息');
 * ```
 */
export function useToast() {
  const context = useToastContext();

  return {
    // 新的便捷方法
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,

    // 向后兼容的方法
    message: context.toasts.length > 0 ? context.toasts[context.toasts.length - 1].message : null,
    showToast: (msg: string) => context.info(msg),
    clearToast: () => {
      // 清除所有 toast（向后兼容）
      context.toasts.forEach((t) => context.removeToast(t.id));
    },

    // 底层方法
    addToast: context.addToast,
    removeToast: context.removeToast,
    toasts: context.toasts,
  };
}
