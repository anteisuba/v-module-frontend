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
  /bvc\.bilivideo\.com/i,
  /CORS.*player\.bilibili\.com/i,
  /SecurityError.*player\.bilibili\.com/i,
  /Failed to read.*\$dialog/i,
  /Blocked a frame with origin.*player\.bilibili\.com/i,
];

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
  if (typeof window === 'undefined') return;

  // 保存原始的 console.error 和 console.warn
  const originalError = console.error;
  const originalWarn = console.warn;

  // 重写 console.error
  console.error = (...args: any[]) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      if (arg?.toString) return arg.toString();
      return String(arg);
    }).join(' ');

    // 检查是否是 Bilibili 相关错误
    if (isBilibiliError(message)) {
      // 在开发环境中可以选择完全忽略，或者只记录一次
      // 这里选择完全忽略，因为这些都是第三方代码的错误
      return;
    }

    // 其他错误正常输出
    originalError.apply(console, args);
  };

  // 重写 console.warn
  console.warn = (...args: any[]) => {
    const message = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      if (arg?.toString) return arg.toString();
      return String(arg);
    }).join(' ');

    // 检查是否是 Bilibili 相关警告
    if (isBilibiliError(message)) {
      // 忽略 Bilibili 相关警告
      return;
    }

    // 其他警告正常输出
    originalWarn.apply(console, args);
  };

  // 过滤全局错误事件
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const source = event.filename || '';
    
    if (isBilibiliError(message, source)) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true); // 使用捕获阶段

  // 过滤未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason || '');
    
    if (isBilibiliError(message)) {
      event.preventDefault();
      return false;
    }
  });
}

