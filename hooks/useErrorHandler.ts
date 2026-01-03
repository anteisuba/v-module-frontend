// hooks/useErrorHandler.ts

import { useState, useCallback } from "react";
import { ApiError, NetworkError } from "@/lib/api/errors";

export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError) {
      const details = e.details
        ? `\n详情: ${JSON.stringify(e.details, null, 2)}`
        : "";
      setError(e.message + details);
    } else if (e instanceof NetworkError) {
      setError(e.message);
    } else {
      setError(e instanceof Error ? e.message : "操作失败");
    }
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

