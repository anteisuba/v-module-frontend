// components/ErrorFilter.tsx

"use client";

import { useEffect } from "react";
import { installErrorFilter } from "@/lib/utils/errorFilter";

/**
 * 错误过滤器组件
 * 在客户端安装错误过滤器，过滤掉 Bilibili 播放器相关的错误和警告
 */
export default function ErrorFilter() {
  useEffect(() => {
    installErrorFilter();
  }, []);

  return null;
}

