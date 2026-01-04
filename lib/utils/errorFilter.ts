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
    // 检查所有参数，包括错误对象、堆栈等
    const messages = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      if (arg?.stack) return arg.stack;
      if (arg?.toString) return arg.toString();
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    });
    const fullMessage = messages.join(' ');

    // 检查是否是 Bilibili 相关错误
    if (isBilibiliError(fullMessage)) {
      // 完全忽略 Bilibili 相关错误
      return;
    }

    // 其他错误正常输出
    originalError(...args);
  };

  // 重写 console.warn
  console.warn = (...args: any[]) => {
    // 检查所有参数
    const messages = args.map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      if (arg?.stack) return arg.stack;
      if (arg?.toString) return arg.toString();
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    });
    const fullMessage = messages.join(' ');

    // 检查是否是 Bilibili 相关警告
    if (isBilibiliError(fullMessage)) {
      // 忽略 Bilibili 相关警告
      return;
    }

    // 其他警告正常输出
    originalWarn(...args);
  };

  // 过滤全局错误事件
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const source = event.filename || event.target?.toString() || '';
    const errorString = event.error?.toString() || event.error?.message || '';
    const fullMessage = `${message} ${source} ${errorString}`;
    
    if (isBilibiliError(fullMessage, source)) {
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

