// components/ui/ErrorBoundary.tsx

"use client";

import React, { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误，防止整页白屏
 * 
 * 遵循 FSD 架构，放置在 components/ui/ 目录
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 在生产环境可以发送错误到监控服务（如 Sentry）
    if (process.env.NODE_ENV === "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
      // TODO: 集成错误监控服务
      // 示例：Sentry.captureException(error, { contexts: { react: errorInfo } });
    } else {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold">出现了一些问题</h1>
            <p className="mb-6 text-gray-400">
              抱歉，页面加载时出现了错误。请刷新页面重试。
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 rounded-lg bg-red-900/20 p-4 text-left text-sm">
                <p className="font-mono text-red-400">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 overflow-auto text-xs text-gray-500">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-white px-6 py-2 text-black transition-colors hover:bg-gray-200"
              >
                刷新页面
              </button>
              <Link
                href="/"
                className="rounded border border-white/20 px-6 py-2 transition-colors hover:bg-white/10"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
