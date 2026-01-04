// app/globals.ts
// 这个文件会在应用启动时立即执行，用于安装错误过滤器

import { installErrorFilter } from "@/lib/utils/errorFilter";

// 在客户端立即安装错误过滤器（在 React 组件加载之前）
if (typeof window !== 'undefined') {
  installErrorFilter();
}

