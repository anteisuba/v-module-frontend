// lib/utils/errorFilter.ts

/**
 * 过滤 Bilibili 播放器 iframe 内部的错误和警告
 * 这些错误来自第三方代码，我们无法控制，也不影响功能
 */

// Bilibili 相关的错误模式
const BILIBILI_ERROR_PATTERNS = [
  /bili-user-fingerprint/i,
  /@bilibili\/bili-user-fingerprint/i,
  /player\.bilibili\.com/i,
  /Mixed Content.*player\.bilibili\.com/i,
  /Mixed Content.*hdslb\.com/i,
  /bvc\.bilivideo\.com/i,
  /CORS.*player\.bilibili\.com/i,
  /SecurityError.*player\.bilibili\.com/i,
  /Failed to read.*\$dialog/i,
  /Blocked a frame with origin.*player\.bilibili\.com/i,
  /content\.js/i, // Bilibili 浏览器扩展相关
  /hdslb\.com/i, // Bilibili CDN 域名
  /bili-fe-fp/i, // Bilibili 指纹识别
];

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.stack || value.message;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return (value as { message: string }).message;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "stack" in value &&
    typeof (value as { stack?: unknown }).stack === "string"
  ) {
    return (value as { stack: string }).stack;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * 检查错误是否来自 Bilibili 播放器
 */
function isBilibiliError(message: string, source?: string): boolean {
  const fullMessage = `${message} ${source || ''}`;
  return BILIBILI_ERROR_PATTERNS.some((pattern) => pattern.test(fullMessage));
}

/**
 * 安装错误过滤器
 * 在开发环境中过滤掉 Bilibili 播放器相关的错误和警告
 */
export function installErrorFilter() {
  if (typeof window === "undefined") return;

  // 保存原始的 console.error 和 console.warn
  const originalError = console.error;
  const originalWarn = console.warn;

  // 重写 console.error
  console.error = (...args: unknown[]) => {
    const fullMessage = args.map(stringifyUnknown).join(" ");

    // 检查是否是 Bilibili 相关错误
    if (isBilibiliError(fullMessage)) {
      // 完全忽略 Bilibili 相关错误
      return;
    }

    // 其他错误正常输出
    originalError(...args);
  };

  // 重写 console.warn
  console.warn = (...args: unknown[]) => {
    const fullMessage = args.map(stringifyUnknown).join(" ");

    // 检查是否是 Bilibili 相关警告
    if (isBilibiliError(fullMessage)) {
      // 忽略 Bilibili 相关警告
      return;
    }

    // 其他警告正常输出
    originalWarn(...args);
  };

  // 过滤全局错误事件
  window.addEventListener("error", (event) => {
    const message = event.message || "";
    const source = event.filename || String(event.target || "");
    const errorString =
      event.error instanceof Error
        ? event.error.toString()
        : stringifyUnknown(event.error);
    const fullMessage = `${message} ${source} ${errorString}`;

    if (isBilibiliError(fullMessage, source)) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true);

  // 过滤未捕获的 Promise 错误
  window.addEventListener("unhandledrejection", (event) => {
    const message = stringifyUnknown(event.reason);

    if (isBilibiliError(message)) {
      event.preventDefault();
      return false;
    }
  });
}
