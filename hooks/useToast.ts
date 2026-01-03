// hooks/useToast.ts

import { useState, useCallback } from "react";

interface UseToastOptions {
  duration?: number; // 显示时长（毫秒），默认 1800ms
}

export function useToast(options: UseToastOptions = {}) {
  const { duration = 1800 } = options;
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  const clearToast = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    showToast,
    clearToast,
  };
}

