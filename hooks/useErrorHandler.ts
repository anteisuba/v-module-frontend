// hooks/useErrorHandler.ts
// 基于原则 09：帮助用户识别、诊断和恢复错误

import { useState, useCallback } from "react";
import { ApiError, NetworkError } from "@/lib/api/errors";

/**
 * 将技术错误转换为用户友好的错误消息
 */
function getFriendlyErrorMessage(error: unknown): string {
  // 网络错误
  if (error instanceof NetworkError) {
    return "网络连接异常。请检查网络后重试，或稍后再试。";
  }

  // API 错误
  if (error instanceof ApiError) {
    const status = error.status;
    const message = error.message.toLowerCase();

    // 401 未授权
    if (status === 401 || message.includes("unauthorized") || message.includes("未授权")) {
      return "登录已过期，请重新登录。";
    }

    // 403 禁止访问
    if (status === 403 || message.includes("forbidden") || message.includes("禁止")) {
      return "您没有权限执行此操作。";
    }

    // 404 未找到
    if (status === 404 || message.includes("not found") || message.includes("未找到")) {
      return "请求的资源不存在。";
    }

    // 413 文件过大
    if (status === 413 || message.includes("too large") || message.includes("文件大小")) {
      return "文件大小超过 5MB 限制。请选择较小的文件重试。";
    }

    // 422 验证错误
    if (status === 422 || message.includes("validation") || message.includes("验证")) {
      return error.message || "输入的数据格式不正确，请检查后重试。";
    }

    // 429 请求过多
    if (status === 429 || message.includes("too many requests") || message.includes("请求过多")) {
      return "操作过于频繁，请稍后再试。";
    }

    // 500 服务器错误
    if (status === 500 || status >= 500) {
      return "服务器暂时无法处理请求，请稍后重试。";
    }

    // 其他 API 错误，如果消息友好则直接使用
    if (!message.includes("error") && !message.includes("exception") && !message.includes("错误")) {
      return error.message;
    }
  }

  // 普通错误
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // 网络相关错误
    if (message.includes("failed to fetch") || message.includes("networkerror") || message.includes("网络")) {
      return "网络连接异常。请检查网络后重试，或稍后再试。";
    }

    // 文件相关错误
    if (message.includes("file") && (message.includes("too large") || message.includes("大小"))) {
      return "文件大小超过限制。请选择较小的文件重试。";
    }

    // 如果错误消息看起来友好，直接使用
    if (!message.includes("error") && !message.includes("exception")) {
      return error.message;
    }
  }

  // 默认错误消息
  return "操作失败，请稍后重试。";
}

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((e: unknown) => {
    const friendlyMessage = getFriendlyErrorMessage(e);
    setError(friendlyMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    setError, // 也暴露 setError 以便直接设置错误消息
  };
}

